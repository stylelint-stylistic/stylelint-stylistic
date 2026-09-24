#!/usr/bin/env node

/**
 * Holds the type refusing a contradicting pair in the editor in step with the table refusing it at the run ([#743](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/743)).
 *
 * Every pair of a rule and a partner under every option each takes is written out as a call of `defineStylistic`, one per line, and `tsc` is asked which lines it refuses; the run's table is asked the same, and a line either alone refuses is printed. The compiler is driven as a process because TypeScript 7 ships no API to ask it a type question of; once one is back, the pairs can be checked in a program held in memory, without a file or a process, and this script can move into the module's own test file.
 */

import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { cwd, exit, stdout } from "node:process"

import { contradictionsAmong } from "../lib/utils/contradictingSettings/index.ts"

import { RULE_OPTIONS } from "./oracles/options.ts"

/** The rules a setting may contradict outside its own twin: the empty line in front of a closing brace, the rules leaving it no room, and whitespace behind a call. */
const PARTNERS_OF_EVERY_RULE = [`block-closing-brace-empty-line-before`, `block-closing-brace-newline-before`, `block-closing-brace-space-before`, `max-empty-lines`, `function-whitespace-after`]

/** The rules whose partners are every other rule, so that the two tables are compared over every setting they could name. */
const RULES_AGAINST_EVERY_OTHER = new Set([`function-whitespace-after`, `block-closing-brace-empty-line-before`])

/** The options `RULE_OPTIONS` leaves out that the table names. */
const EXTRA_OPTIONS: Record<string, unknown[]> = { "max-empty-lines": [0] }

/** The compiler's options, the project's own spelled out, since the file stands outside the project; `--pretty false` keeps the `file(line,column): error` shape the count reads, which `tsc` gives up for the colored one wherever `FORCE_COLOR` is set, as CI sets it. */
const COMPILER_OPTIONS = [`--noEmit`, `--pretty`, `false`, `--ignoreConfig`, `--module`, `esnext`, `--moduleResolution`, `bundler`, `--target`, `esnext`, `--strict`, `--exactOptionalPropertyTypes`, `--noUncheckedIndexedAccess`, `--allowImportingTsExtensions`, `--erasableSyntaxOnly`, `--skipLibCheck`]

/**
 * Lists every pair of a rule and a partner under every option each takes.
 * @returns The pairs: rule, its option, partner, its option.
 */
function pairsOf (): [string, unknown, string, unknown][] {
	let rules = Object.keys(RULE_OPTIONS)
	let pairs: [string, unknown, string, unknown][] = []

	for (let rule of rules) {
		let partners = new Set(PARTNERS_OF_EVERY_RULE)

		if (rule.includes(`-newline-`)) partners.add(rule.replace(`-newline-`, `-space-`))
		if (RULES_AGAINST_EVERY_OTHER.has(rule)) for (let name of rules) partners.add(name)

		partners.delete(rule)

		for (let partner of partners) {
			if (!rules.includes(partner)) continue

			for (let one of RULE_OPTIONS[rule] ?? []) for (let other of [...RULE_OPTIONS[partner] ?? [], ...EXTRA_OPTIONS[partner] ?? []]) pairs.push([rule, one, partner, other])
		}
	}

	return pairs
}

let pairs = pairsOf()
let lines = pairs.map(([rule, one, partner, other]) => `defineStylistic({ rules: { "${rule}": ${JSON.stringify(one)}, "${partner}": ${JSON.stringify(other)} } })`)
let directory = mkdtempSync(path.join(tmpdir(), `contradiction-types-`))
let file = path.join(directory, `probe.ts`)
// The import line's own objections, about a `.ts` import by an absolute path, are not a pair's and are left out of the count
let head = [`import { defineStylistic } from "${path.join(cwd(), `lib`, `defineStylistic`, `index.ts`)}"`, ``]

writeFileSync(file, [...head, ...lines, ``].join(`\n`))

let refusedByTypes: Set<number>

try {
	let tsc = spawnSync(path.join(cwd(), `node_modules`, `.bin`, `tsc`), [...COMPILER_OPTIONS, file], { encoding: `utf8` })

	refusedByTypes = new Set([...tsc.stdout.matchAll(/probe\.ts\((\d+),\d+\): error/gu)].map((match) => Number(match[1]) - head.length - 1).filter((at) => at >= 0))
}
finally {
	rmSync(directory, { recursive: true, force: true })
}

let refusedAtRun = new Set(pairs.flatMap(([rule, one, partner, other], at) => (contradictionsAmong([{ name: rule, shortName: rule, primary: one }, { name: partner, shortName: partner, primary: other }]).length > 0 ? [at] : [])))
let onlyTypes = [...refusedByTypes].filter((at) => !refusedAtRun.has(at))
let onlyRun = [...refusedAtRun].filter((at) => !refusedByTypes.has(at))

stdout.write(`${pairs.length} pairs, ${refusedAtRun.size} refused at the run and ${refusedByTypes.size} by the types\n`)

if (onlyTypes.length > 0 || onlyRun.length > 0) {
	for (let at of onlyTypes) stdout.write(`\tThe types alone refuse: ${lines[at]}\n`)
	for (let at of onlyRun) stdout.write(`\tThe run alone refuses: ${lines[at]}\n`)
	exit(1)
}
