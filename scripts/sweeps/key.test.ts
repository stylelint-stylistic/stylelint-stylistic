import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { env } from "node:process"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { hashAt, hashSourcesAt, keyOf } from "../harness/cache.ts"
import { ROOT } from "../harness/checkout.ts"

import { inputsOf } from "./key.ts"

/** A sweep module standing in for any: every input but `sweep` is the same whichever is asked about. */
const SWEEP = path.join(ROOT, `scripts`, `sweeps`, `eol.ts`)

/** Where the objects of the fabricated side go: `git mktree` writes every tree it builds, and a tree no commit points at has no place in the database the worktrees share, so it is written under `tmp/` and read beside the real one through `GIT_ALTERNATE_OBJECT_DIRECTORIES`. What `treeOf` writes for the working tree goes where every oracle and sweep run writes it. */
let objects: string

/** What `GIT_ALTERNATE_OBJECT_DIRECTORIES` stood at before, if anything. */
let alternatesBefore: string | undefined

/**
 * Runs Git in the repository, writing into the database of the file's own, and hands back what it printed. Neither subcommand put to it reads an object, which is as well: under these variables the real database is neither the primary one nor an alternate.
 * @param args - The subcommand and its arguments.
 * @param input - The text to write to its standard input.
 * @returns Standard output, trimmed.
 */
function git (args: string[], input: string): string {
	return execFileSync(`git`, args, { cwd: ROOT, encoding: `utf8`, input, env: { ...env, GIT_OBJECT_DIRECTORY: objects } }).trim()
}

/**
 * Writes a tree of the entries.
 * @param entries - The entries it holds, in the shape `git mktree` reads: a mode, a type, a hash and a name.
 * @returns The hash of the tree.
 */
function treeOfEntries (entries: string[]): string {
	// The blob the entries name was never written, and `mktree` refuses a tree naming a missing object without this
	return git([`mktree`, `--missing`], `${entries.join(`\n`)}\n`)
}

/**
 * Fabricates a side whose every path the key hashes differs from the working tree, so that a case asking where an input is taken from cannot pass by the two standing the same. No revision of this repository would do: the newest a shallow clone reaches is `HEAD`, whose files are the ones on disk.
 * @returns The hash of the tree, which is what `hashAt` reads a revision down to.
 */
function fabricatedSide (): string {
	let blob = `100644 blob ${git([`hash-object`, `--stdin`], `nothing this repository holds`)}`
	let harness = treeOfEntries([`${blob}\tcache.ts`])
	let oracles = treeOfEntries([`${blob}\tfixtures.ts`])
	let sweeps = treeOfEntries([`${blob}\teol.ts`, `${blob}\trun.ts`])
	let scripts = treeOfEntries([`040000 tree ${harness}\tharness`, `040000 tree ${oracles}\toracles`, `040000 tree ${sweeps}\tsweeps`])

	return treeOfEntries([`040000 tree ${treeOfEntries([`${blob}\tindex.ts`])}\tlib`, `${blob}\tpnpm-lock.yaml`, `040000 tree ${scripts}\tscripts`])
}

/**
 * Fabricates two sides whose `lib/` trees hold the same one source and part in the test beside it.
 * @returns The hash of each tree.
 */
function sidesPartingInATest (): [string, string] {
	let source = `100644 blob ${git([`hash-object`, `--stdin`], `the rule`)}\tindex.ts`

	/**
	 * Builds the side whose test holds the text.
	 * @param test - What the test beside the source holds.
	 * @returns The hash of the side's tree.
	 */
	function sideWhoseTestHolds (test: string): string {
		return treeOfEntries([`040000 tree ${treeOfEntries([source, `100644 blob ${git([`hash-object`, `--stdin`], test)}\tindex.test.ts`])}\tlib`])
	}

	return [sideWhoseTestHolds(`one case`), sideWhoseTestHolds(`the same case, reworded`)]
}

beforeAll(() => {
	mkdirSync(path.join(ROOT, `tmp`), { recursive: true })
	objects = mkdtempSync(path.join(ROOT, `tmp`, `sweep-key-objects-`))
	alternatesBefore = env.GIT_ALTERNATE_OBJECT_DIRECTORIES
	// Beside the real database rather than instead of it, since every other hash a case asks for is the working tree's
	env.GIT_ALTERNATE_OBJECT_DIRECTORIES = objects
})

afterAll(() => {
	if (alternatesBefore === undefined) delete env.GIT_ALTERNATE_OBJECT_DIRECTORIES
	else env.GIT_ALTERNATE_OBJECT_DIRECTORIES = alternatesBefore

	rmSync(objects, { recursive: true, force: true })
})

// #553: the key carried neither `scripts/sweeps/run.ts`, where every row is measured, nor `scripts/oracles`, whose corpus and option list `eol.ts` imports, so an edit to either was answered out of the store by rows measured before it
describe(`what a sweep result is kept under`, () => {
	it(`names the runner, where every row is measured, under a name of its own`, () => {
		let inputs = inputsOf(SWEEP, `HEAD`)

		expect(inputs.runner).toBe(hashAt(`worktree`, `scripts/sweeps/run.ts`))
		// A name standing at the hash another name already stands at names nothing of its own
		expect(Object.entries(inputs).filter(([, hash]) => hash === inputs.runner)).toHaveLength(1)
	})

	it(`names the sources of the oracles, whose corpus a sweep reads`, () => {
		expect(inputsOf(SWEEP, `HEAD`).oracles).toBe(hashSourcesAt(`worktree`, `scripts/oracles`))
	})

	it(`names the sweep module itself rather than the directory it stands in`, () => {
		expect(inputsOf(SWEEP, `HEAD`).sweep).toBe(hashAt(`worktree`, `scripts/sweeps/eol.ts`))
	})

	it(`names the sources of the rules, so that a test of a rule standing beside them moves no key`, () => {
		let [one, another] = sidesPartingInATest()

		expect(hashAt(one, `lib`)).not.toBe(hashAt(another, `lib`))
		expect(inputsOf(SWEEP, one).libSources).toBe(hashSourcesAt(one, `lib`))
		expect(keyOf(inputsOf(SWEEP, one))).toBe(keyOf(inputsOf(SWEEP, another)))
	})

	it(`carries no hash of the \`lib/\` tree, which the collector reaches a result by and the meta names instead`, () => {
		let side = sidesPartingInATest()[0]

		expect(Object.values(inputsOf(SWEEP, side))).not.toContain(hashAt(side, `lib`))
	})

	it(`takes every input but the rules from the working tree, so that the two sides are asked one question`, () => {
		let side = fabricatedSide()
		let inputs = inputsOf(SWEEP, side)

		expect(inputs.libSources).toBe(hashSourcesAt(side, `lib`))
		expect(inputs.libSources).not.toBe(hashSourcesAt(`worktree`, `lib`))
		expect(inputs.sweep).toBe(hashAt(`worktree`, `scripts/sweeps/eol.ts`))
		expect(inputs.runner).toBe(hashAt(`worktree`, `scripts/sweeps/run.ts`))
		expect(inputs.oracles).toBe(hashSourcesAt(`worktree`, `scripts/oracles`))
		expect(inputs.harness).toBe(hashSourcesAt(`worktree`, `scripts/harness`))
		expect(inputs.lock).toBe(hashAt(`worktree`, `pnpm-lock.yaml`))
	})

	it(`is all the runner keys a result on, since that file names no hash of its own`, () => {
		// The runner measures as it loads, so it is read as text, as `lib/syntaxes/index.test.ts` holds a rule about a module it does not run
		let runner = readFileSync(path.join(ROOT, `scripts`, `sweeps`, `run.ts`), `utf8`)

		expect(runner).toMatch(/\binputsOf\(/u)
		expect(runner).not.toMatch(/hashAt|hashSourcesAt/u)
	})
})
