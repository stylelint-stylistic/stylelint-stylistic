import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { env } from "node:process"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { hashAt, hashSourcesAt, keyOf } from "../harness/cache.ts"
import { ROOT } from "../harness/checkout.ts"

import { inputsOf } from "./key.ts"

/** Where the objects of the fabricated side go. `git mktree` writes the tree it builds and cannot be told not to, and a tree no commit points at has no place in the database the worktrees share; it is written here and read beside the real one through `GIT_ALTERNATE_OBJECT_DIRECTORIES`. What `treeOf` writes for the working tree is another matter and goes on going where it goes — a tree of the working tree wherever that differs from `HEAD`, which every run of an oracle or a sweep writes too. It stands under `tmp/`, as the scratch index of `cache.ts` does. */
let objects: string

/** What `GIT_ALTERNATE_OBJECT_DIRECTORIES` stood at before, which is nothing at all unless a caller had it pointed somewhere already. */
let alternatesBefore: string | undefined

/**
 * Runs Git in the repository, writing what it writes into the database of the file's own, and hands back what it printed. Neither subcommand put to it reads an object, which is as well: under these variables the real database is neither the primary one nor among the alternates.
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
	// The blob the entries name was never written — `hash-object` was asked for its hash and not for a copy of it — and a tree naming a missing object is refused without this
	return git([`mktree`, `--missing`], `${entries.join(`\n`)}\n`)
}

/**
 * Fabricates a side whose every path the key hashes holds something else than the working tree does, so that a case asking where an input is taken from cannot pass by the two standing the same. A revision of this repository would not do: the newest one a shallow clone reaches is `HEAD`, whose files are the ones on disk.
 * @returns The hash of the tree, which is what `hashAt` reads a revision down to anyway.
 */
function fabricatedSide (): string {
	let blob = `100644 blob ${git([`hash-object`, `--stdin`], `nothing this repository holds`)}`
	let harness = treeOfEntries([`${blob}\tcache.ts`])
	let oracles = treeOfEntries([`${blob}\tcompare.ts`, `${blob}\tfixtures.ts`])
	let scripts = treeOfEntries([`040000 tree ${harness}\tharness`, `040000 tree ${oracles}\toracles`])

	return treeOfEntries([`040000 tree ${treeOfEntries([`${blob}\tindex.ts`])}\tlib`, `${blob}\tpnpm-lock.yaml`, `040000 tree ${scripts}\tscripts`])
}

beforeAll(() => {
	mkdirSync(path.join(ROOT, `tmp`), { recursive: true })
	objects = mkdtempSync(path.join(ROOT, `tmp`, `oracle-key-objects-`))
	alternatesBefore = env.GIT_ALTERNATE_OBJECT_DIRECTORIES
	// Read from there beside the real database rather than instead of it, since every other hash a case asks for is the working tree's
	env.GIT_ALTERNATE_OBJECT_DIRECTORIES = objects
})

afterAll(() => {
	if (alternatesBefore === undefined) delete env.GIT_ALTERNATE_OBJECT_DIRECTORIES
	else env.GIT_ALTERNATE_OBJECT_DIRECTORIES = alternatesBefore

	rmSync(objects, { recursive: true, force: true })
})

// #561: the builder of this key stood in `compare.ts`, which no case can import, so an input dropped from it turned nothing red — the inputs were whole, and stayed so by nobody's asking
describe(`what an oracle result is kept under`, () => {
	it(`names the oracle, so that six oracles over one side stand under six keys`, () => {
		expect(inputsOf(`converge`, `HEAD`).oracle).toBe(`converge`)
		expect(keyOf(inputsOf(`converge`, `HEAD`))).not.toBe(keyOf(inputsOf(`control`, `HEAD`)))
	})

	it(`names the sources of the oracles, which are the scripts that measure and the corpus they measure`, () => {
		expect(inputsOf(`converge`, `HEAD`).oracles).toBe(hashSourcesAt(`worktree`, `scripts/oracles`))
	})

	it(`names the sources of the harness, which every oracle runs through`, () => {
		expect(inputsOf(`converge`, `HEAD`).harness).toBe(hashSourcesAt(`worktree`, `scripts/harness`))
	})

	it(`takes every input but the rules from the working tree, so that the two sides are asked one question`, () => {
		let side = fabricatedSide()
		let inputs = inputsOf(`converge`, side)

		expect(inputs.lib).toBe(hashAt(side, `lib`))
		expect(inputs.lib).not.toBe(hashAt(`worktree`, `lib`))
		expect(inputs.oracles).toBe(hashSourcesAt(`worktree`, `scripts/oracles`))
		expect(inputs.harness).toBe(hashSourcesAt(`worktree`, `scripts/harness`))
		expect(inputs.lock).toBe(hashAt(`worktree`, `pnpm-lock.yaml`))
	})

	it(`is all the comparison keys a result on, since that file names no hash of its own`, () => {
		// The comparison cannot be imported by a case — it reads `argv`, runs every oracle over the side no entry answers for and writes the report as it loads — so it is read as text instead, which is how `scripts/sweeps/key.test.ts` holds the same rule about the runner of the sweeps
		let comparison = readFileSync(path.join(ROOT, `scripts`, `oracles`, `compare.ts`), `utf8`)

		expect(comparison).toMatch(/\binputsOf\(/u)
		expect(comparison).not.toMatch(/hashAt|hashSourcesAt/u)
	})
})
