#!/usr/bin/env node

/**
 * Runs one sweep on both sides and writes the diff.
 *
 * A sweep is a module exporting its `name`, its `corpus` — a list of keyed texts, most often built with `scripts/harness/matrix.mjs` — its `configs`, each a rule under a primary option and, where there are any, secondary ones, and the `syntaxes` it is read under. Every text is linted under every configuration and syntax twice, checked and fixed, on the base and on the branch, and the finding is what moved between the two: `tmp/sweeps/<name>.md` holds it row by row, and the two sides stand beside it as JSON.
 *
 * Started through `make sweep FILE=… RUN=1` and nothing else: a run collects results, and the user approves one by that spelling.
 */

import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { argv, env, exit, stderr, stdout } from "node:process"

import { hashAt, keyOf, read, write } from "../harness/cache.mjs"
import { defaultBase, libAt, ROOT } from "../harness/checkout.mjs"
import { diff, render } from "../harness/diff.mjs"
import { lintDirect, loadRules } from "../harness/lint.mjs"

/** The code a run stops with where it was started without approval. */
const EXIT_CODE_NOT_APPROVED = 3

/** The syntax each name is read under, plain CSS under none. */
const SYNTAXES = { css: undefined, scss: `postcss-scss`, less: `postcss-less` }

if (env.HARNESS_RUN !== `1`) {
	stderr.write(`Not running: a sweep collects new results, so it is started through \`make sweep FILE=… RUN=1\` after the user has approved the run, never directly.\n`)
	exit(EXIT_CODE_NOT_APPROVED)
}

/**
 * Lints one text under one configuration, checking and fixing, and reads the fix back.
 * @param {object} options - What `lintDirect` takes, without `fix`.
 * @returns {Promise<object>} The row: the warnings the check drew, the text the fix left and whether the syntax reads it — or why the run says nothing.
 */
async function measureOne (options) {
	let checked = await lintDirect(options)

	if (checked.unparsable) return { unparsable: true }
	if (!checked.usable) return { usable: false }

	let fixed = await lintDirect({ ...options, fix: true })
	let reparse = await lintDirect({ ...options, code: fixed.code, rules: [] })

	return { warnings: checked.warnings.map((warning) => warning.text), fixed: fixed.code, reparses: !reparse.unparsable }
}

/**
 * Lints every text of the corpus under every configuration and syntax, with one registry.
 * @param {object} sweep - The sweep module.
 * @param {Record<string, Function>} registry - The rules of one side.
 * @returns {Promise<Record<string, object>>} Every row by its key.
 */
async function measure (sweep, registry) {
	let rows = {}

	for (let syntaxName of sweep.syntaxes ?? Object.keys(SYNTAXES)) {
		for (let config of sweep.configs) {
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

let sweep = await import(path.resolve(file))
let sides = { base, head: `worktree` }
let results = {}

for (let [side, revision] of Object.entries(sides)) {
	// A side is measured once by what it depends on — the rules, the sweep and the runner — and read back on every later run; the two are taken in turn, base first
	let inputs = { sweep: hashAt(`worktree`, path.relative(ROOT, path.resolve(file))), lib: hashAt(revision, `lib`), harness: hashAt(`worktree`, `scripts/harness`), lock: hashAt(`worktree`, `pnpm-lock.yaml`) }
	let key = keyOf(inputs)
	let rows = read(`sweeps`, sweep.name, key)

	if (!rows) {
		stdout.write(`\t🧹 ${sweep.name} over ${side} (${revision})\n`)
		// eslint-disable-next-line no-await-in-loop
		rows = await measure(sweep, await loadRules(libAt(revision)))
		write(`sweeps`, sweep.name, key, rows, { ...inputs, revision, root: ROOT })
	}

	results[side] = rows
}

let out = path.join(ROOT, `tmp`, `sweeps`)

mkdirSync(out, { recursive: true })

let result = diff(results.base, results.head)

for (let side of Object.keys(sides)) writeFileSync(path.join(out, `${sweep.name}-${side}.json`), `${JSON.stringify(results[side], null, `\t`)}\n`)

writeFileSync(path.join(out, `${sweep.name}.md`), `# ${sweep.name}: ${base} → worktree\n\n${render(result, results.base, results.head)}`)
stdout.write(`${Object.keys(results.head).length} rows: ${result.same} same, ${result.changed.length} changed, ${result.added.length} added, ${result.removed.length} removed — tmp/sweeps/${sweep.name}.md\n`)
