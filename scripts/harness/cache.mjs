/**
 * Keeps the result of a run by what it depends on, so that no state of the tree is measured twice.
 *
 * A result depends on the rules that were run — the `lib/` tree — on the scripts and the corpus that ran them, and on the versions of the packages under both; the key is a hash of the hashes Git already keeps of those, and nothing else. So a commit amended for its message or its date keeps its key, a rebase onto a `main` that touched no file of `lib/` keeps it too, and two branches that measure the same base share one entry rather than one apiece. A file of the store is written once and made read-only: a result is deterministic, and a second answer to the same question is a finding rather than an update.
 *
 * The store lives outside every working tree, under `~/.cache/stylelint-stylistic/`, so that it survives a worktree and is shared between them all; `STYLISTIC_CACHE` names another place.
 */

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import { env } from "node:process"

import { ROOT } from "./checkout.mjs"

/** Where the store is. */
const CACHE_DIR = env.STYLISTIC_CACHE ?? path.join(homedir(), `.cache`, `stylelint-stylistic`)

/** The mode a written result is left in: readable by everyone, writable by no one. */
const READ_ONLY = 0o444

/** The index the working tree is hashed through, so that the real one is never touched. */
const SCRATCH_INDEX = path.join(ROOT, `tmp`, `harness-index`)

/**
 * Runs Git in the repository and hands back what it printed.
 * @param {string[]} args - The arguments.
 * @param {object} [extraEnv] - Variables to add to the environment.
 * @returns {string} Standard output, trimmed.
 */
function git (args, extraEnv = {}) {
	return execFileSync(`git`, args, { cwd: ROOT, encoding: `utf8`, env: { ...env, ...extraEnv } }).trim()
}

/** The tree of the working tree as it stands, computed once per process. */
let worktreeTree

/**
 * Resolves a revision to a tree, `worktree` standing for the working tree as it stands — tracked files with their changes, untracked ones included, ignored ones not.
 * @param {string} revision - Anything `git rev-parse` reads, or `worktree`.
 * @returns {string} The hash of the tree.
 */
function treeOf (revision) {
	if (revision !== `worktree`) return git([`rev-parse`, `${revision}^{tree}`])

	if (!worktreeTree) {
		mkdirSync(path.dirname(SCRATCH_INDEX), { recursive: true })
		rmSync(SCRATCH_INDEX, { force: true })

		let indexEnv = { GIT_INDEX_FILE: SCRATCH_INDEX }

		git([`read-tree`, `HEAD`], indexEnv)
		git([`add`, `-A`, `--`, `.`], indexEnv)
		worktreeTree = git([`write-tree`], indexEnv)
		rmSync(SCRATCH_INDEX, { force: true })
	}

	return worktreeTree
}

/**
 * Hashes one path inside a revision — a tree or a blob, whichever the path names.
 * @param {string} revision - Anything `treeOf` reads.
 * @param {string} inside - The path inside it.
 * @returns {string} The hash Git keeps for it.
 */
function hashAt (revision, inside) {
	return git([`rev-parse`, `${treeOf(revision)}:${inside}`])
}

/**
 * Builds the key of a result from what it depends on.
 * @param {object} parts - Every input, as a name and the hash or text it stands at; the order of the names is part of the key.
 * @returns {string} The key.
 */
function keyOf (parts) {
	return createHash(`sha256`).update(JSON.stringify(parts)).digest(`hex`).slice(0, 24)
}

/**
 * Names the file of a result.
 * @param {string} kind - `oracles` or `sweeps`.
 * @param {string} name - The oracle's or the sweep's.
 * @param {string} key - The key.
 * @returns {string} The path.
 */
function fileOf (kind, name, key) {
	return path.join(CACHE_DIR, kind, name, `${key}.json`)
}

/**
 * Reads a kept result.
 * @param {string} kind - `oracles` or `sweeps`.
 * @param {string} name - The oracle's or the sweep's.
 * @param {string} key - The key.
 * @returns {unknown | undefined} The rows, or nothing where none were kept.
 */
function read (kind, name, key) {
	let file = fileOf(kind, name, key)

	if (!existsSync(file)) return

	return JSON.parse(readFileSync(file, `utf8`))
}

/**
 * Keeps a result, once.
 * @param {string} kind - `oracles` or `sweeps`.
 * @param {string} name - The oracle's or the sweep's.
 * @param {string} key - The key.
 * @param {unknown} rows - The result.
 * @param {object} meta - What the key was made of, and where and when the run was made, kept beside the rows for a reader and for the collector.
 * @returns {void}
 */
function write (kind, name, key, rows, meta) {
	let file = fileOf(kind, name, key)

	if (existsSync(file)) throw new Error(`${file} is already written; a result is written once, and a second answer to the same question is a finding rather than an update`)

	mkdirSync(path.dirname(file), { recursive: true })
	writeFileSync(file, `${JSON.stringify(rows, null, `\t`)}\n`)
	writeFileSync(`${file.slice(0, -5)}.meta.json`, `${JSON.stringify({ ...meta, writtenAt: new Date().toISOString() }, null, `\t`)}\n`)
	chmodSync(file, READ_ONLY)
}

export { CACHE_DIR, fileOf, hashAt, keyOf, read, treeOf, write }
