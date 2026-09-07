#!/usr/bin/env node

/**
 * Records the tree `make verify` came back green over, and answers whether it has for this one: `make verify` records on its way out and the `pre-push` hook asks first. A record is a file named by the tree hash under the oracles' store, outside every working tree.
 *
 * The hash is taken before the checks and again as they finish (`tree`); where the two differ nothing is recorded, since the checks read neither state whole.
 *
 * `tree` prints the hash, `record <hash>` writes a record where the tree still stands at it, and `check` exits 0 where a record stands and 1 where none does.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { argv, exit, stderr, stdout } from "node:process"

import { CACHE_DIR, treeOf } from "./harness/cache.ts"

let mode = argv[2]

if (mode !== `tree` && mode !== `record` && mode !== `check`) {
	stderr.write(`\t❌ ${argv[1]} takes one of \`tree\`, \`record <hash>\` and \`check\`\n`)
	exit(2)
}

let tree = treeOf(`worktree`)
let file = path.join(CACHE_DIR, `verified`, `trees`, `${tree}.json`)

if (mode === `tree`) {
	stdout.write(`${tree}\n`)
}
else if (mode === `record`) {
	let opened = argv[3]

	if (!opened) {
		stderr.write(`\t❌ ${argv[1]} record takes the hash the run opened on\n`)
		exit(2)
	}

	if (opened === tree) {
		mkdirSync(path.dirname(file), { recursive: true })
		writeFileSync(file, `${JSON.stringify({ tree, verifiedAt: new Date().toISOString() }, null, `\t`)}\n`)
		stdout.write(`\t🔖 the tree ${tree.slice(0, 8)} is answered for\n`)
	}
	else {
		stdout.write(`\t🔖 the tree moved while the checks ran, from ${opened.slice(0, 8)} to ${tree.slice(0, 8)}, and neither state is recorded\n`)
	}
}
else if (existsSync(file)) {
	stdout.write(`\t🔖 \`make verify\` came back green over the tree ${tree.slice(0, 8)} already\n`)
}
else {
	exit(1)
}
