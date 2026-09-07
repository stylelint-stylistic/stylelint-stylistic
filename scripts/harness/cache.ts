/**
 * Caches the result of a run under a key of its inputs, so no tree is measured twice.
 *
 * The key hashes the Git hashes of the inputs, a directory as the hash of its sources so a reworded test keeps the key. A result is three read-only files, the meta last; without a meta it is unfinished, and the collector removes it and every result whose `lib/` tree is unreachable. The store is `~/.cache/stylelint-stylistic/`; `STYLISTIC_CACHE` overrides it.
 */

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import { env, pid } from "node:process"

import { ROOT } from "./checkout.ts"

/** Where the store is. */
const CACHE_DIR = env.STYLISTIC_CACHE ?? path.join(homedir(), `.cache`, `stylelint-stylistic`)

/** The kinds of result, one directory each; other store contents (`scripts/verified.ts`) are left alone. */
const KINDS = [`oracles`, `sweeps`]

/** The parts of a result, in write order; the meta last. */
const PARTS = [`rows`, `digest`, `meta`] as const

/** The length of a key. */
const KEY_LENGTH = 24

/** The mode of a written result. */
const READ_ONLY = 0o444

/** The index the working tree is hashed through; one per process. */
const SCRATCH_INDEX = path.join(ROOT, `tmp`, `harness-index-${pid}`)

/** A part of a result. */
type Part = (typeof PARTS)[number]

/** Results removed and kept, and stray files removed. */
export type Collected = {
	removed: number,
	kept: number,
	stray: number,
}

/**
 * Runs Git in the repository.
 * @param args - The arguments.
 * @param extraEnv - Extra environment variables.
 * @returns Trimmed stdout.
 */
function git (args: string[], extraEnv: object = {}): string {
	return execFileSync(`git`, args, { cwd: ROOT, encoding: `utf8`, env: { ...env, ...extraEnv } }).trim()
}

/** The working tree's tree hash, computed once. */
let worktreeTree: string | undefined

/**
 * Resolves a revision to a tree hash; `worktree` is the working tree with untracked files.
 * @param revision - A revision, or `worktree`.
 * @returns The tree hash.
 */
function treeOf (revision: string): string {
	if (revision !== `worktree`) return git([`rev-parse`, `${revision}^{tree}`])

	if (!worktreeTree) {
		mkdirSync(path.dirname(SCRATCH_INDEX), { recursive: true })
		rmSync(SCRATCH_INDEX, { force: true })

		let indexEnv = { GIT_INDEX_FILE: SCRATCH_INDEX }

		try {
			git([`read-tree`, `HEAD`], indexEnv)
			git([`add`, `-A`, `--`, `.`], indexEnv)
			worktreeTree = git([`write-tree`], indexEnv)
		}
		finally {
			// A file left by a throw is never reused; the name is per process
			rmSync(SCRATCH_INDEX, { force: true })
		}
	}

	return worktreeTree
}

/**
 * Hashes one path inside a revision.
 * @param revision - As `treeOf` reads it.
 * @param inside - The path.
 * @returns Git's hash.
 */
function hashAt (revision: string, inside: string): string {
	return git([`rev-parse`, `${treeOf(revision)}:${inside}`])
}

/** Files no run imports; rewording one moves no key. */
const NOT_A_DEPENDENCY = /\.(?:test\.ts|md)$/u

/**
 * Hashes a `git ls-tree -r -z` listing without the entries no result depends on.
 * @param entries - The records; the empty last one is dropped.
 * @returns The hash.
 */
function hashListing (entries: string[]): string {
	let sources = entries.filter((entry) => entry !== `` && !NOT_A_DEPENDENCY.test(entry))

	// Joined by NUL; a path may hold a line break
	return createHash(`sha256`).update(sources.join(`\0`)).digest(`hex`)
}

/**
 * Hashes a directory's sources blob by blob, since Git's tree hash moves for a test too.
 * @param revision - As `treeOf` reads it.
 * @param inside - The directory.
 * @returns The hash.
 */
function hashSourcesAt (revision: string, inside: string): string {
	// `-r` flattens subdirectories, `-z` leaves an odd path unquoted
	return hashListing(git([`ls-tree`, `-r`, `-z`, `${treeOf(revision)}:${inside}`]).split(`\0`))
}

/**
 * Names the `lib/` tree a result was measured over, for the meta.
 *
 * The collector reaches a result by this tree, not the key, since it lists the trees of the commits a ref reaches; the name `lib` stays for older checkouts.
 * @param revision - As `treeOf` reads it.
 * @returns The tree under the name the collector reads.
 */
function measuredTreeOf (revision: string): Record<string, string> {
	return { lib: hashAt(revision, `lib`) }
}

/**
 * Builds the key of a result.
 * @param parts - The inputs by name; order counts.
 * @returns The key.
 */
function keyOf (parts: object): string {
	return createHash(`sha256`).update(JSON.stringify(parts)).digest(`hex`).slice(0, KEY_LENGTH)
}

/**
 * Names the files of a result; the collector reads the same list.
 * @param key - The hash of a result's inputs, as `keyOf` builds it.
 * @returns The file name of each part.
 */
function filesOf (key: string): Record<Part, string> {
	return { rows: `${key}.json`, digest: `${key}.digest.json`, meta: `${key}.meta.json` }
}

/**
 * Hashes each row, so a comparison reads only the rows whose digest moved.
 * @param rows - The rows by key.
 * @returns A hash per row, by key.
 */
function digestOf (rows: Record<string, unknown> | unknown[]): Record<string, string> {
	let digest: Record<string, string> = {}

	for (let [key, row] of Object.entries(rows)) digest[key] = createHash(`sha1`).update(JSON.stringify(row)).digest(`hex`).slice(0, 16)

	return digest
}

/**
 * Groups a directory's result files by key; a file no key names is left out.
 * @param directory - The directory of one kind and name whose result files are listed.
 * @returns The files by key.
 */
function filesByKey (directory: string): Map<string, string[]> {
	let keys = new Map<string, string[]>()

	for (let file of readdirSync(directory)) {
		let key = file.slice(0, KEY_LENGTH)

		if (!Object.values(filesOf(key)).includes(file)) continue

		keys.set(key, [...keys.get(key) ?? [], file])
	}

	return keys
}

/**
 * Removes a directory's results `keeps` refuses, and every file under a key with no meta.
 * @param directory - The directory of one kind and name under the store.
 * @param keeps - Asked with the meta.
 * @param tally - The counts.
 */
function collectIn (directory: string, keeps: (meta: Record<string, unknown>) => boolean, tally: Collected): void {
	for (let [key, files] of filesByKey(directory)) {
		let names = filesOf(key)

		if (files.includes(names.meta)) {
			if (keeps(JSON.parse(readFileSync(path.join(directory, names.meta), `utf8`)))) {
				tally.kept += 1
				continue
			}

			tally.removed += 1
		}
		else {
			tally.stray += files.length
		}

		for (let file of Object.values(names)) rmSync(path.join(directory, file), { force: true })
	}
}

/**
 * Opens a store; runs use the one at `CACHE_DIR`, a test suite its own.
 * @param store - The directory.
 * @returns Read, write and collect.
 */
function storeAt (store: string): {
	read: <T>(kind: string, name: string, key: string) => T | undefined,
	readDigest: (kind: string, name: string, key: string) => Record<string, string> | undefined,
	write: (kind: string, name: string, key: string, rows: Record<string, unknown> | unknown[], meta: object, digest?: Record<string, string>) => void,
	collect: (keeps: (meta: Record<string, unknown>) => boolean) => Collected,
} {
	/** Digests read so far, by file. */
	let digests = new Map<string, Record<string, string>>()

	/**
	 * Names the file of one part of a result.
	 * @param kind - `oracles` or `sweeps`.
	 * @param name - The oracle or sweep.
	 * @param key - The hash of the result's inputs.
	 * @param part - Which of the rows, digest or meta files is named.
	 * @returns The path.
	 */
	function fileOf (kind: string, name: string, key: string, part: Part): string {
		return path.join(store, kind, name, filesOf(key)[part])
	}

	/**
	 * Reads a kept result.
	 * @param kind - `oracles` or `sweeps`.
	 * @param name - The oracle or sweep the result belongs to.
	 * @param key - The hash of the result's inputs.
	 * @returns The rows, or undefined.
	 */
	function read<T> (kind: string, name: string, key: string): T | undefined {
		let file = fileOf(kind, name, key, `rows`)

		if (!existsSync(file)) return

		return JSON.parse(readFileSync(file, `utf8`)) as T
	}

	/**
	 * Reads the digest of a kept result.
	 * @param kind - `oracles` or `sweeps`.
	 * @param name - The oracle or sweep the result belongs to.
	 * @param key - The hash of the result's inputs.
	 * @returns The digest, or undefined.
	 */
	function readDigest (kind: string, name: string, key: string): Record<string, string> | undefined {
		let file = fileOf(kind, name, key, `digest`)

		if (!existsSync(file)) return

		// Two sides on one tree share a digest; parsed once
		if (!digests.has(file)) digests.set(file, JSON.parse(readFileSync(file, `utf8`)))

		return digests.get(file)
	}

	/**
	 * Writes a result once, with its digest.
	 * @param kind - `oracles` or `sweeps`.
	 * @param name - The oracle or sweep the result belongs to.
	 * @param key - The hash of the result's inputs.
	 * @param rows - The result.
	 * @param meta - The key's inputs.
	 * @param digest - The rows' digest, if the caller has it.
	 */
	function write (kind: string, name: string, key: string, rows: Record<string, unknown> | unknown[], meta: object, digest?: Record<string, string>): void {
		let file = fileOf(kind, name, key, `rows`)

		if (existsSync(file)) throw new Error(`${file} is already written; a result is written once, and a second answer to the same question is a finding rather than an update`)

		let contents: Record<Part, string> = {
			rows: JSON.stringify(rows),
			digest: JSON.stringify(digest ?? digestOf(rows)),
			meta: `${JSON.stringify({ ...meta, writtenAt: new Date().toISOString() }, null, `\t`)}\n`,
		}

		mkdirSync(path.dirname(file), { recursive: true })

		for (let part of PARTS) writeFileSync(fileOf(kind, name, key, part), contents[part])

		chmodSync(file, READ_ONLY)
		chmodSync(fileOf(kind, name, key, `digest`), READ_ONLY)
	}

	/**
	 * Removes every result `keeps` refuses and every file under a key with no meta.
	 * @param keeps - Asked with the meta.
	 * @returns The counts.
	 */
	function collect (keeps: (meta: Record<string, unknown>) => boolean): Collected {
		let tally: Collected = { removed: 0, kept: 0, stray: 0 }

		for (let kind of KINDS) {
			let directory = path.join(store, kind)

			if (!existsSync(directory)) continue

			for (let entry of readdirSync(directory, { withFileTypes: true })) if (entry.isDirectory()) collectIn(path.join(directory, entry.name), keeps, tally)
		}

		return tally
	}

	return { read, readDigest, write, collect }
}

let { read, readDigest, write, collect } = storeAt(CACHE_DIR)

export { CACHE_DIR, collect, digestOf, filesOf, hashAt, hashListing, hashSourcesAt, keyOf, measuredTreeOf, read, readDigest, storeAt, treeOf, write }
