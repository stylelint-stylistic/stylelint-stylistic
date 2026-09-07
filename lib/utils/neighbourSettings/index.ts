import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { compareRanks, defersToRunEnd, linenessRank } from "../defersToRunEnd/index.ts"

/** A neighbouring rule: its directory name and the primaries it accepts. */
export type NeighbourRule = {
	name: string,
	options: string[],
}

/**
 * Reads the primary option out of a setting.
 * @param setting - A rule's configured value: a keyword, or an array opening with one.
 * @returns The option, where it is a keyword.
 */
function primaryOf (setting: unknown): string | undefined {
	let option = Array.isArray(setting) ? setting[0] : setting

	return typeof option === `string` ? option : undefined
}

/**
 * Reads some neighbours' settings in run order: configuration order, then the lineness-conditioned rules, which wait for the run's writers ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)) in the plugin's order ([#502](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/502)).
 *
 * Stylelint runs rules in configuration order, so the key order of `result.stylelint.config` is the run's. A neighbour refusing its option is passed over; whether its fix is off travels with the option ([#485](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/485)).
 * @param syntax - The asking rule's syntax, whose namespace names the neighbours.
 * @param result - The PostCSS result carrying the configuration.
 * @param rules - The neighbours by the caller's keys; a key may stand empty.
 * @returns Key, option and whether the fix is off, per neighbour, in run order.
 */
export function neighbourSettings<Key extends string> (syntax: Syntax, result: PostcssResult, rules: Partial<Record<Key, NeighbourRule>>): [Key, string, boolean][] {
	let settings: Record<string, unknown> = result.stylelint?.config?.rules ?? {}
	let neighbours = Object.entries(rules) as [Key, NeighbourRule][]
	let found: { setting: [Key, string, boolean], rank: string }[] = []

	for (let name of Object.keys(settings)) {
		let neighbour = neighbours.find(([, rule]) => name === addNamespace(rule.name, syntax.namespace))

		if (!neighbour) continue

		let [key, rule] = neighbour
		let setting = settings[name]
		let option = primaryOf(setting)

		if (option === undefined || !rule.options.includes(option)) continue

		found.push({ setting: [key, option, fixDisabledBy(setting)], rank: linenessRank(rule.name, syntax.namespace, option) })
	}

	// The deferred go behind every other (#355), in the plugin's order (#502)
	let undeferred = found.filter(({ setting: [, option] }) => !defersToRunEnd(option))
	let deferred = found.filter(({ setting: [, option] }) => defersToRunEnd(option)).toSorted((one, other) => compareRanks(one.rank, other.rank))

	return [...undeferred, ...deferred].map(({ setting }) => setting)
}

/**
 * Reads whether `disableFix` turns the fix off; `report` refuses a fix wherever it is truthy, the wider of Stylelint's two readings.
 * @param setting - A rule's configured value, an array where secondaries are given.
 * @returns True where the fix is off.
 */
function fixDisabledBy (setting: unknown): boolean {
	if (!Array.isArray(setting)) return false

	let secondary: unknown = setting[1]

	return typeof secondary === `object` && secondary !== null && Boolean((secondary as { disableFix?: unknown }).disableFix)
}

/**
 * Asks whether a whitespace option speaks of a text: `always` and `never` always, the `-line` ones by the text's lines.
 * @param option - The whitespace keyword a rule is configured with.
 * @param isSingleLine - Whether the text is one line, asked only where the option turns on it.
 * @returns True where the option speaks of the text.
 */
export function speaksOf (option: string, isSingleLine: () => boolean): boolean {
	if (option === `always` || option === `never`) return true
	if (option === `always-single-line` || option === `never-single-line`) return isSingleLine()
	if (option === `always-multi-line` || option === `never-multi-line`) return !isSingleLine()

	return false
}

/** A neighbouring rule whose primary is a keyword or `true`, read with its secondaries. */
export type NeighbourRuleSetting = {
	name: string,
	options: (string | true)[],
}

/**
 * Reads one neighbour's setting whole, secondaries included: `no-multiple-whitespaces` asks `named-grid-areas-alignment` whether it lays a shorthand out as a table ([#45](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/45)).
 * @param syntax - The asking rule's syntax, whose namespace names the neighbour.
 * @param result - The PostCSS result carrying the configuration.
 * @param rule - The neighbour and the primaries it accepts.
 * @returns The setting, or nothing where the neighbour is unlisted or refuses its primary.
 */
export function neighbourSetting (syntax: Syntax, result: PostcssResult, rule: NeighbourRuleSetting): { option: string | true, fixDisabled: boolean, secondary: Record<string, unknown> } | undefined {
	let settings: Record<string, unknown> = result.stylelint?.config?.rules ?? {}
	let setting = settings[addNamespace(rule.name, syntax.namespace)]
	let option: unknown = Array.isArray(setting) ? setting[0] : setting

	if ((typeof option !== `string` && option !== true) || !rule.options.includes(option)) return

	let secondary: unknown = Array.isArray(setting) ? setting[1] : undefined

	return { option, fixDisabled: fixDisabledBy(setting), secondary: typeof secondary === `object` && secondary !== null ? secondary as Record<string, unknown> : {} }
}
