import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { env } from "node:process"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { filesOf, hashListing, hashSourcesAt, keyOf, storeAt } from "./cache.ts"
import { ROOT } from "./checkout.ts"

/**
 * Runs Git in the repository and hands back what it printed.
 * @param args - The subcommand and its arguments.
 * @param input - The text to write to its standard input, empty where it reads none.
 * @returns Standard output, trimmed.
 */
function git (args: string[], input = ``): string {
	return execFileSync(`git`, args, { cwd: ROOT, encoding: `utf8`, input }).trim()
}

/**
 * Names the blob a text would be kept as, without keeping it: a listing names its blobs and never reads them, so nothing here needs one to stand in the object database.
 * @param content - The text the blob would hold.
 * @returns The hash Git would keep it under.
 */
function blobOf (content: string): string {
	return git([`hash-object`, `--stdin`], content)
}

/**
 * Writes a tree of the entries.
 * @param entries - The entries it holds, in the shape `git mktree` reads: a mode, a type, a hash and a name.
 * @returns The hash of the tree.
 */
function treeOfEntries (entries: string[]): string {
	// The blobs the entries name were never written, and a tree naming a missing object is refused without this
	return git([`mktree`, `--missing`], `${entries.join(`\n`)}\n`)
}

/**
 * Builds a tree holding a directory named `harness` and a second one beside it, so that two states of a directory of scripts can be put to `hashSourcesAt` without either standing on disk.
 * @param files - The path of every file under `harness`, and the text it holds; a path may name a directory of its own.
 * @param outside - The text of the one file standing under the other directory, which is no part of what is asked about.
 * @returns The hash of the tree the two directories stand in.
 */
function treeHolding (files: Record<string, string>, outside = `x`): string {
	let top: string[] = []
	let nested: Record<string, string[]> = {}

	for (let [file, content] of Object.entries(files)) {
		let slash = file.lastIndexOf(`/`)
		let entry = `100644 blob ${blobOf(content)}\t${file.slice(slash + 1)}`

		if (slash === -1) {
			top.push(entry)
			continue
		}

		let directory = file.slice(0, slash)

		nested[directory] ??= []
		nested[directory].push(entry)
	}

	for (let [directory, entries] of Object.entries(nested)) top.push(`040000 tree ${treeOfEntries(entries)}\t${directory}`)

	return treeOfEntries([
		`040000 tree ${treeOfEntries([`100644 blob ${blobOf(outside)}\trule.ts`])}\telsewhere`,
		`040000 tree ${treeOfEntries(top)}\tharness`,
	])
}

/** A directory of two sources, the two tests standing beside them and a document, one pair of source and test in a directory of its own — so that a case reads a listing of the whole directory rather than of the top of it. */
const FILES = { "lint.ts": `a`, "lint.test.ts": `b`, "README.md": `c`, "deep/matrix.ts": `d`, "deep/matrix.test.ts": `e` }

/** A name Git cannot print in a listing as it stands: it puts the whole path in quotation marks and escapes the one inside, so a printed record for it ends with a quotation mark rather than with the name the file is left out by. */
const QUOTED_TEST = `a"b.test.ts`

/**
 * Hashes the sources of a directory holding the files, as the `key.ts` of the oracles and the one of the sweeps hash the ones on disk.
 * @param files - The path of every file under it, and the text it holds.
 * @param outside - The text of the file standing outside it.
 * @returns The hash of its sources.
 */
function hashOf (files: Record<string, string>, outside?: string): string {
	return hashSourcesAt(treeHolding(files, outside), `harness`)
}

/**
 * Writes the record a listing carries for a path.
 * @param file - The path the record names.
 * @param content - The text that file holds.
 * @returns The record, in the shape `git ls-tree` prints.
 */
function recordFor (file: string, content = `a`): string {
	return `100644 blob ${blobOf(content)}\t${file}`
}

/** Where the objects a run writes go. `git mktree` writes the tree it builds and cannot be told not to, and the cases build 32 of them; naming another database keeps the one the worktrees share as it was, and every object a case reads is one it wrote, so a database holding nothing else answers them all. It stands under `tmp/`, as the scratch index of `cache.ts` does. */
let objects: string

/** What `GIT_OBJECT_DIRECTORY` stood at before, which is nothing at all unless a caller had it pointed somewhere already. */
let objectsBefore: string | undefined

/** The hash the directory stands at as `FILES` spells it, which every case of the first block is measured against. */
let baseline: string

beforeAll(() => {
	mkdirSync(path.join(ROOT, `tmp`), { recursive: true })
	objects = mkdtempSync(path.join(ROOT, `tmp`, `cache-objects-`))
	objectsBefore = env.GIT_OBJECT_DIRECTORY
	env.GIT_OBJECT_DIRECTORY = objects
	baseline = hashOf(FILES)
})

afterAll(() => {
	if (objectsBefore === undefined) delete env.GIT_OBJECT_DIRECTORY
	else env.GIT_OBJECT_DIRECTORY = objectsBefore

	rmSync(objects, { recursive: true, force: true })
})

// #544: the key carried the hash Git keeps of the whole `scripts/harness` tree, where the runner's test stands since #540, so a reworded case description there sent every oracle and every sweep to measure both sides afresh
describe(`the hash of a directory of scripts`, () => {
	it(`is the same where a test standing there is rewritten, and where the document beside them is`, () => {
		expect(hashOf({ ...FILES, "lint.test.ts": `rewritten`, "deep/matrix.test.ts": `rewritten` })).toBe(baseline)
		expect(hashOf({ ...FILES, "README.md": `rewritten` })).toBe(baseline)
	})

	it(`is the same where a test whose name Git prints quoted is added and rewritten`, () => {
		expect(hashOf({ ...FILES, [QUOTED_TEST]: `f` })).toBe(baseline)
		expect(hashOf({ ...FILES, [QUOTED_TEST]: `rewritten` })).toBe(baseline)
	})

	it(`is the same where a test is added and where the two standing there are taken away`, () => {
		expect(hashOf({ ...FILES, "cache.test.ts": `f` })).toBe(baseline)
		expect(hashOf({ "lint.ts": `a`, "README.md": `c`, "deep/matrix.ts": `d` })).toBe(baseline)
	})

	it(`is the same where a source outside the directory is rewritten, since the directory is what was asked about`, () => {
		expect(hashOf(FILES, `rewritten`)).toBe(baseline)
	})

	it(`moves where a source is rewritten, wherever under the directory it stands`, () => {
		expect(hashOf({ ...FILES, "lint.ts": `rewritten` })).not.toBe(baseline)
		expect(hashOf({ ...FILES, "deep/matrix.ts": `rewritten` })).not.toBe(baseline)
	})

	it(`moves where a source is added, where one is taken away, and where one is renamed`, () => {
		expect(hashOf({ ...FILES, "gc.ts": `f` })).not.toBe(baseline)
		expect(hashOf({ "lint.ts": `a`, "lint.test.ts": `b`, "README.md": `c`, "deep/matrix.test.ts": `e` })).not.toBe(baseline)
		expect(hashOf({ "linter.ts": `a`, "lint.test.ts": `b`, "README.md": `c`, "deep/matrix.ts": `d`, "deep/matrix.test.ts": `e` })).not.toBe(baseline)
	})
})

describe(`the listing a hash of sources is taken from`, () => {
	it(`carries no record where the terminator of the format stands`, () => {
		expect(hashListing([recordFor(`lint.ts`), ``])).toBe(hashListing([recordFor(`lint.ts`)]))
	})

	it(`leaves out a file whose whole name is a test's or a document's, and no file that merely ends the way one does`, () => {
		let alone = hashListing([recordFor(`lint.ts`)])

		expect(hashListing([recordFor(`lint.ts`), recordFor(`a.test.ts`)])).toBe(alone)
		expect(hashListing([recordFor(`lint.ts`), recordFor(`a.md`)])).toBe(alone)
		// A directory may be named as a test is, and a source may end in the letters one ends in
		expect(hashListing([recordFor(`lint.ts`), recordFor(`a.test.ts/b.ts`)])).not.toBe(alone)
		expect(hashListing([recordFor(`lint.ts`), recordFor(`latest.ts`)])).not.toBe(alone)
	})

	it(`tells one source whose name is spelled like a record from the two files it reads as`, () => {
		let second = recordFor(`gc.ts`)
		let two = hashListing([recordFor(`lint.ts`), second])

		// A path may hold a tab and a line break alike, so a name can be spelled as a record standing right behind this one and as a record on the next line
		expect(hashListing([recordFor(`lint.ts${second}`)])).not.toBe(two)
		expect(hashListing([recordFor(`lint.ts\n${second}`)])).not.toBe(two)
	})
})

/** The directory of one oracle's results in a store of a case's own, and the key of the one result a case keeps there. */
const NAME = `converge`

/** The kind that directory stands under. */
const KIND = `oracles`

/**
 * Opens a store of a case's own under `tmp/`, holding nothing.
 * @returns The store, and the directory `NAME`'s results stand in.
 */
function emptyStore (): { store: ReturnType<typeof storeAt>, directory: string } {
	let root = mkdtempSync(path.join(ROOT, `tmp`, `cache-store-`))

	return { store: storeAt(root), directory: path.join(root, KIND, NAME) }
}

/**
 * Puts a file under the directory of `NAME`'s results by name, standing for what a run or the collector before #554 left behind.
 * @param directory - The directory.
 * @param file - The name.
 */
function leave (directory: string, file: string): void {
	mkdirSync(directory, { recursive: true })
	writeFileSync(path.join(directory, file), `{}`)
}

// #554: the collector took out the rows and the meta of a result and left its digest standing, so the store filled with digests of results it no longer held — 666 of them under `oracles/` — and a sweep meeting one found the digest, went for the rows and died
describe(`the collector of the store`, () => {
	let stores: string[] = []

	afterAll(() => {
		for (let store of stores) rmSync(store, { recursive: true, force: true })
	})

	/**
	 * Opens a store the block will take down.
	 * @returns The store and the directory of `NAME`'s results.
	 */
	function open (): ReturnType<typeof emptyStore> {
		let opened = emptyStore()

		stores.push(path.dirname(path.dirname(opened.directory)))

		return opened
	}

	it(`leaves nothing of a result it takes out`, () => {
		let { store, directory } = open()
		let key = keyOf({ lib: `a` })

		store.write(KIND, NAME, key, [{ rule: `x` }], { lib: `a` })
		expect(readdirSync(directory).toSorted()).toEqual(Object.values(filesOf(key)).toSorted())

		expect(store.collect(() => false)).toEqual({ removed: 1, kept: 0, stray: 0 })
		expect(readdirSync(directory)).toEqual([])
		expect(store.readDigest(KIND, NAME, key)).toBeUndefined()
	})

	it(`keeps a result whole where the caller keeps it, asked with the meta the result was written with`, () => {
		let { store, directory } = open()
		let key = keyOf({ lib: `b` })
		let asked: unknown[] = []

		store.write(KIND, NAME, key, { one: 1 }, { lib: `b`, revision: `HEAD` })

		expect(store.collect((meta) => {
			asked.push(meta)

			return meta.lib === `b`
		})).toEqual({ removed: 0, kept: 1, stray: 0 })
		expect(asked).toEqual([expect.objectContaining({ lib: `b`, revision: `HEAD` })])
		expect(readdirSync(directory).toSorted()).toEqual(Object.values(filesOf(key)).toSorted())
		expect(store.read(KIND, NAME, key)).toEqual({ one: 1 })
		expect(store.readDigest(KIND, NAME, key)).toEqual({ one: expect.any(String) })
	})

	it(`takes out a digest standing under a key with no meta, as a file of no result rather than as a result`, () => {
		let { store, directory } = open()
		let key = keyOf({ lib: `c` })

		leave(directory, filesOf(key).digest)

		expect(store.collect(() => true)).toEqual({ removed: 0, kept: 0, stray: 1 })
		expect(readdirSync(directory)).toEqual([])
		expect(store.readDigest(KIND, NAME, key)).toBeUndefined()
	})

	it(`takes out the rows and the digest a run died between writing and writing the meta of`, () => {
		let { store, directory } = open()
		let key = keyOf({ lib: `d` })

		leave(directory, filesOf(key).rows)
		leave(directory, filesOf(key).digest)

		expect(store.collect(() => true)).toEqual({ removed: 0, kept: 0, stray: 2 })
		expect(readdirSync(directory)).toEqual([])
	})

	it(`leaves a file no key names where it stands, beside the result it takes out`, () => {
		let { store, directory } = open()
		let key = keyOf({ lib: `e` })

		store.write(KIND, NAME, key, [], { lib: `e` })
		leave(directory, `notes.md`)
		leave(directory, `${key.slice(0, -1)}.json`)

		expect(store.collect(() => false)).toEqual({ removed: 1, kept: 0, stray: 0 })
		expect(readdirSync(directory).toSorted()).toEqual([`${key.slice(0, -1)}.json`, `notes.md`])
	})

	it(`walks the directories of results alone, so that whatever stands under \`verified/\` stays, spelled like a record of \`make verify\` or like a part of a result`, () => {
		let { store, directory } = open()
		let trees = path.join(path.dirname(path.dirname(directory)), `verified`, `trees`)
		// A record is named by a tree, which is longer than a key, so the record alone would stand whether the collector walks that directory or not; the second file is named as a digest is, and only a collector that never looks there leaves it
		let stamp = path.join(trees, `${`0`.repeat(40)}.json`)
		let digest = path.join(trees, filesOf(keyOf({ lib: `f` })).digest)

		mkdirSync(trees, { recursive: true })
		writeFileSync(stamp, `{}\n`)
		writeFileSync(digest, `{}`)

		expect(store.collect(() => false)).toEqual({ removed: 0, kept: 0, stray: 0 })
		expect(existsSync(stamp)).toBe(true)
		expect(existsSync(digest)).toBe(true)
	})

	it(`is all \`gc.ts\` takes out through, since that script names no file of a result itself`, () => {
		// The script cannot be imported by a case — it lists the trees every ref reaches and collects as it loads — so it is read as text instead, the way the fifth case of `scripts/sweeps/key.test.ts` holds the runner
		let script = readFileSync(path.join(ROOT, `scripts`, `harness`, `gc.ts`), `utf8`)

		expect(script).toMatch(/\bcollect\(/u)
		expect(script).not.toMatch(/\.json|rmSync/u)
	})
})
