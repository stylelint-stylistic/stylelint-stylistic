#!/usr/bin/env node

/**
 * Takes out of the store every result measured over a `lib/` that no branch, remote or tag still reaches, and every file of a result the store no longer holds.
 *
 * The rules a result was measured over are named in its meta, as the hash of the `lib/` tree; the trees of every commit a ref reaches are listed in one call; and a result whose tree is in neither list belongs to a state of the tree that only the reflog still knows. What is kept is never touched. Which files a result is kept as, and which of them a key with no meta may still be standing under, is the store's to say — `collect` in `cache.ts` names them, so that nothing is spelled here that could fall behind what `write` puts beside a result.
 */

import { execFileSync } from "node:child_process"
import { stdout } from "node:process"

import { CACHE_DIR, collect } from "./cache.ts"
import { ROOT } from "./checkout.ts"

let commits = execFileSync(`git`, [`rev-list`, `--branches`, `--remotes`, `--tags`], { cwd: ROOT, encoding: `utf8` }).trim().split(`\n`)
let trees = new Set(execFileSync(`git`, [`cat-file`, `--batch-check=%(objectname)`], { cwd: ROOT, encoding: `utf8`, input: commits.map((commit) => `${commit}:lib\n`).join(``) }).trim().split(`\n`))

let { removed, kept, stray } = collect((meta) => typeof meta.lib === `string` && trees.has(meta.lib))

stdout.write(`\t🧹 ${removed} results removed, ${kept} kept, ${stray} files of no result taken out of ${CACHE_DIR}\n`)
