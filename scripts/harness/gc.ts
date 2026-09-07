#!/usr/bin/env node

/**
 * Removes from the store every result measured over a `lib/` tree no branch, remote or tag reaches, and every stray file of an unfinished result.
 *
 * Which files make a result, `collect` in `cache.ts` says, so nothing here can fall behind `write`.
 */

import { execFileSync } from "node:child_process"
import { stdout } from "node:process"

import { CACHE_DIR, collect } from "./cache.ts"
import { ROOT } from "./checkout.ts"

let commits = execFileSync(`git`, [`rev-list`, `--branches`, `--remotes`, `--tags`], { cwd: ROOT, encoding: `utf8` }).trim().split(`\n`)
let trees = new Set(execFileSync(`git`, [`cat-file`, `--batch-check=%(objectname)`], { cwd: ROOT, encoding: `utf8`, input: commits.map((commit) => `${commit}:lib\n`).join(``) }).trim().split(`\n`))

let { removed, kept, stray } = collect((meta) => typeof meta.lib === `string` && trees.has(meta.lib))

stdout.write(`\t🧹 ${removed} results removed, ${kept} kept, ${stray} files of no result taken out of ${CACHE_DIR}\n`)
