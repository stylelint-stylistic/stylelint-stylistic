#!/usr/bin/env node

/**
 * Remembers the state of the tree `make verify` came back green over, and answers whether it has come back green over this one.
 *
 * A run is a minute, and it answers about the tree and about nothing else, so a state already answered for is not asked about twice: `make verify` records here on its way out and the `pre-push` hook asks here first, so a run made by hand a moment before the push is the run the hook finds. A record is a file named by the hash of the tree, under the store the oracles keep their results in — outside every working tree, so a rebase that lands the same tree in another worktree finds it too.
 *
 * The hash is taken twice, which is what `tree` is for: once before the checks start and once as they finish. A session goes on editing while a run of a minute goes by, and a record written from the tree as it stands at the end would name a state no check ever read. Where the two hashes differ nothing is recorded at all, since the checks then read neither state whole.
 *
 * `tree` prints the hash, `record <hash>` writes a record where the tree still stands at that hash, and `check` exits 0 where a record stands and 1 where none does.
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
