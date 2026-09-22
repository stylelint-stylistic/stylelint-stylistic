import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { namespaces, type Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { copyReadingTheRoot } from "../copyReadingTheRoot/index.ts"
import { compareRanks, defersToRunEnd, linenessRank } from "../defersToRunEnd/index.ts"

/** A neighbouring rule: its directory name and the primaries it accepts. */
export type NeighbourRule = {
	name: string,
	options: string[],
}

/**
 * Reads the primary option out of a setting.
 * @param setting - A rule's configured value: a keyword or `true`, or an array opening with one.
 * @returns The option, where it is a keyword or `true`.
 */
function primaryOf (setting: unknown): string | true | undefined {
	let option: unknown = Array.isArray(setting) ? setting[0] : setting

	return typeof option === `string` || option === true ? option : undefined
}

/** A neighbour's copy as the configuration lists it: the caller's key, the option, the setting whole, the configured name and the syntax of its namespace. */
type Listed<Key extends string, Option extends string | true> = { key: Key, option: Option, setting: unknown, name: string, syntax: Syntax }

/**
 * Lists the copies of some neighbours the configuration holds, in run order: configuration order, then the lineness-conditioned rules, which wait for the run's writers ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)) in the plugin's order ([#502](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/502)).
 *
 * Stylelint runs rules in configuration order, so the key order of `result.stylelint.config` is the run's. A neighbour is listed under the one name whose copy reads the node's root (`copyReadingTheRoot`), whichever namespace that is, since every namespace reads plain CSS and a copy under another one writes the same file ([#710](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/710)). A copy refusing its option is passed over.
 * @param node - A node of the root the rules read.
 * @param result - The PostCSS result carrying the configuration.
 * @param rules - The neighbours by the caller's keys; a key may stand empty.
 * @returns The copies in run order.
 */
function listedInRunOrder<Key extends string, Option extends string | true> (node: Node, result: PostcssResult, rules: Partial<Record<Key, { name: string, options: Option[] }>>): Listed<Key, Option>[] {
	let settings: Record<string, unknown> = result.stylelint?.config?.rules ?? {}
	let names = namesOf(rules)
	let root = node.root()
	let found: Listed<Key, Option>[] = []

	for (let name of Object.keys(settings)) {
		let match = names.get(name)

		if (!match) continue

		let { key, rule, syntax } = match
		let setting = settings[name]
		let option = primaryOf(setting)

		if (option === undefined || !rule.options.includes(option as Option) || copyReadingTheRoot(rule.name, root, result) !== name) continue

		found.push({ key, option: option as Option, setting, name, syntax })
	}

	/**
	 * Ranks a deferred copy among the others.
	 * @param copy - The copy.
	 * @returns The rank.
	 */
	function rankOf (copy: Listed<Key, Option>): string {
		return linenessRank((rules[copy.key] as { name: string }).name, copy.syntax.namespace, copy.option as string)
	}

	// The deferred go behind every other (#355), in the plugin's order (#502)
	let undeferred = found.filter(({ option }) => !defersToRunEnd(option))
	let deferred = found.filter(({ option }) => defersToRunEnd(option)).toSorted((one, other) => compareRanks(rankOf(one), rankOf(other)))

	return [...undeferred, ...deferred]
}

/**
 * Reads some neighbours' settings in run order, as {@link listedInRunOrder} lists them; whether a copy's fix is off travels with its option ([#485](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/485)).
 * @param node - A node of the root the rules read.
 * @param result - The PostCSS result carrying the configuration.
 * @param rules - The neighbours by the caller's keys; a key may stand empty.
 * @returns Key, option, whether the fix is off and the configured name, per neighbour, in run order.
 */
export function neighbourSettings<Key extends string> (node: Node, result: PostcssResult, rules: Partial<Record<Key, NeighbourRule>>): [Key, string, boolean, string][] {
	return listedInRunOrder(node, result, rules).map(({ key, option, setting, name }) => [key, option, fixDisabledBy(setting), name])
}

/** A neighbour as a configured name registers it: the caller's key, the rule and the syntax of its namespace. */
type NeighbourName<Key extends string> = { key: Key, rule: { name: string, options: (string | true)[] }, syntax: Syntax }

/** The names each table of neighbours is configured under, built once per table. */
let namesByTable: WeakMap<object, Map<string, NeighbourName<string>>> = new WeakMap()

/**
 * Maps every name a table's neighbours can be configured under, one per namespace, to what it registers.
 * @param rules - The neighbours by the caller's keys.
 * @returns The map.
 */
function namesOf<Key extends string> (rules: Partial<Record<Key, { name: string, options: (string | true)[] }>>): Map<string, NeighbourName<Key>> {
	let names = namesByTable.get(rules) as Map<string, NeighbourName<Key>> | undefined

	if (names) return names

	let made: Map<string, NeighbourName<Key>> = new Map()

	for (let syntax of [css, ...namespaces]) {
		for (let [key, rule] of Object.entries(rules) as [Key, { name: string, options: (string | true)[] }][]) made.set(addNamespace(rule.name, syntax.namespace), { key, rule, syntax })
	}

	namesByTable.set(rules, made)

	return made
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

/** One copy of a neighbour, read whole: its option, whether its fix is off, its secondaries, the name it is configured under and the syntax of that name's namespace. */
export type NeighbourCopy = {
	option: string | true,
	fixDisabled: boolean,
	secondary: Record<string, unknown>,
	name: string,
	syntax: Syntax,
}

/** The one-key table each neighbour is looked up through, so the names it is configured under are built once. */
let tablesByRule: WeakMap<NeighbourRuleSetting, { copy: NeighbourRuleSetting }> = new WeakMap()

/**
 * Reads the copy of one neighbour that reads the root whole, secondaries included, under whichever namespace it is configured, as {@link neighbourSettings} finds it ([#715](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/715)).
 * @param node - A node of the root the rules read.
 * @param result - The PostCSS result carrying the configuration.
 * @param rule - The neighbour and the primaries it accepts.
 * @returns The copy, in a list of one; none where the neighbour is unlisted, refuses its primary, or is listed only under namespaces refusing the root.
 */
export function neighbourCopies (node: Node, result: PostcssResult, rule: NeighbourRuleSetting): NeighbourCopy[] {
	let table = tablesByRule.get(rule)

	if (!table) {
		table = { copy: rule }
		tablesByRule.set(rule, table)
	}

	return listedInRunOrder(node, result, table).map(({ option, setting, name, syntax }) => {
		let secondary: unknown = Array.isArray(setting) ? setting[1] : undefined

		return { option, fixDisabled: fixDisabledBy(setting), secondary: typeof secondary === `object` && secondary !== null ? secondary as Record<string, unknown> : {}, name, syntax }
	})
}
