/**
 * What a sweep is and how one of its rows is measured.
 *
 * Apart from `run.ts`, which measures as it loads and so cannot be imported: the runner's workers (`worker.ts`) and the runner itself read the corpus, the configurations and the row key from here, so the two cannot part on what a row is.
 */

import { lintDirect, type Registry, type RuleSetting } from "../harness/lint.ts"

/** The syntax each name is read under, plain CSS under none. */
const SYNTAXES: Record<string, string | undefined> = { css: undefined, scss: `postcss-scss`, less: `postcss-less`, styled: `postcss-styled-syntax` }

/** The syntaxes a sweep that names none is read under; a stylesheet corpus is none for a styled template. */
const DEFAULT_SYNTAXES = [`css`, `scss`, `less`]

/** What a sweep module exports. */
export type Sweep = {
	name: string,
	corpus: [string, string][],
	configs: { rule: string, primary: unknown, secondary?: object | undefined }[],
	syntaxes?: string[],
}

/** What one text under one configuration came to; only what parted from the input is spelled, so a silent row is `{}` and a side stores a fraction of the bytes. `expand` puts the rest back for a reader. */
export type Row = {
	unparsable: true,
} | {
	usable: false,
} | {
	warnings?: string[],
	fixed?: string,
	reparses?: false,
}

/** One side as the store keeps it: the corpus keys once, and under each configuration's key a row per text in that order, so that no row carries a key of its own; `flatten` gives every row the key the diff and the report read it by. */
export type Nested<T> = {
	corpus: string[],
	rows: Record<string, T[]>,
}

/** One configuration of a sweep under one syntax over a slice of its corpus; the indices point into the sweep's own lists, so a task travels to a worker without the texts. */
export type Task = {
	syntaxName: string,
	config: number,
	from: number,
	to: number,
}

/**
 * Names the syntaxes a sweep is read under.
 * @param sweep - The sweep.
 * @returns Its own list, or the default one.
 */
function syntaxesOf (sweep: Sweep): string[] {
	return sweep.syntaxes ?? DEFAULT_SYNTAXES
}

/**
 * Spells one configuration the way the runner hands it to the rules: the core's rule under its bare name, a namespace's behind its segment.
 * @param syntaxName - The syntax the sweep is read under.
 * @param config - The rule with its options.
 * @returns The setting.
 */
function settingOf (syntaxName: string, config: Sweep[`configs`][number]): RuleSetting {
	return [`${syntaxName === `css` ? `` : `${syntaxName}/`}${config.rule}`, config.primary, config.secondary]
}

/**
 * Keys one configuration by syntax, rule and both options.
 * @param syntaxName - The syntax the text is read under.
 * @param config - The rule with its options.
 * @returns The configuration's key, the head of every row key under it.
 */
function configKeyOf (syntaxName: string, config: Sweep[`configs`][number]): string {
	return `${syntaxName}|${config.rule}|${JSON.stringify(config.primary)}${config.secondary ? `|${JSON.stringify(config.secondary)}` : ``}`
}

/**
 * Keys one row by its configuration and the text's own key.
 * @param syntaxName - The syntax the text is read under.
 * @param config - The rule with its options.
 * @param key - The text's key in the corpus.
 * @returns The row's key.
 */
function rowKeyOf (syntaxName: string, config: Sweep[`configs`][number], key: string): string {
	return `${configKeyOf(syntaxName, config)}|${key}`
}

/**
 * Gives every row of a side the key the diff reads it by, in the order one worker would have measured them in.
 * @param nested - The side as the store keeps it.
 * @returns The rows by key.
 */
function flatten<T> (nested: Nested<T>): Record<string, T> {
	let flat: Record<string, T> = {}

	for (let [configKey, rows] of Object.entries(nested.rows)) for (let [index, row] of rows.entries()) flat[`${configKey}|${nested.corpus[index] ?? index}`] = row

	return flat
}

/**
 * Puts back into a row what `measureOne` left unsaid, for a reader of the report.
 * @param row - The row as stored.
 * @param input - The text the row was measured over.
 * @returns The warnings, the fixed text and whether it reparses, or why not.
 */
function expand (row: Row, input: string): object {
	if (`unparsable` in row || `usable` in row) return row

	return { warnings: row.warnings ?? [], fixed: row.fixed ?? input, reparses: row.reparses ?? true }
}

/**
 * Lints one text under one configuration, checking and fixing.
 * @param options - What `lintDirect` takes, without `fix`.
 * @returns The row: the warnings where there are any, the fixed text where it parted from the input, and `reparses: false` where it does not, or why the text could not be measured.
 */
async function measureOne (options: Omit<Parameters<typeof lintDirect>[0], `fix`>): Promise<Row> {
	let checked = await lintDirect({ ...options, stripNamespaces: true })

	if (checked.unparsable) return { unparsable: true }
	if (checked.invalidOptions.length > 0) return { usable: false }

	let fixed = await lintDirect({ ...options, fix: true, stripNamespaces: true })

	if (fixed.unparsable) throw new Error(`The text was read once and not again: ${fixed.detail}`)

	let reparse = await lintDirect({ ...options, code: fixed.code, rules: [] })

	return {
		...(checked.warnings.length > 0 && { warnings: checked.warnings.map((warning) => warning.text) }),
		...(fixed.code !== options.code && { fixed: fixed.code }),
		...(reparse.unparsable && { reparses: false }),
	}
}

/**
 * Measures one task: every text of the slice under the configuration, in corpus order.
 * @param sweep - The sweep the task points into.
 * @param registry - One side's rules.
 * @param task - The configuration, the syntax and the slice.
 * @returns The configuration's key and a row per text of the slice, in corpus order.
 */
async function measureTask (sweep: Sweep, registry: Registry, task: Task): Promise<{ config: string, rows: Row[] }> {
	let config = sweep.configs[task.config]

	if (!config) throw new Error(`No configuration at ${task.config} in ${sweep.name}`)

	let rules = [settingOf(task.syntaxName, config)]
	let syntax = SYNTAXES[task.syntaxName]
	let rows: Row[] = []

	for (let [, code] of sweep.corpus.slice(task.from, task.to)) {
		// In turn, to keep a worker light
		// eslint-disable-next-line no-await-in-loop
		rows.push(await measureOne({ code, rules, registry, syntax }))
	}

	return { config: configKeyOf(task.syntaxName, config), rows }
}

/**
 * Cuts a sweep into tasks: one per configuration and syntax, and where those are few against the workers, the corpus is sliced as well so that no worker waits on the last of them.
 * @param sweep - The sweep.
 * @param workers - How many workers will take the tasks.
 * @returns The tasks in the order the rows are assembled in.
 */
function tasksOf (sweep: Sweep, workers: number): Task[] {
	let syntaxes = syntaxesOf(sweep)
	let units = syntaxes.length * sweep.configs.length
	let slices = Math.max(1, Math.ceil((workers * 4) / units))
	let size = Math.max(1, Math.ceil(sweep.corpus.length / slices))
	let tasks: Task[] = []

	for (let syntaxName of syntaxes) {
		for (let config = 0; config < sweep.configs.length; config += 1) {
			for (let from = 0; from < sweep.corpus.length; from += size) tasks.push({ syntaxName, config, from, to: Math.min(from + size, sweep.corpus.length) })
		}
	}

	return tasks
}

export { configKeyOf, DEFAULT_SYNTAXES, expand, flatten, measureOne, measureTask, rowKeyOf, settingOf, SYNTAXES, syntaxesOf, tasksOf }
