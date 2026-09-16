/**
 * A worker of the sweep runner: loads one side's rules and the sweep once, then measures every task the runner posts, answering each with its rows.
 *
 * An error is posted back rather than thrown, so the runner dies with the worker's message in front of it rather than with an exit code.
 */

import { parentPort, workerData } from "node:worker_threads"

import { loadRules } from "../harness/lint.ts"

import { measureTask, type Sweep, type Task } from "./measure.ts"

/** What the runner hands a worker at its start. */
type Start = {
	sweepFile: string,
	lib: string,
}

/** What the runner posts: which task, and the task. */
export type Job = {
	index: number,
	task: Task,
}

/** What a worker answers: the rows of the job, or why none. */
export type Answer = {
	index: number,
	rows: [string, object][],
} | {
	index: number,
	error: string,
}

if (!parentPort) throw new Error(`worker.ts runs as a worker thread alone`)

let port = parentPort
let { sweepFile, lib } = workerData as Start

// Messages posted before this settles wait in the port until the listener stands
let [sweep, registry] = await Promise.all([import(sweepFile) as Promise<Sweep>, loadRules(lib)])

port.on(`message`, (job: Job) => {
	measureTask(sweep, registry, job.task)
		.then((rows) => port.postMessage({ index: job.index, rows } satisfies Answer))
		.catch((error: unknown) => port.postMessage({ index: job.index, error: error instanceof Error ? error.stack ?? error.message : String(error) } satisfies Answer))
})
