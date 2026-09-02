import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { defersToRunEnd } from "../defersToRunEnd/index.ts"

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
 * Reads the settings of some neighbouring rules out of the configuration, in the order the run makes them: the configuration's for the rules that run at their turn, and the lineness-conditioned ones behind them all, since those wait for the run's writers (#355).
 *
 * Stylelint runs each rule once and in the order the configuration lists them: it sorts the rules of a run by its own registry, a plugin's rules stand nowhere in it, and the sort is stable, so the order of the keys is the order of the run. The settings are read out of `result.stylelint.config`, which holds every rule's normalised settings and is assigned before any rule runs, under the names of the namespace the asking rule is registered under: the configuration of a file lists the core's names and a namespace's alike, and the family that reads the file is the one the rule belongs to. A rule listed with an option outside the ones it accepts is passed over, since it refuses such an option and runs over nothing. Whether the fix of a neighbour is turned off travels with its option, since a neighbour that speaks and reports but cannot write is a different thing to a writer than one that will rewrite what it is not content with (#485).
 * @param syntax - The syntax the asking rule is built over, whose namespace names the neighbours.
 * @param result - The Stylelint result, which holds the configuration.
 * @param rules - The neighbours to read, each under a key of the caller's; a key may stand empty, as a table shared by callers with unlike neighbours leaves some.
 * @returns Each neighbour the configuration lists with an option it accepts, by the caller's key, with that option and with whether the configuration turned the neighbour's fix off, in the order the run makes them.
 */
export function neighbourSettings<Key extends string> (syntax: Syntax, result: PostcssResult, rules: Partial<Record<Key, NeighbourRule>>): [Key, string, boolean][] {
	let settings: Record<string, unknown> = result.stylelint?.config?.rules ?? {}
	let neighbours = Object.entries(rules) as [Key, NeighbourRule][]
	let found: [Key, string, boolean][] = []

	for (let name of Object.keys(settings)) {
		let neighbour = neighbours.find(([, rule]) => name === addNamespace(rule.name, syntax.namespace))

		if (!neighbour) continue

		let [key, rule] = neighbour
		let setting = settings[name]
		let option = primaryOf(setting)

		if (option !== undefined && rule.options.includes(option)) found.push([key, option, fixDisabledBy(setting)])
	}

	// A lineness-conditioned neighbour waits for the run's writers (#355), so the run makes its turn after every neighbour that does not, whatever the configuration's spelling order — the partition is stable, and each half keeps that order among itself
	return [...found.filter(([, option]) => !defersToRunEnd(option)), ...found.filter(([, option]) => defersToRunEnd(option))]
}

/**
 * Reads whether a setting turns the rule's fix off: `disableFix` stands among the secondary options, which close the array a normalised configuration wraps every setting in.
 *
 * Stylelint holds two readings of it, and the one that governs this plugin is the wider: `report` refuses to run a fix wherever the option is truthy, and every rule here fixes through the callback it hands `report`, while the `disableFix === true` of `lintPostcssResult` only unsets the `context.fix` no rule of this plugin reads. So the reading here is the truthy one — a neighbour whose spelling of the option `report` honours is one that cannot write, however that spelling reads elsewhere.
 * @param setting - The setting.
 * @returns True where the fix is turned off.
 */
function fixDisabledBy (setting: unknown): boolean {
	if (!Array.isArray(setting)) return false

	let secondary: unknown = setting[1]

	return typeof secondary === `object` && secondary !== null && Boolean((secondary as { disableFix?: unknown }).disableFix)
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
