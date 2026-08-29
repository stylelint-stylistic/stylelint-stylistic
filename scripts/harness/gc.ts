#!/usr/bin/env node

/**
 * Takes out of the store every result measured over a `lib/` that no branch, remote or tag still reaches.
 *
 * The rules a result was measured over are named in the file beside it, as the hash of the `lib/` tree; the trees of every commit a ref reaches are listed in one call; and a result whose tree is in neither list belongs to a state of the tree that only the reflog still knows. What is kept is never touched.
 */

import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { stdout } from "node:process"

import { CACHE_DIR } from "./cache.ts"
import { ROOT } from "./checkout.ts"

let commits = execFileSync(`git`, [`rev-list`, `--branches`, `--remotes`, `--tags`], { cwd: ROOT, encoding: `utf8` }).trim().split(`\n`)
let trees = new Set(execFileSync(`git`, [`cat-file`, `--batch-check=%(objectname)`], { cwd: ROOT, encoding: `utf8`, input: commits.map((commit) => `${commit}:lib\n`).join(``) }).trim().split(`\n`))
let removed = 0
let kept = 0

for (let kind of readdirSync(CACHE_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
	for (let name of readdirSync(path.join(CACHE_DIR, kind.name))) {
		let directory = path.join(CACHE_DIR, kind.name, name)

		for (let file of readdirSync(directory).filter((entry) => entry.endsWith(`.meta.json`))) {
			let meta = JSON.parse(readFileSync(path.join(directory, file), `utf8`))

			if (trees.has(meta.lib)) {
				kept += 1
				continue
			}

			rmSync(path.join(directory, file), { force: true })
			rmSync(path.join(directory, file.replace(`.meta.json`, `.json`)), { force: true })
			removed += 1
		}
	}
}

stdout.write(`\t🧹 ${removed} results removed, ${kept} kept in ${CACHE_DIR}\n`)
