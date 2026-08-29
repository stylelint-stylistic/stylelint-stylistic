#!/usr/bin/env node

/**
 * Runs one sweep on both sides and writes the diff.
 *
 * A sweep is a module exporting its `name`, its `corpus` — a list of keyed texts, most often built with `scripts/harness/matrix.mjs` — its `configs`, each a rule under a primary option and, where there are any, secondary ones, and the `syntaxes` it is read under. Every text is linted under every configuration and syntax twice, checked and fixed, on the base and on the branch, and the finding is what moved between the two: `tmp/sweeps/<name>.md` holds it row by row; the two sides themselves stand in the store.
 *
 * Each side is kept in the store with a digest beside it — one short hash per row — and a run compares the digests, reading the rows themselves only for the keys that moved. Started through `make sweep FILE=…`.
 */

import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { argv, exit, stderr, stdout } from "node:process"

import { digestOf, hashAt, keyOf, read, readDigest, write } from "../harness/cache.mjs"
import { defaultBase, libAt, ROOT } from "../harness/checkout.mjs"
import { diff, render } from "../harness/diff.mjs"
import { lintDirect, loadRules } from "../harness/lint.mjs"

/**
 * The syntax each name is read under, plain CSS under none.
 * @type {Record<string, string | undefined>}
 */
const SYNTAXES = { css: undefined, scss: `postcss-scss`, less: `postcss-less` }

/** @typedef {{ name: string, corpus: [string, string][], configs: { rule: string, primary: unknown, secondary?: object }[], syntaxes?: string[] }} Sweep What a sweep module exports. */

/**
 * Lints one text under one configuration, checking and fixing, and reads the fix back.
 * @param {Omit<Parameters<typeof lintDirect>[0], 'fix'>} options - What `lintDirect` takes, without `fix`.
 * @returns {Promise<object>} The row: the warnings the check drew, the text the fix left and whether the syntax reads it — or why the run says nothing.
 */
async function measureOne (options) {
	let checked = await lintDirect(options)

	if (checked.unparsable) return { unparsable: true }
	if (!checked.usable) return { usable: false }

	let fixed = await lintDirect({ ...options, fix: true })

	if (fixed.unparsable) throw new Error(`The text was read once and not again: ${fixed.detail}`)

	let reparse = await lintDirect({ ...options, code: fixed.code, rules: [] })

	return { warnings: checked.warnings.map((warning) => warning.text), fixed: fixed.code, reparses: !reparse.unparsable }
}

/**
 * Lints every text of the corpus under every configuration and syntax, with one registry.
 * @param {Sweep} sweep - The sweep module.
 * @param {import('../harness/lint.mjs').Registry} registry - The rules of one side.
 * @returns {Promise<Record<string, object>>} Every row by its key.
 */
async function measure (sweep, registry) {
	/** @type {Record<string, object>} */
	let rows = {}

	for (let syntaxName of sweep.syntaxes ?? Object.keys(SYNTAXES)) {
		for (let config of sweep.configs) {
			/** @type {import('../harness/lint.mjs').RuleSetting[]} */
			let rules = [[config.rule, config.primary, config.secondary]]

			for (let [key, code] of sweep.corpus) {
				// The rows are measured in turn so that a run stays as light on the machine as the one it replaces
				// eslint-disable-next-line no-await-in-loop
				rows[`${syntaxName}|${config.rule}|${JSON.stringify(config.primary)}|${key}`] = await measureOne({ code, rules, registry, syntax: SYNTAXES[syntaxName] })
			}
		}
	}

	return rows
}

let [file, base = defaultBase()] = argv.slice(2)

if (!file) {
	stderr.write(`Usage: run.mjs <sweep module> [base revision]\n`)
	exit(2)
}

/** @type {Sweep} */
let sweep = await import(path.resolve(file))
let sides = { base, head: `worktree` }

/** @type {Record<string, { digest: Record<string, string>, rows: () => Record<string, object> }>} Each side as its digest, and its rows behind a call, since the rows are read only for the keys the digests say have moved. */
let results = {}

for (let [side, revision] of Object.entries(sides)) {
	// A side is measured once by what it depends on — the rules, the sweep and the runner — and read back on every later run; the two are taken in turn, base first
	let inputs = { sweep: hashAt(`worktree`, path.relative(ROOT, path.resolve(file))), lib: hashAt(revision, `lib`), harness: hashAt(`worktree`, `scripts/harness`), lock: hashAt(`worktree`, `pnpm-lock.yaml`) }
	let key = keyOf(inputs)
	let digest = readDigest(`sweeps`, sweep.name, key)

	if (digest) {
		/** @type {Record<string, object> | undefined} */
		let rows

		// The store hands back what was written, and a sweep writes its rows by key
		results[side] = { digest, rows: () => (rows ??= /** @type {Record<string, object>} */ (read(`sweeps`, sweep.name, key))) }
		continue
	}

	stdout.write(`\t🧹 ${sweep.name} over ${side} (${revision})\n`)
	// eslint-disable-next-line no-await-in-loop
	let rows = await measure(sweep, await loadRules(libAt(revision)))

	digest = digestOf(rows)
	write(`sweeps`, sweep.name, key, rows, { ...inputs, revision, root: ROOT }, digest)
	results[side] = { digest, rows: () => rows }
}

let out = path.join(ROOT, `tmp`, `sweeps`)

mkdirSync(out, { recursive: true })

let result = diff(results.base.digest, results.head.digest)
let moved = result.changed.length + result.added.length + result.removed.length > 0
let report = moved ? render(result, results.base.rows(), results.head.rows()) : render(result, {}, {})

writeFileSync(path.join(out, `${sweep.name}.md`), `# ${sweep.name}: ${base} → worktree\n\n${report}`)
stdout.write(`${Object.keys(results.head.digest).length} rows: ${result.same} same, ${result.changed.length} changed, ${result.added.length} added, ${result.removed.length} removed — tmp/sweeps/${sweep.name}.md\n`)
