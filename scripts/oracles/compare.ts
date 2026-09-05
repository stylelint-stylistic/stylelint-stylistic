#!/usr/bin/env node

/**
 * Compares the oracles' answers about a base with their answers about a branch, measuring only what has not been measured before.
 *
 * Every result is kept by what it depends on — see `scripts/harness/cache.ts` — so the two sides are first looked up, and only a side no entry answers for is measured. Each oracle is started once per missing side, with the branch's scripts and corpus over that side's `lib/`, so that the two sides are always asked the same question; and the diff of the six is written to `tmp/oracles-diff.md`, row by row and never by count.
 */

import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { argv, env, stdout } from "node:process"

import { keyOf, read, write } from "../harness/cache.ts"
import { defaultBase, libAt, ROOT, type Side } from "../harness/checkout.ts"
import { diff, render } from "../harness/diff.ts"

import { inputsOf } from "./key.ts"

/** The oracles, in the order `make oracles` has always run them. */
const ORACLES = [`converge`, `control`, `comments`, `twins`, `nodes`, `pairs`]

/** The fields that tell one row from another; everything else a row holds is what the oracle found there. */
const IDENTITY = [`kind`, `rule`, `primary`, `syntaxName`, `name`, `spelling`, `a`, `b`]

/**
 * Keys the rows of one oracle by their identity.
 * @param rows - The rows.
 * @returns The rows by key; two rows of one identity are told apart by their place.
 */
function keyed (rows: Record<string, unknown>[]): Record<string, object> {
	let result: Record<string, object> = {}

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
 * @param oracle - The oracle.
 * @param revision - The side.
 * @returns The rows.
 */
function run (oracle: string, revision: string): Record<string, unknown>[] {
	let output = execFileSync(`node`, [path.join(ROOT, `scripts`, `oracles`, `${oracle}.ts`)], { cwd: ROOT, encoding: `utf8`, maxBuffer: 1024 * 1024 * 256, env: { ...env, HARNESS_LIB: libAt(revision) } })

	return JSON.parse(output)
}

let [base = defaultBase(), head = `worktree`] = argv.slice(2)

let sides: Record<Side, string> = { base, head }

let plan: {
	side: Side,
	revision: string,
	oracle: string,
	key: string,
	inputs: Record<string, string>,
}[] = []

let results: Record<Side, Record<string, Record<string, unknown>[]>> = { base: {}, head: {} }

/**
 * Hands back the rows of one oracle over one side, which every oracle has by the time the report is written.
 * @param side - The side.
 * @param oracle - The oracle.
 * @returns The rows.
 */
function rowsOf (side: Side, oracle: string): Record<string, unknown>[] {
	let rows = results[side][oracle]

	if (!rows) throw new Error(`${oracle} has no rows over ${side}`)

	return rows
}

for (let side of [`base`, `head`] as const) {
	let revision = sides[side]

	for (let oracle of ORACLES) {
		let inputs = inputsOf(oracle, revision)
		let key = keyOf(inputs)
		let rows = read<Record<string, unknown>[]>(`oracles`, oracle, key)

		if (rows) results[side][oracle] = rows
		else plan.push({ side, revision, oracle, key, inputs })
	}
}

// Two sides standing on one `lib/` tree — a branch that has not touched a rule yet — ask one question, and one run answers it for both
let answered: Map<string, typeof plan> = new Map()

plan = plan.filter((item) => {
	let twins = answered.get(item.key)

	if (twins) {
		twins.push(item)

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

	for (let twin of answered.get(item.key) ?? []) results[twin.side][twin.oracle] = rows
}

let report = [`# Oracles: ${base} → ${head}`, ``]
let summary = []

for (let oracle of ORACLES) {
	let result = diff(keyed(rowsOf(`base`, oracle)), keyed(rowsOf(`head`, oracle)))

	summary.push(`${oracle}: ${rowsOf(`head`, oracle).length} rows, +${result.added.length} −${result.removed.length} ~${result.changed.length}`)
	report.push(`## ${oracle}`, ``, render(result, keyed(rowsOf(`base`, oracle)), keyed(rowsOf(`head`, oracle))))
}

mkdirSync(path.join(ROOT, `tmp`), { recursive: true })
writeFileSync(path.join(ROOT, `tmp`, `oracles-diff.md`), `${report.join(`\n`)}\n`)

for (let line of summary) stdout.write(`\t${line}\n`)

stdout.write(`\t✅ Written to tmp/oracles-diff.md: a row the branch added is a defect it introduced, a row it removed goes in the pull request body.\n\n`)
