import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { env } from "node:process"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { filesOf, hashListing, hashSourcesAt, keyOf, measuredTreeOf, storeAt } from "./cache.ts"
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
 * Hashes a text as Git would keep it, without writing the blob: a listing names its blobs and never reads them.
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
	// The blobs the entries name were never written, and `mktree` refuses a tree naming a missing object without this
	return git([`mktree`, `--missing`], `${entries.join(`\n`)}\n`)
}

/**
 * Builds a tree holding a `harness` directory and one beside it, so that a state of the directory can be put to `hashSourcesAt` without standing on disk.
 * @param files - The path and text of every file under `harness`; a path may hold a directory.
 * @param outside - The text of the one file under the other directory.
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

/** Two sources, their tests and a document, one source-and-test pair in a subdirectory so that a case reads a listing of the whole directory rather than of its top. */
const FILES = { "lint.ts": `a`, "lint.test.ts": `b`, "README.md": `c`, "deep/matrix.ts": `d`, "deep/matrix.test.ts": `e` }

/** A name Git prints quoted in a listing, escaping the quotation mark inside, so the record ends with a quotation mark rather than with the suffix the file is left out by. */
const QUOTED_TEST = `a"b.test.ts`

/**
 * Hashes the sources of a directory holding the files, as the `key.ts` of the oracles and of the sweeps hash the ones on disk.
 * @param files - The path and text of every file under it.
 * @param outside - The text of the file outside it.
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

/** Where the objects a run writes go: `git mktree` writes every tree it builds, so a database of the run's own under `tmp/` keeps the one the worktrees share as it was, and every object a case reads is one it wrote. */
let objects: string

/** What `GIT_OBJECT_DIRECTORY` stood at before, if anything. */
let objectsBefore: string | undefined

/** The hash of the directory as `FILES` spells it, which the first block measures every case against. */
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

// #544: the key hashed the whole `scripts/harness` tree, where the runner's test stands since #540, so rewording a case there sent every oracle and sweep to measure both sides afresh
describe(`the hash of the sources of a directory`, () => {
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

		// A path may hold a tab or a line break, so a name can spell a second record behind this one or on the next line
		expect(hashListing([recordFor(`lint.ts${second}`)])).not.toBe(two)
		expect(hashListing([recordFor(`lint.ts\n${second}`)])).not.toBe(two)
	})
})

// #555: the key hashed the whole `lib/` tree, tests and documents included, so rewording a case sent every oracle and sweep to measure that side afresh; the tree could not be dropped, since the collector reads it
describe(`the tree a result was measured over`, () => {
	/**
	 * Fabricates a side holding a `lib/` of one source, since the database this file writes into holds no revision of this repository.
	 * @returns The hash of the tree of the side, and the hash of the `lib/` tree inside it.
	 */
	function sideHoldingALib (): { side: string, lib: string } {
		let lib = treeOfEntries([`100644 blob ${blobOf(`the rule`)}\tindex.ts`])

		return { side: treeOfEntries([`040000 tree ${lib}\tlib`]), lib }
	}

	it(`is the hash Git keeps of the side's \`lib/\` tree, which no input of the key is`, () => {
		let { side, lib } = sideHoldingALib()

		expect(measuredTreeOf(side)).toEqual({ lib })
	})

	it(`stands under the name the collector has always read, so that a store written on either side of #555 is collected whole by either`, () => {
		// `gc.ts` collects as it loads, so it is read as text. The name is asked of the writer rather than spelled here, so that moving the field turns this red rather than the store empty
		let script = readFileSync(path.join(ROOT, `scripts`, `harness`, `gc.ts`), `utf8`)

		for (let name of Object.keys(measuredTreeOf(sideHoldingALib().side))) expect(script).toMatch(new RegExp(`\\bmeta\\.${name}\\b`, `u`))
	})

	it(`is written into the meta by both writers of a result, since a result the collector cannot reach is taken out at the next collection`, () => {
		// Each writer measures as it loads, so both are read as text
		let writers: [string, string][] = [[`oracles`, `compare.ts`], [`sweeps`, `run.ts`]]

		for (let [directory, file] of writers) expect(readFileSync(path.join(ROOT, `scripts`, directory, file), `utf8`)).toMatch(/\bmeasuredTreeOf\(/u)
	})
})

/** The oracle whose results directory the cases write into. */
const NAME = `converge`

/** The kind that directory stands under. */
const KIND = `oracles`

/**
 * Opens an empty store of a case's own under `tmp/`.
 * @returns The store, and the directory `NAME`'s results stand in.
 */
function emptyStore (): { store: ReturnType<typeof storeAt>, directory: string } {
	let root = mkdtempSync(path.join(ROOT, `tmp`, `cache-store-`))

	return { store: storeAt(root), directory: path.join(root, KIND, NAME) }
}

/**
 * Puts a file under the directory of `NAME`'s results by name, standing for what a run or the collector before [#554](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/554) left behind.
 * @param directory - Where `NAME`'s results stand in the store.
 * @param file - The name.
 */
function leave (directory: string, file: string): void {
	mkdirSync(directory, { recursive: true })
	writeFileSync(path.join(directory, file), `{}`)
}

// #554: the collector took out a result's rows and meta and left its digest, so a sweep meeting the digest went for the rows and died
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
		// A record is named by a tree hash, longer than a key, so it would stand whether the collector walks there or not; the second file is named as a digest, and only a collector that never looks there leaves it
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
		// The script collects as it loads, so it is read as text, as `scripts/sweeps/key.test.ts` holds the runner
		let script = readFileSync(path.join(ROOT, `scripts`, `harness`, `gc.ts`), `utf8`)

		expect(script).toMatch(/\bcollect\(/u)
		expect(script).not.toMatch(/\.json|rmSync/u)
	})
})
