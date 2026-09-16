#!/usr/bin/env node

/**
 * Runs one sweep on both sides and writes the diff. Started through `make sweep FILE=…`.
 *
 * A sweep module exports its `name`, `corpus` of keyed texts, `configs` and `syntaxes`. Every text is linted under each, checked and fixed, on base and branch; `tmp/sweeps/<name>.md` holds what moved. A side stands in the store as a digest of one short hash per row, so the rows are read only for the keys that moved.
 *
 * A side is measured by as many workers (`worker.ts`) as the machine has cores, `SWEEP_WORKERS` overriding; the rows come back in the order one worker would have measured them in, so a side reads the same whatever the count.
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

import { inputsOf } from "./key.ts"
import { settingOf, type Sweep, syntaxesOf, tasksOf } from "./measure.ts"
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
 * @returns The rows by key, in corpus order.
 */
async function measure (lib: string): Promise<Record<string, object>> {
	let tasks = tasksOf(sweep, WORKERS)
	let results: [string, object][][] = []
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

				results[answer.index] = answer.rows
				feed()
			})
			worker.on(`error`, reject)
			feed()
		})
	}

	await Promise.all(Array.from({ length: Math.min(WORKERS, tasks.length) }, runWorker))

	let rows: Record<string, object> = {}

	for (let taskRows of results) for (let [key, row] of taskRows) rows[key] = row

	return rows
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

	stdout.write(`\t🧹 ${sweep.name} over ${side} (${revision}), ${WORKERS} worker${WORKERS === 1 ? `` : `s`}\n`)
	let rows = await measure(libAt(revision))

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
