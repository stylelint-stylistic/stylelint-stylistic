#!/usr/bin/env node

/**
 * Runs one sweep on both sides and writes the diff.
 *
 * A sweep is a module exporting its `name`, its `corpus` — a list of keyed texts, most often built with `scripts/harness/matrix.ts` — its `configs`, each a rule under a primary option and, where there are any, secondary ones, and the `syntaxes` it is read under. Every text is linted under every configuration and syntax twice, checked and fixed, on the base and on the branch, and the finding is what moved between the two: `tmp/sweeps/<name>.md` holds it row by row; the two sides themselves stand in the store.
 *
 * Each side is kept in the store with a digest beside it — one short hash per row — and a run compares the digests, reading the rows themselves only for the keys that moved. Started through `make sweep FILE=…`.
 */

import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { argv, exit, stderr, stdout } from "node:process"

import { digestOf, hashAt, keyOf, read, readDigest, write } from "../harness/cache.ts"
import { defaultBase, libAt, ROOT } from "../harness/checkout.ts"
import { diff, render } from "../harness/diff.ts"
import { lintDirect, loadRules } from "../harness/lint.ts"

/** The syntax each name is read under, plain CSS under none. */
const SYNTAXES: Record<string, string | undefined> = { css: undefined, scss: `postcss-scss`, less: `postcss-less` }

/** What a sweep module exports. */
type Sweep = { name: string, corpus: [string, string][], configs: { rule: string, primary: unknown, secondary?: object }[], syntaxes?: string[] }

/**
 * Lints one text under one configuration, checking and fixing, and reads the fix back.
 * @param options - What `lintDirect` takes, without `fix`.
 * @returns The row: the warnings the check drew, the text the fix left and whether the syntax reads it — or why the run says nothing.
 */
async function measureOne (options: Omit<Parameters<typeof lintDirect>[0], `fix`>): Promise<object> {
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
 * @param sweep - The sweep module.
 * @param registry - The rules of one side.
 * @returns Every row by its key.
 */
async function measure (sweep: Sweep, registry: import("../harness/lint.ts").Registry): Promise<Record<string, object>> {
	let rows: Record<string, object> = {}

	for (let syntaxName of sweep.syntaxes ?? Object.keys(SYNTAXES)) {
		for (let config of sweep.configs) {
			let rules: import("../harness/lint.ts").RuleSetting[] = [[config.rule, config.primary, config.secondary]]

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
	stderr.write(`Usage: run.ts <sweep module> [base revision]\n`)
	exit(2)
}

let sweep: Sweep = await import(path.resolve(file))
let sides = { base, head: `worktree` }

/** Each side as its digest, and its rows behind a call, since the rows are read only for the keys the digests say have moved. */
let results: Record<string, { digest: Record<string, string>, rows: () => Record<string, object> }> = {}

for (let [side, revision] of Object.entries(sides)) {
	// A side is measured once by what it depends on — the rules, the sweep and the runner — and read back on every later run; the two are taken in turn, base first
	let inputs = { sweep: hashAt(`worktree`, path.relative(ROOT, path.resolve(file))), lib: hashAt(revision, `lib`), harness: hashAt(`worktree`, `scripts/harness`), lock: hashAt(`worktree`, `pnpm-lock.yaml`) }
	let key = keyOf(inputs)
	let digest = readDigest(`sweeps`, sweep.name, key)

	if (digest) {
		let rows: Record<string, object> | undefined

		// The store hands back what was written, and a sweep writes its rows by key
		results[side] = { digest, rows: (): Record<string, object> => (rows ??= (read(`sweeps`, sweep.name, key) as Record<string, object>)) }
		continue
	}

	stdout.write(`\t🧹 ${sweep.name} over ${side} (${revision})\n`)
	// eslint-disable-next-line no-await-in-loop
	let rows = await measure(sweep, await loadRules(libAt(revision)))

	digest = digestOf(rows)
	write(`sweeps`, sweep.name, key, rows, { ...inputs, revision, root: ROOT }, digest)
	results[side] = { digest, rows: (): Record<string, object> => rows }
}

let out = path.join(ROOT, `tmp`, `sweeps`)

mkdirSync(out, { recursive: true })

let result = diff(results.base.digest, results.head.digest)
let moved = result.changed.length + result.added.length + result.removed.length > 0
let report = moved ? render(result, results.base.rows(), results.head.rows()) : render(result, {}, {})

writeFileSync(path.join(out, `${sweep.name}.md`), `# ${sweep.name}: ${base} → worktree\n\n${report}`)
stdout.write(`${Object.keys(results.head.digest).length} rows: ${result.same} same, ${result.changed.length} changed, ${result.added.length} added, ${result.removed.length} removed — tmp/sweeps/${sweep.name}.md\n`)
