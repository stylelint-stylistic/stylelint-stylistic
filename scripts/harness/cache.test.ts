import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import path from "node:path"
import { env } from "node:process"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { hashListing, hashSourcesAt } from "./cache.ts"
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
 * Hashes the sources of a directory holding the files, as `compare.ts` and `run.ts` hash the ones on disk.
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
