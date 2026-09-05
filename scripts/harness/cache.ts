/**
 * Keeps the result of a run by what it depends on, so that no state of the tree is measured twice.
 *
 * A result depends on the rules that were run — the `lib/` tree — on the scripts and the corpus that ran them, and on the versions of the packages under both; the key is a hash of the hashes Git keeps of those. A directory of scripts stands there as the hash of its sources rather than the one Git keeps of its tree, since a test or a document standing beside a script is not one of the things a result depends on, and rewording either would otherwise send every run that key belongs to — all six oracles, or a sweep — to measure both sides afresh. So a commit amended for its message or its date keeps its key, a rebase onto a `main` that touched no file of `lib/` keeps it too, and two branches that measure the same base share one entry rather than one apiece. A file of the store is written once and made read-only: a result is deterministic, and a second answer to the same question is a finding rather than an update.
 *
 * A result is kept as three files under its key, and it is its meta: the meta is written last, so a key with no meta beside it is a result the store never finished keeping or never finished taking out, and nothing here answers for one. The collector takes such a key out whole, along with every result whose `lib/` tree the caller no longer keeps.
 *
 * The store lives outside every working tree, under `~/.cache/stylelint-stylistic/`, so that it survives a worktree and is shared between them all; `STYLISTIC_CACHE` names another place.
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

/** The kinds of result the store holds, each under a directory of its own with one directory per oracle or per sweep inside it. Whatever else stands under the store — the records `scripts/verified.ts` keeps of the trees `make verify` answered for — is no result, and no function here reads it or takes it out. */
const KINDS = [`oracles`, `sweeps`]

/** The parts a result is kept as, in the order they are written: the rows, one short hash per row, and what the key was made of. The meta comes last so that a key it does not stand under is never a result — whatever the two writes before it left behind where a run died is a file of no result, and the collector takes it out as such. */
const PARTS = [`rows`, `digest`, `meta`] as const

/** How many characters of the hash a key is, which is also how many characters of the name of every file of a result the key is. */
const KEY_LENGTH = 24

/** The mode a written result is left in: readable by everyone, writable by no one. */
const READ_ONLY = 0o444

/** The index the working tree is hashed through, so that the real one is never touched; it is named by the process, since two runs asking for the hash at once would otherwise write over each other's. */
const SCRATCH_INDEX = path.join(ROOT, `tmp`, `harness-index-${pid}`)

/** One of the parts a result is kept as. */
type Part = (typeof PARTS)[number]

/** What the collector counts: the results it took out, the results it kept, and the files it took out that belonged to no result. */
export type Collected = {
	removed: number,
	kept: number,
	stray: number,
}

/**
 * Runs Git in the repository and hands back what it printed.
 * @param args - The arguments.
 * @param extraEnv - Variables to add to the environment.
 * @returns Standard output, trimmed.
 */
function git (args: string[], extraEnv: object = {}): string {
	return execFileSync(`git`, args, { cwd: ROOT, encoding: `utf8`, env: { ...env, ...extraEnv } }).trim()
}

/** The tree of the working tree as it stands, computed once per process. */
let worktreeTree: string | undefined

/**
 * Resolves a revision to a tree, `worktree` standing for the working tree as it stands — tracked files with their changes, untracked ones included, ignored ones not.
 * @param revision - Anything `git rev-parse` reads, or `worktree`.
 * @returns The hash of the tree.
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
			// A name of its own is a file of its own, and a throw between the three calls would leave it standing where the one name every run shared was written over by the next
			rmSync(SCRATCH_INDEX, { force: true })
		}
	}

	return worktreeTree
}

/**
 * Hashes one path inside a revision — a tree or a blob, whichever the path names.
 * @param revision - Anything `treeOf` reads.
 * @param inside - The path inside it.
 * @returns The hash Git keeps for it.
 */
function hashAt (revision: string, inside: string): string {
	return git([`rev-parse`, `${treeOf(revision)}:${inside}`])
}

/** The files standing beside the sources of a directory of scripts, by name: a test of a script and a document about it. Neither is imported by a run, and nothing either can say changes what a run answers, so rewording one moves no result and must move no key. */
const NOT_A_DEPENDENCY = /\.(?:test\.ts|md)$/u

/**
 * Hashes a listing of Git entries, leaving out the ones a result does not depend on.
 * @param entries - The records `git ls-tree -r -z` printed, each a mode, a type, a hash and a path; the empty one the terminator of that format leaves behind is dropped.
 * @returns The hash of what is left, which is the same whether a file a result does not depend on stands there, stands there rewritten, or does not stand there at all.
 */
function hashListing (entries: string[]): string {
	let sources = entries.filter((entry) => entry !== `` && !NOT_A_DEPENDENCY.test(entry))

	// The records are joined by the character they were parted on, which no path and no hash can hold, so one listing is never spelled the same as another — a path may hold a line break, and joining by that would let a file whose name carries one stand for two files
	return createHash(`sha256`).update(sources.join(`\0`)).digest(`hex`)
}

/**
 * Hashes the sources of a directory inside a revision.
 *
 * The hash Git keeps of a tree moves for every file under it, so a directory taken through `hashAt` carries into the key what it holds beside its sources. The blobs are listed and hashed one by one instead, and `hashListing` says which of them a result stands on.
 * @param revision - Anything `treeOf` reads.
 * @param inside - The path of the directory inside it.
 * @returns The hash of its sources.
 */
function hashSourcesAt (revision: string, inside: string): string {
	// `-r` so that a file in a subdirectory is listed as itself rather than arriving inside the hash of that subdirectory's tree, and `-z` rather than the default, under which a path holding a tab or a quotation mark is printed quoted and escaped and the name a file is left out by would be spelled differently from the name it has
	return hashListing(git([`ls-tree`, `-r`, `-z`, `${treeOf(revision)}:${inside}`]).split(`\0`))
}

/**
 * Builds the key of a result from what it depends on.
 * @param parts - Every input, as a name and the hash or text it stands at; the order of the names is part of the key.
 * @returns The key.
 */
function keyOf (parts: object): string {
	return createHash(`sha256`).update(JSON.stringify(parts)).digest(`hex`).slice(0, KEY_LENGTH)
}

/**
 * Names the files a result is kept as, which is the one list whoever writes a result and whoever takes one out both read: a part added here is written and taken out alike, and a file written beside a result under no part of its own has nowhere to be named.
 * @param key - The key.
 * @returns The name of the file of each part, inside the directory of the oracle or the sweep.
 */
function filesOf (key: string): Record<Part, string> {
	return { rows: `${key}.json`, digest: `${key}.digest.json`, meta: `${key}.meta.json` }
}

/**
 * Digests a result down to one short hash per row, so that two results can be compared without either being read whole.
 *
 * A result of the largest sweep is half a million rows and a hundred megabytes of JSON, and a comparison that reads both sides whole spends its seconds parsing text it will find unchanged. The digest is what a comparison reads instead; the rows themselves are read only for the keys the digest says have moved, which is most often none.
 * @param rows - The rows by key.
 * @returns A hash of each row by the same key.
 */
function digestOf (rows: Record<string, unknown> | unknown[]): Record<string, string> {
	let digest: Record<string, string> = {}

	for (let [key, row] of Object.entries(rows)) digest[key] = createHash(`sha1`).update(JSON.stringify(row)).digest(`hex`).slice(0, 16)

	return digest
}

/**
 * Sorts the files of one oracle's or one sweep's directory by the key they stand under.
 * @param directory - The directory.
 * @returns The files of each key, by key; a file no key names — one that is no part of any result — is left out.
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
 * Takes out of one oracle's or one sweep's directory every result the caller does not keep, and every file standing under a key with no meta beside it.
 * @param directory - The directory.
 * @param keeps - Whether a result is kept, asked with its meta.
 * @param tally - Where the results taken out and kept, and the files of no result taken out, are counted.
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
 * Opens a store standing at a directory. The one every run reads is at `CACHE_DIR`, and the functions below are that store's; a suite opens one of its own under `tmp/`, since where the store is is read off the environment as this module loads and a case cannot move it afterwards.
 * @param store - The directory.
 * @returns What can be asked of a store: a kept result, its digest, keeping one, and collecting what is no longer kept.
 */
function storeAt (store: string): {
	read: <T>(kind: string, name: string, key: string) => T | undefined,
	readDigest: (kind: string, name: string, key: string) => Record<string, string> | undefined,
	write: (kind: string, name: string, key: string, rows: Record<string, unknown> | unknown[], meta: object, digest?: Record<string, string>) => void,
	collect: (keeps: (meta: Record<string, unknown>) => boolean) => Collected,
} {
	/** The digests read in this process, by file. */
	let digests = new Map<string, Record<string, string>>()

	/**
	 * Names the file of one part of a result.
	 * @param kind - `oracles` or `sweeps`.
	 * @param name - The oracle's or the sweep's.
	 * @param key - The key.
	 * @param part - The part.
	 * @returns The path.
	 */
	function fileOf (kind: string, name: string, key: string, part: Part): string {
		return path.join(store, kind, name, filesOf(key)[part])
	}

	/**
	 * Reads a kept result.
	 * @param kind - `oracles` or `sweeps`.
	 * @param name - The oracle's or the sweep's.
	 * @param key - The key.
	 * @returns The rows, or nothing where none were kept.
	 */
	function read<T> (kind: string, name: string, key: string): T | undefined {
		let file = fileOf(kind, name, key, `rows`)

		if (!existsSync(file)) return

		return JSON.parse(readFileSync(file, `utf8`)) as T
	}

	/**
	 * Reads the digest of a kept result, which is all a comparison needs until a row has moved.
	 * @param kind - `oracles` or `sweeps`.
	 * @param name - The oracle's or the sweep's.
	 * @param key - The key.
	 * @returns The hash of each row by key, or nothing where no result was kept.
	 */
	function readDigest (kind: string, name: string, key: string): Record<string, string> | undefined {
		let file = fileOf(kind, name, key, `digest`)

		if (!existsSync(file)) return

		// Two sides standing on one tree ask for one digest, and a file of half a million keys is parsed once for both
		if (!digests.has(file)) digests.set(file, JSON.parse(readFileSync(file, `utf8`)))

		return digests.get(file)
	}

	/**
	 * Keeps a result, once, with its digest beside it.
	 * @param kind - `oracles` or `sweeps`.
	 * @param name - The oracle's or the sweep's.
	 * @param key - The key.
	 * @param rows - The result.
	 * @param meta - What the key was made of, and where and when the run was made, kept beside the rows for a reader and for the collector.
	 * @param digest - The digest of the rows, where the caller has it already.
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
	 * Takes out of the store every result the caller does not keep, and every file standing under a key with no meta beside it. Only the directories of results are walked, so whatever else stands under the store is left as it is.
	 * @param keeps - Whether a result is kept, asked with its meta.
	 * @returns How many results were taken out and kept, and how many files of no result were taken out.
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

export { CACHE_DIR, collect, digestOf, filesOf, hashAt, hashListing, hashSourcesAt, keyOf, read, readDigest, storeAt, treeOf, write }
