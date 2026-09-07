#!/usr/bin/env node

/**
 * Runs one sweep on both sides and writes the diff. Started through `make sweep FILE=…`.
 *
 * A sweep module exports its `name`, `corpus` of keyed texts, `configs` and `syntaxes`. Every text is linted under each, checked and fixed, on base and branch; `tmp/sweeps/<name>.md` holds what moved. A side stands in the store as a digest of one short hash per row, so the rows are read only for the keys that moved.
 */

import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { argv, exit, stderr, stdout } from "node:process"

import { digestOf, keyOf, measuredTreeOf, read, readDigest, write } from "../harness/cache.ts"
import { defaultBase, libAt, ROOT, type Side } from "../harness/checkout.ts"
import { diff, render } from "../harness/diff.ts"
import { lintDirect, loadRules, type Registry, type RuleSetting } from "../harness/lint.ts"

import { inputsOf } from "./key.ts"

/** The syntax each name is read under, plain CSS under none. */
const SYNTAXES: Record<string, string | undefined> = { css: undefined, scss: `postcss-scss`, less: `postcss-less`, styled: `postcss-styled-syntax` }

/** The syntaxes a sweep that names none is read under; a stylesheet corpus is none for a styled template. */
const DEFAULT_SYNTAXES = [`css`, `scss`, `less`]

/** The stylesheet each configuration is put over first, for the objections to its options. */
const PROBE = `a {\n\tcolor: pink;\n}\n`

/** What a sweep module exports. */
export type Sweep = {
	name: string,
	corpus: [string, string][],
	configs: { rule: string, primary: unknown, secondary?: object | undefined }[],
	syntaxes?: string[],
}

/**
 * Lints one text under one configuration, checking and fixing.
 * @param options - What `lintDirect` takes, without `fix`.
 * @returns The warnings, the fixed text and whether it reparses, or why not.
 */
async function measureOne (options: Omit<Parameters<typeof lintDirect>[0], `fix`>): Promise<object> {
	let checked = await lintDirect({ ...options, stripNamespaces: true })

	if (checked.unparsable) return { unparsable: true }
	if (checked.invalidOptions.length > 0) return { usable: false }

	let fixed = await lintDirect({ ...options, fix: true, stripNamespaces: true })

	if (fixed.unparsable) throw new Error(`The text was read once and not again: ${fixed.detail}`)

	let reparse = await lintDirect({ ...options, code: fixed.code, rules: [] })

	return { warnings: checked.warnings.map((warning) => warning.text), fixed: fixed.code, reparses: !reparse.unparsable }
}

/**
 * Lints every text under every configuration and syntax; rows are keyed by syntax, rule and both options.
 * @param sweep - The corpus and configurations to measure.
 * @param registry - One side's rules.
 * @returns The rows by key.
 */
async function measure (sweep: Sweep, registry: Registry): Promise<Record<string, object>> {
	let rows: Record<string, object> = {}

	for (let syntaxName of sweep.syntaxes ?? DEFAULT_SYNTAXES) {
		for (let config of sweep.configs) {
			let rules: RuleSetting[] = [[`${syntaxName === `css` ? `` : `${syntaxName}/`}${config.rule}`, config.primary, config.secondary]]

			for (let [key, code] of sweep.corpus) {
				// In turn, to keep a run light
				// eslint-disable-next-line no-await-in-loop
				rows[`${syntaxName}|${config.rule}|${JSON.stringify(config.primary)}${config.secondary ? `|${JSON.stringify(config.secondary)}` : ``}|${key}`] = await measureOne({ code, rules, registry, syntax: SYNTAXES[syntaxName] })
			}
		}
	}

	return rows
}

let [file, base = defaultBase()] = argv.slice(2)

if (!file) {
	stderr.write(`Usage: run.ts <sweep module> [base revision]\n`)
	exit(2)
}

let sweepFile = path.resolve(file)
let sweep: Sweep = await import(sweepFile)

/**
 * Names every configuration the rules refuse, as `validateOptions` words it.
 *
 * Asked over `PROBE`, not the corpus: a refusal cannot depend on the text, and an unparsable text never reaches `validateOptions`.
 * @param registry - The rules to ask.
 * @returns One line per refused setting.
 */
async function refusalsOf (registry: Registry): Promise<string[]> {
	let refusals: string[] = []

	for (let syntaxName of sweep.syntaxes ?? DEFAULT_SYNTAXES) {
		for (let config of sweep.configs) {
			let rules: RuleSetting[] = [[`${syntaxName === `css` ? `` : `${syntaxName}/`}${config.rule}`, config.primary, config.secondary]]
			// eslint-disable-next-line no-await-in-loop
			let answer = await lintDirect({ code: PROBE, rules, registry })

			if (!answer.unparsable && answer.invalidOptions.length > 0) refusals.push(answer.invalidOptions.join(`; `))
		}
	}

	return refusals
}

// A refused configuration keeps rows the plugin never produces, which `measureOne` files as unusable, so such a sweep used to count them in silence (#543). The working tree's rules are asked for either side, since a tree that moved no rule reads both back from the store
let refusals = await refusalsOf(await loadRules(libAt(`worktree`)))

if (refusals.length > 0) {
	stderr.write(`${sweep.name} measures under ${refusals.length} rule setting${refusals.length === 1 ? `` : `s`} the rules of this checkout refuse:\n${refusals.map((refusal) => `\t${refusal}\n`).join(``)}`)
	exit(1)
}

/** One side: its digest, and its rows behind a call. */
type Result = {
	digest: Record<string, string>,
	rows: () => Record<string, object>,
}

let sides: Record<Side, string> = { base, head: `worktree` }

/**
 * Measures one side, or reads it back from the store.
 * @param side - The base or the head.
 * @returns Its digest and rows.
 */
async function measureSide (side: Side): Promise<Result> {
	let revision = sides[side]

	// Measured once per set of inputs, read back after
	let inputs = inputsOf(sweepFile, revision)
	let key = keyOf(inputs)
	let digest = readDigest(`sweeps`, sweep.name, key)

	if (digest) {
		let rows: Record<string, object> | undefined

		return {
			digest,
			rows: (): Record<string, object> => {
				rows ??= read<Record<string, object>>(`sweeps`, sweep.name, key)

				if (!rows) throw new Error(`The store holds the digest of ${sweep.name} and not its rows`)

				return rows
			},
		}
	}

	stdout.write(`\t🧹 ${sweep.name} over ${side} (${revision})\n`)
	let rows = await measure(sweep, await loadRules(libAt(revision)))

	digest = digestOf(rows)
	write(`sweeps`, sweep.name, key, rows, { ...inputs, ...measuredTreeOf(revision), revision, root: ROOT }, digest)
	return { digest, rows: (): Record<string, object> => rows }
}

let baseResult = await measureSide(`base`)
let headResult = await measureSide(`head`)

let out = path.join(ROOT, `tmp`, `sweeps`)

mkdirSync(out, { recursive: true })

let result = diff(baseResult.digest, headResult.digest)
let moved = result.changed.length + result.added.length + result.removed.length > 0
let report = moved ? render(result, baseResult.rows(), headResult.rows()) : render(result, {}, {})

writeFileSync(path.join(out, `${sweep.name}.md`), `# ${sweep.name}: ${base} → worktree\n\n${report}`)
stdout.write(`${Object.keys(headResult.digest).length} rows: ${result.same} same, ${result.changed.length} changed, ${result.added.length} added, ${result.removed.length} removed — tmp/sweeps/${sweep.name}.md\n`)
