#!/usr/bin/env node

/**
 * Runs one sweep on both sides and writes the diff. Started through `make sweep FILE=…`.
 *
 * A sweep module exports its `name`, `corpus` of keyed texts, `configs` and `syntaxes`. Every text is linted under each, checked and fixed, on base and branch; `tmp/sweeps/<name>.md` holds what moved. A side stands in the store as a digest of one short hash per row, so the rows are read only for the keys that moved.
 *
 * A side is measured by as many workers (`worker.ts`) as the machine has cores, `SWEEP_WORKERS` overriding; the rows come back in the order one worker would have measured them in, so a side reads the same whatever the count. A side is kept nested (`Nested`), the corpus keys once and a row per text under each configuration, and a row spells only what parted from the input: two million rows took 630 MB flat and spelled out, and their keys alone were 200 MB of it.
 */

import { mkdirSync, writeFileSync } from "node:fs"
import { availableParallelism } from "node:os"
import path from "node:path"
import { argv, env, exit, stderr, stdout } from "node:process"
import { Worker } from "node:worker_threads"

import { digestOf, keyOf, measuredTreeOf, read, readDigest, write } from "../harness/cache.ts"
import { defaultBase, libAt, ROOT, type Side } from "../harness/checkout.ts"
import { diff, render } from "../harness/diff.ts"
import { lintDirect, loadRules, type Registry } from "../harness/lint.ts"
import { namespaceTakes } from "../oracles/options.ts"

import { inputsOf } from "./key.ts"
import { configKeyOf, expand, flatten, type Nested, type Row, settingOf, type Sweep, syntaxesOf, tasksOf } from "./measure.ts"
import type { Answer, Job } from "./worker.ts"

export type { Sweep } from "./measure.ts"

/** The stylesheet each configuration is put over first, for the objections to its options. */
const PROBE = `a {\n\tcolor: pink;\n}\n`

/** The workers a side is measured by: every core, unless `SWEEP_WORKERS` says otherwise. */
const WORKERS = Number(env.SWEEP_WORKERS) || availableParallelism()

let [file, base = defaultBase()] = argv.slice(2)

if (!file) {
	stderr.write(`Usage: run.ts <sweep module> [base revision]\n`)
	exit(2)
}

let sweepFile = path.resolve(file)
let sweep: Sweep = await import(sweepFile)

/**
 * Measures every text under every configuration and syntax, the tasks shared out over the workers as each comes free.
 * @param lib - One side's `lib/`, for the workers to load their rules from.
 * @returns The side, nested, the configurations and the rows under each in corpus order.
 */
async function measure (lib: string): Promise<Nested<Row>> {
	let tasks = tasksOf(sweep, WORKERS)
	let results: { config: string, rows: Row[] }[] = []
	let next = 0

	/**
	 * Runs one worker until the tasks run out.
	 * @returns Settled when the worker has answered its last task, or rejected with the first error.
	 */
	function runWorker (): Promise<void> {
		return new Promise((resolve, reject) => {
			let worker = new Worker(new URL(`./worker.ts`, import.meta.url), { workerData: { sweepFile, lib } })

			/** Posts the next task, or lets the worker go. */
			function feed (): void {
				let task = tasks[next]

				if (!task) {
					worker.terminate().then(() => resolve()).catch(reject)

					return
				}

				let index = next

				next += 1
				// A worker's port takes one argument; the rule has a window's `postMessage` in mind
				// eslint-disable-next-line unicorn/require-post-message-target-origin
				worker.postMessage({ index, task } satisfies Job)
			}

			worker.on(`message`, (answer: Answer) => {
				if (`error` in answer) {
					reject(new Error(answer.error))

					return
				}

				results[answer.index] = { config: answer.config, rows: answer.rows }
				feed()
			})
			worker.on(`error`, reject)
			feed()
		})
	}

	await Promise.all(Array.from({ length: Math.min(WORKERS, tasks.length) }, runWorker))

	let rows: Record<string, Row[]> = {}

	// The tasks of one configuration stand together and in corpus order, so the slices join back into the corpus
	for (let { config, rows: slice } of results) rows[config] = [...rows[config] ?? [], ...slice]

	return { corpus: sweep.corpus.map(([key]) => key), rows }
}

/**
 * Names every configuration the rules refuse, as `validateOptions` words it.
 *
 * Asked over `PROBE`, not the corpus: a refusal cannot depend on the text, and an unparsable text never reaches `validateOptions`.
 * @param registry - The rules to ask.
 * @returns One line per refused setting.
 */
async function refusalsOf (registry: Registry): Promise<string[]> {
	let refusals: string[] = []

	for (let syntaxName of syntaxesOf(sweep)) {
		for (let config of sweep.configs) {
			if (!namespaceTakes(syntaxName, config.rule, config.primary)) continue

			// eslint-disable-next-line no-await-in-loop
			let answer = await lintDirect({ code: PROBE, rules: [settingOf(syntaxName, config)], registry })

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

/** One side: its digest by row key, and its rows by row key behind a call. */
type Result = {
	digest: Record<string, string>,
	rows: () => Record<string, Row>,
}

/**
 * Hashes every row of a side, keeping the shape.
 * @param nested - The side.
 * @returns A hash per row under each configuration.
 */
function digestsOf (nested: Nested<Row>): Nested<string> {
	return { corpus: nested.corpus, rows: Object.fromEntries(Object.entries(nested.rows).map(([config, rows]) => [config, Object.values(digestOf(rows))])) }
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
	let digest = readDigest<Nested<string>>(`sweeps`, sweep.name, key)

	if (digest) {
		let rows: Record<string, Row> | undefined

		return {
			digest: flatten(digest),
			rows: (): Record<string, Row> => {
				let stored = read<Nested<Row>>(`sweeps`, sweep.name, key)

				if (!stored) throw new Error(`The store holds the digest of ${sweep.name} and not its rows`)

				rows ??= flatten(stored)

				return rows
			},
		}
	}

	stdout.write(`\t🧹 ${sweep.name} over ${side} (${revision}), ${WORKERS} worker${WORKERS === 1 ? `` : `s`}\n`)
	let nested = await measure(libAt(revision))
	let digests = digestsOf(nested)

	write(`sweeps`, sweep.name, key, nested, { ...inputs, ...measuredTreeOf(revision), revision, root: ROOT }, digests)

	let rows: Record<string, Row> | undefined

	return {
		digest: flatten(digests),
		rows: (): Record<string, Row> => {
			rows ??= flatten(nested)

			return rows
		},
	}
}

/** Every configuration's key, longest first, so that a row key is read back to its configuration by the longest head it carries: a configuration with a secondary option begins as the one without does. */
const CONFIG_KEYS = syntaxesOf(sweep).flatMap((syntaxName) => sweep.configs.map((config) => configKeyOf(syntaxName, config))).toSorted((a, b) => b.length - a.length)

/** The texts of the corpus by key. */
const TEXTS = new Map(sweep.corpus)

/**
 * Picks the rows the report spells out and puts back into each what the store left unsaid.
 * @param rows - One side's rows by key.
 * @param keys - The keys the report lists.
 * @returns The rows the report reads, by key.
 */
function forReport (rows: Record<string, Row>, keys: string[]): Record<string, object> {
	let picked: Record<string, object> = {}

	for (let key of keys) {
		let row = rows[key]
		let configKey = CONFIG_KEYS.find((candidate) => key.startsWith(`${candidate}|`))

		if (row && configKey) picked[key] = expand(row, TEXTS.get(key.slice(configKey.length + 1)) ?? ``)
	}

	return picked
}

let baseResult = await measureSide(`base`)
let headResult = await measureSide(`head`)

let out = path.join(ROOT, `tmp`, `sweeps`)

mkdirSync(out, { recursive: true })

let result = diff(baseResult.digest, headResult.digest)
let moved = result.changed.length + result.added.length + result.removed.length > 0
let report = moved ? render(result, forReport(baseResult.rows(), [...result.changed, ...result.removed]), forReport(headResult.rows(), [...result.changed, ...result.added])) : render(result, {}, {})

writeFileSync(path.join(out, `${sweep.name}.md`), `# ${sweep.name}: ${base} → worktree\n\n${report}`)
stdout.write(`${Object.keys(headResult.digest).length} rows: ${result.same} same, ${result.changed.length} changed, ${result.added.length} added, ${result.removed.length} removed — tmp/sweeps/${sweep.name}.md\n`)
