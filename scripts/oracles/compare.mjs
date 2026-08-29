#!/usr/bin/env node

/**
 * Compares the oracles' answers about a base with their answers about a branch, measuring only what has not been measured before.
 *
 * Every result is kept by what it depends on — see `scripts/harness/cache.mjs` — so the two sides are first looked up, and only a side no entry answers for is measured. Each oracle is started once per missing side, with the branch's scripts and corpus over that side's `lib/`, so that the two sides are always asked the same question; and the diff of the six is written to `tmp/oracles-diff.md`, row by row and never by count.
 */

import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { argv, env, stdout } from "node:process"

import { hashAt, keyOf, read, write } from "../harness/cache.mjs"
import { defaultBase, libAt, ROOT } from "../harness/checkout.mjs"
import { diff, render } from "../harness/diff.mjs"

/** The oracles, in the order `make oracles` has always run them. */
const ORACLES = [`converge`, `control`, `comments`, `twins`, `nodes`, `pairs`]

/** The fields that tell one row from another; everything else a row holds is what the oracle found there. */
const IDENTITY = [`kind`, `rule`, `primary`, `syntaxName`, `name`, `spelling`, `a`, `b`]

/**
 * Names the inputs a result of one oracle over one side depends on.
 * @param {string} oracle - The oracle.
 * @param {string} revision - The side, as `hashAt` reads it.
 * @returns {object} The inputs, each as the hash Git keeps for it; the scripts and the corpus are always the working tree's.
 */
function inputsOf (oracle, revision) {
	return { oracle, lib: hashAt(revision, `lib`), oracles: hashAt(`worktree`, `scripts/oracles`), harness: hashAt(`worktree`, `scripts/harness`), lock: hashAt(`worktree`, `pnpm-lock.yaml`) }
}

/**
 * Keys the rows of one oracle by their identity.
 * @param {object[]} rows - The rows.
 * @returns {Record<string, object>} The rows by key; two rows of one identity are told apart by their place.
 */
function keyed (rows) {
	let result = {}

	for (let row of rows) {
		let identity = JSON.stringify(Object.fromEntries(IDENTITY.filter((field) => field in row).map((field) => [field, row[field]])))
		let key = identity

		for (let index = 2; key in result; index += 1) key = `${identity} #${index}`

		result[key] = row
	}

	return result
}

/**
 * Runs one oracle over one side, with the working tree's scripts.
 * @param {string} oracle - The oracle.
 * @param {string} revision - The side.
 * @returns {object[]} The rows.
 */
function run (oracle, revision) {
	let output = execFileSync(`node`, [path.join(ROOT, `scripts`, `oracles`, `${oracle}.mjs`)], { cwd: ROOT, encoding: `utf8`, maxBuffer: 1024 * 1024 * 256, env: { ...env, HARNESS_LIB: libAt(revision) } })

	return JSON.parse(output)
}

let [base = defaultBase(), head = `worktree`] = argv.slice(2)
let sides = { base, head }
let plan = []
let results = { base: {}, head: {} }

for (let [side, revision] of Object.entries(sides)) {
	for (let oracle of ORACLES) {
		let inputs = inputsOf(oracle, revision)
		let key = keyOf(inputs)
		let rows = read(`oracles`, oracle, key)

		if (rows) results[side][oracle] = rows
		else plan.push({ side, revision, oracle, key, inputs })
	}
}

// Two sides standing on one `lib/` tree — a branch that has not touched a rule yet — ask one question, and one run answers it for both
let answered = new Map()

plan = plan.filter((item) => {
	if (answered.has(item.key)) {
		answered.get(item.key).push(item)

		return false
	}

	answered.set(item.key, [])

	return true
})

for (let item of plan) {
	let started = performance.now()
	let rows = run(item.oracle, item.revision)

	stdout.write(`\t🔮 ${item.oracle} over ${item.side} (${item.revision}) — ${((performance.now() - started) / 1000).toFixed(1)} s, ${rows.length} rows\n`)

	write(`oracles`, item.oracle, item.key, rows, { ...item.inputs, revision: item.revision, root: ROOT })
	results[item.side][item.oracle] = rows

	for (let twin of answered.get(item.key)) results[twin.side][twin.oracle] = rows
}

let report = [`# Oracles: ${base} → ${head}`, ``]
let summary = []

for (let oracle of ORACLES) {
	let result = diff(keyed(results.base[oracle]), keyed(results.head[oracle]))

	summary.push(`${oracle}: ${results.head[oracle].length} rows, +${result.added.length} −${result.removed.length} ~${result.changed.length}`)
	report.push(`## ${oracle}`, ``, render(result, keyed(results.base[oracle]), keyed(results.head[oracle])))
}

mkdirSync(path.join(ROOT, `tmp`), { recursive: true })
writeFileSync(path.join(ROOT, `tmp`, `oracles-diff.md`), `${report.join(`\n`)}\n`)

for (let line of summary) stdout.write(`\t${line}\n`)

stdout.write(`\t✅ Written to tmp/oracles-diff.md: a row the branch added is a defect it introduced, a row it removed goes in the pull request body.\n\n`)
