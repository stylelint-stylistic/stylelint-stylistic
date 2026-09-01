import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"

/** A neighbouring rule a writer reads the setting of: the name its directory spells, and the primary options it accepts, since a rule handed an option outside them refuses it and runs over nothing. */
export type NeighbourRule = {
	name: string,
	options: string[],
}

/**
 * Reads the primary option out of a rule's setting: the array a normalised configuration wraps every setting in, which the option opens and the secondary options close, or the option alone as a setting may be handed over before normalisation.
 * @param setting - The setting.
 * @returns The option, where it is a keyword.
 */
function primaryOf (setting: unknown): string | undefined {
	let option = Array.isArray(setting) ? setting[0] : setting

	return typeof option === `string` ? option : undefined
}

/**
 * Reads the settings of some neighbouring rules out of the configuration, in the order the run makes them.
 *
 * Stylelint runs each rule once and in the order the configuration lists them: it sorts the rules of a run by its own registry, a plugin's rules stand nowhere in it, and the sort is stable, so the order of the keys is the order of the run. The settings are read out of `result.stylelint.config`, which holds every rule's normalised settings and is assigned before any rule runs, under the names of the namespace the asking rule is registered under: the configuration of a file lists the core's names and a namespace's alike, and the family that reads the file is the one the rule belongs to. A rule listed with an option outside the ones it accepts is passed over, since it refuses such an option and runs over nothing.
 * @param syntax - The syntax the asking rule is built over, whose namespace names the neighbours.
 * @param result - The Stylelint result, which holds the configuration.
 * @param rules - The neighbours to read, each under a key of the caller's; a key may stand empty, as a table shared by callers with unlike neighbours leaves some.
 * @returns Each neighbour the configuration lists with an option it accepts, by the caller's key and with that option, in the order the run makes them.
 */
export function neighbourSettings<Key extends string> (syntax: Syntax, result: PostcssResult, rules: Partial<Record<Key, NeighbourRule>>): [Key, string][] {
	let settings: Record<string, unknown> = result.stylelint?.config?.rules ?? {}
	let neighbours = Object.entries(rules) as [Key, NeighbourRule][]
	let found: [Key, string][] = []

	for (let name of Object.keys(settings)) {
		let neighbour = neighbours.find(([, rule]) => name === addNamespace(rule.name, syntax.namespace))

		if (!neighbour) continue

		let [key, rule] = neighbour
		let option = primaryOf(settings[name])

		if (option !== undefined && rule.options.includes(option)) found.push([key, option])
	}

	return found
}

/**
 * Asks whether an option of a rule about whitespace speaks of a piece of text at all.
 *
 * `always` and `never` speak of every one; the `-single-line` and `-multi-line` options of a text on one line or over several, the way the rule itself decides it through `lineCheckStr`. An option silent about the text asks for nothing and takes nothing away.
 * @param option - The primary option, where the configuration lists the rule.
 * @param isSingleLine - Whether the text the rule counts the lines of stands on one line, asked only where the option turns on it.
 * @returns True where the option speaks of the text.
 */
export function speaksOf (option: string, isSingleLine: () => boolean): boolean {
	if (option === `always` || option === `never`) return true
	if (option === `always-single-line` || option === `never-single-line`) return isSingleLine()
	if (option === `always-multi-line` || option === `never-multi-line`) return !isSingleLine()

	return false
}
