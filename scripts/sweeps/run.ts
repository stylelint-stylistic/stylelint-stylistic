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
import { defaultBase, libAt, ROOT, type Side } from "../harness/checkout.ts"
import { diff, render } from "../harness/diff.ts"
import { lintDirect, loadRules, type Registry, type RuleSetting } from "../harness/lint.ts"

/** The syntax each name is read under, plain CSS under none. */
const SYNTAXES: Record<string, string | undefined> = { css: undefined, scss: `postcss-scss`, less: `postcss-less` }

/** What a sweep module exports. */
export type Sweep = {
	name: string,
	corpus: [string, string][],
	configs: { rule: string, primary: unknown, secondary?: object | undefined }[],
	syntaxes?: string[],
}

/**
 * Lints one text under one configuration, checking and fixing, and reads the fix back.
 * @param options - What `lintDirect` takes, without `fix`.
 * @returns The row: the warnings the check drew, the text the fix left and whether the syntax reads it — or why the run says nothing.
 */
async function measureOne (options: Omit<Parameters<typeof lintDirect>[0], `fix`>): Promise<object> {
	let checked = await lintDirect({ ...options, stripNamespaces: true })

	if (checked.unparsable) return { unparsable: true }
	if (!checked.usable) return { usable: false }

	let fixed = await lintDirect({ ...options, fix: true, stripNamespaces: true })

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
async function measure (sweep: Sweep, registry: Registry): Promise<Record<string, object>> {
	let rows: Record<string, object> = {}

	for (let syntaxName of sweep.syntaxes ?? Object.keys(SYNTAXES)) {
		for (let config of sweep.configs) {
			let rules: RuleSetting[] = [[`${syntaxName === `css` ? `` : `${syntaxName}/`}${config.rule}`, config.primary, config.secondary]]

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

let sweepFile = path.resolve(file)
let sweep: Sweep = await import(sweepFile)

/** One side as its digest, and its rows behind a call, since the rows are read only for the keys the digests say have moved. */
type Result = {
	digest: Record<string, string>,
	rows: () => Record<string, object>,
}

let sides: Record<Side, string> = { base, head: `worktree` }

/**
 * Measures one side, or reads it back where the store holds it.
 * @param side - The side.
 * @returns Its digest, and its rows on demand.
 */
async function measureSide (side: Side): Promise<Result> {
	let revision = sides[side]

	// A side is measured once by what it depends on — the rules, the sweep and the runner — and read back on every later run; the two are taken in turn, base first
	let inputs = { sweep: hashAt(`worktree`, path.relative(ROOT, sweepFile)), lib: hashAt(revision, `lib`), harness: hashAt(`worktree`, `scripts/harness`), lock: hashAt(`worktree`, `pnpm-lock.yaml`) }
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
	write(`sweeps`, sweep.name, key, rows, { ...inputs, revision, root: ROOT }, digest)
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
