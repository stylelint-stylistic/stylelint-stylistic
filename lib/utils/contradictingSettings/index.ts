import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { namespaces } from "../../syntaxes/index.ts"
import { type ConfigurationError, configurationError } from "../configurationError/index.ts"
import { copyReadingTheRoot } from "../copyReadingTheRoot/index.ts"

/** What every rule of the plugin is configured under. */
const PREFIX = `@stylistic/`

/** The name segments telling the two twins of one run apart. */
const NEWLINE_SEGMENT = `-newline-`
const SPACE_SEGMENT = `-space-`

/** The primaries of every rule that shares its run with a twin, by short name; the twin's name swaps `-newline-` and `-space-`. An option missing here is one the rule refuses, which configures nothing. */
const TWIN_OPTIONS: Record<string, string[]> = {
	"at-rule-name-newline-after": [`always`, `always-multi-line`],
	"at-rule-name-space-after": [`always`, `always-single-line`],
	"block-closing-brace-newline-after": [`always`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
	"block-closing-brace-newline-before": [`always`, `always-multi-line`, `never-multi-line`],
	"block-closing-brace-space-after": [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
	"block-closing-brace-space-before": [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
	"block-opening-brace-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"block-opening-brace-newline-before": [`always`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
	"block-opening-brace-space-after": [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
	"block-opening-brace-space-before": [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
	"declaration-block-semicolon-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"declaration-block-semicolon-newline-before": [`always`, `always-multi-line`, `never-multi-line`],
	"declaration-block-semicolon-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
	"declaration-block-semicolon-space-before": [`always`, `never`, `always-single-line`, `never-single-line`],
	"declaration-colon-newline-after": [`always`, `always-multi-line`],
	"declaration-colon-space-after": [`always`, `never`, `always-single-line`],
	"function-comma-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"function-comma-newline-before": [`always`, `always-multi-line`, `never-multi-line`],
	"function-comma-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
	"function-comma-space-before": [`always`, `never`, `always-single-line`, `never-single-line`],
	"function-parentheses-newline-inside": [`always`, `always-multi-line`, `never-multi-line`],
	"function-parentheses-space-inside": [`always`, `never`, `always-single-line`, `never-single-line`],
	"media-query-list-comma-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"media-query-list-comma-newline-before": [`always`, `always-multi-line`, `never-multi-line`],
	"media-query-list-comma-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
	"media-query-list-comma-space-before": [`always`, `never`, `always-single-line`, `never-single-line`],
	"selector-list-comma-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"selector-list-comma-newline-before": [`always`, `always-multi-line`, `never-multi-line`],
	"selector-list-comma-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
	"selector-list-comma-space-before": [`always`, `never`, `always-single-line`, `never-single-line`],
	"value-list-comma-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"value-list-comma-newline-before": [`always`, `always-multi-line`, `never-multi-line`],
	"value-list-comma-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
	"value-list-comma-space-before": [`always`, `never`, `always-single-line`, `never-single-line`],
	"value-slash-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"value-slash-newline-before": [`always`, `always-multi-line`, `never-multi-line`],
	"value-slash-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
	"value-slash-space-before": [`always`, `never`, `always-single-line`, `never-single-line`],
}

/** The break rules whose run stands outside the text its lines are counted of — in front of a block, behind one, in front of a value — so a break written there leaves a single-line construct single-line. */
const NEWLINE_RULES_OUTSIDE_THE_COUNTED_TEXT = new Set([`block-opening-brace-newline-before`, `block-closing-brace-newline-after`, `declaration-colon-newline-after`])

/** The rule asking for an empty line in front of a closing brace, and what no such line satisfies. */
const EMPTY_LINE_RULE = `block-closing-brace-empty-line-before`
const EMPTY_LINE_OPTION = `always-multi-line`
const EMPTY_LINE_REFUSERS: Record<string, unknown[]> = {
	"block-closing-brace-newline-before": [`never-multi-line`],
	"block-closing-brace-space-before": [`always`, `never`, `always-multi-line`, `never-multi-line`],
	"max-empty-lines": [0],
}

/** The rule forbidding whitespace behind a call's closing parenthesis, and the rules asking for some in front of what stands there. */
const FUNCTION_WHITESPACE_RULE = `function-whitespace-after`
const FUNCTION_WHITESPACE_OPTION = `never`
const RULES_BEHIND_A_FUNCTION = new Set([`declaration-block-semicolon-newline-before`, `declaration-block-semicolon-space-before`, `function-comma-newline-before`, `function-comma-space-before`, `function-parentheses-newline-inside`, `function-parentheses-space-inside`, `value-list-comma-newline-before`, `value-list-comma-space-before`, `value-slash-newline-before`, `value-slash-space-before`])

/** A rule of the plugin as a configuration sets it: the name it is configured under, the rule behind the namespace, and its primary option. */
export type ConfiguredSetting = {
	name: string,
	shortName: string,
	primary: unknown,
}

/** Two settings no spelling of an ordinary construct satisfies together, in configuration order, with what to change. */
export type Contradiction = {
	first: ConfiguredSetting,
	second: ConfiguredSetting,
	advice: string,
}

/** What parts the lines of the message, which is no stylesheet's text. */
const MESSAGE_LINE_BREAK = `\n`

/** What is left to say where no option of the two rules fits the other. */
const ADVICE_WITHOUT_AN_OPTION = `Change one of them, or turn one of them off.`

/** The lines of a construct an option speaks of. */
type Lines = `any` | `single` | `multi`

/**
 * Reads the lines a whitespace option speaks of off its suffix.
 * @param option - The option.
 * @returns The lines.
 */
function linesOf (option: string): Lines {
	if (option.endsWith(`-single-line`)) return `single`
	if (option.endsWith(`-multi-line`)) return `multi`

	return `any`
}

/**
 * Asks whether a whitespace option takes whitespace away rather than asking for some.
 * @param option - The option.
 * @returns True for the `never` options.
 */
function forbids (option: string): boolean {
	return option.startsWith(`never`)
}

/**
 * Asks whether a break rule and its space twin contradict each other: they speak of the same lines and ask for different characters. A break asked for on every line and a space asked for in single-line constructs meet only where the break leaves the construct single-line.
 * @param newlineRule - The break rule's short name.
 * @param newlineOption - Its option.
 * @param spaceOption - The space twin's option.
 * @returns True where no run satisfies both.
 */
function twinsContradict (newlineRule: string, newlineOption: string, spaceOption: string): boolean {
	if (forbids(newlineOption) && forbids(spaceOption)) return false

	let newlineLines = linesOf(newlineOption)
	let spaceLines = linesOf(spaceOption)

	if (newlineLines !== `any` && spaceLines !== `any`) return newlineLines === spaceLines
	if (newlineLines === `any` && spaceLines === `single`) return NEWLINE_RULES_OUTSIDE_THE_COUNTED_TEXT.has(newlineRule)

	return true
}

/** The suffixes binding a whitespace option to the lines of a construct. */
const LINE_SUFFIXES = { single: `-single-line`, multi: `-multi-line` } as const

/**
 * Spells a whitespace option for the lines given — bound where it speaks of every line, rebound where it speaks of the other ones — where its rule takes such an option.
 * @param setting - The setting.
 * @param lines - The lines the option is to speak of.
 * @returns The option, the setting's own where it speaks of those lines already; nothing where the rule has none.
 */
function boundTo (setting: ConfiguredSetting, lines: Exclude<Lines, `any`>): string | undefined {
	let option = setting.primary as string
	let other: Exclude<Lines, `any`> = lines === `single` ? `multi` : `single`
	let bare = option.endsWith(LINE_SUFFIXES[other]) ? option.slice(0, -LINE_SUFFIXES[other].length) : option
	let bound = bare.endsWith(LINE_SUFFIXES[lines]) ? bare : `${bare}${LINE_SUFFIXES[lines]}`

	return TWIN_OPTIONS[setting.shortName]?.includes(bound) ? bound : undefined
}

/**
 * Names the options that would make two contradicting twins agree, one speaking of single-line constructs and the other of multi-line ones, where their rules take such options; of the two ways round, the one changing fewer settings.
 * @param first - The setting the configuration lists first.
 * @param second - The other.
 * @returns The sentence closing the message.
 */
function adviceForTwins (first: ConfiguredSetting, second: ConfiguredSetting): string {
	let [newline, space] = first.shortName.includes(NEWLINE_SEGMENT) ? [first, second] : [second, first]
	let ways: string[][] = []

	for (let [newlineLines, spaceLines] of [[`multi`, `single`], [`single`, `multi`]] as const) {
		let newlineOption = boundTo(newline, newlineLines)
		let spaceOption = boundTo(space, spaceLines)

		if (newlineOption === undefined || spaceOption === undefined || twinsContradict(newline.shortName, newlineOption, spaceOption)) continue

		let changes = [[first, first === newline ? newlineOption : spaceOption, `first`], [second, second === newline ? newlineOption : spaceOption, `second`]] as const

		ways.push(changes.filter(([setting, option]) => setting.primary !== option).map(([, option, place]) => `the ${place} to "${option}"`))
	}

	let [fewest] = ways.toSorted((one, other) => one.length - other.length)

	return fewest ? `Set ${fewest.join(` and `)}, or turn one of them off.` : ADVICE_WITHOUT_AN_OPTION
}

/**
 * Asks whether one setting is a break rule and the other its space twin, contradicting each other.
 * @param newline - The setting that may be the break rule's.
 * @param space - The setting that may be its twin's.
 * @returns True where they are and do.
 */
function areContradictingTwins (newline: ConfiguredSetting, space: ConfiguredSetting): boolean {
	if (!newline.shortName.includes(NEWLINE_SEGMENT) || newline.shortName.replace(NEWLINE_SEGMENT, SPACE_SEGMENT) !== space.shortName) return false

	let newlineOption = newline.primary
	let spaceOption = space.primary

	// An option the rule itself refuses configures nothing
	if (typeof newlineOption !== `string` || typeof spaceOption !== `string`) return false
	if (!TWIN_OPTIONS[newline.shortName]?.includes(newlineOption) || !TWIN_OPTIONS[space.shortName]?.includes(spaceOption)) return false

	return twinsContradict(newline.shortName, newlineOption, spaceOption)
}

/**
 * Asks whether one setting asks for whitespace the other leaves no room for: the empty line in front of a closing brace, or any whitespace behind a call's closing parenthesis.
 * @param asker - The setting that may forbid or demand the run.
 * @param refuser - The setting that may ask the opposite of it.
 * @returns True where they do.
 */
function leaveNoRoom (asker: ConfiguredSetting, refuser: ConfiguredSetting): boolean {
	if (asker.shortName === EMPTY_LINE_RULE && asker.primary === EMPTY_LINE_OPTION) return Boolean(EMPTY_LINE_REFUSERS[refuser.shortName]?.includes(refuser.primary))

	if (asker.shortName === FUNCTION_WHITESPACE_RULE && asker.primary === FUNCTION_WHITESPACE_OPTION) return RULES_BEHIND_A_FUNCTION.has(refuser.shortName) && typeof refuser.primary === `string` && refuser.primary.startsWith(`always`)

	return false
}

/**
 * Asks whether two settings contradict each other, whichever way round they are given.
 * @param one - The setting the configuration lists first.
 * @param other - The other.
 * @returns The advice where they do, nothing where they do not.
 */
function adviceFor (one: ConfiguredSetting, other: ConfiguredSetting): string | undefined {
	if (areContradictingTwins(one, other) || areContradictingTwins(other, one)) return adviceForTwins(one, other)
	if (leaveNoRoom(one, other) || leaveNoRoom(other, one)) return ADVICE_WITHOUT_AN_OPTION

	return undefined
}

/**
 * Finds every pair of settings no spelling of an ordinary construct satisfies together ([#743](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/743)): a break rule and its space twin asking for different characters on the same lines, the empty line in front of a closing brace against the rules leaving no room for it, and whitespace forbidden behind a call against the rules asking for it there. Two copies of one rule under two namespaces never meet, since one copy reads a root (`copyReadingTheRoot`).
 * @param settings - The settings that read one stylesheet, in configuration order.
 * @returns The pairs, in configuration order.
 */
export function contradictionsAmong (settings: ConfiguredSetting[]): Contradiction[] {
	let found: Contradiction[] = []

	for (let [at, first] of settings.entries()) {
		for (let second of settings.slice(at + 1)) {
			let advice = adviceFor(first, second)

			if (advice !== undefined) found.push({ first, second, advice })
		}
	}

	return found
}

/**
 * Builds the configuration error naming every contradicting pair as the configuration spells it, with what to change.
 * @param contradictions - The pairs.
 * @returns The error Stylelint exits on.
 */
export function contradictionsError (contradictions: Contradiction[]): ConfigurationError {
	let blocks = contradictions.map(({ first, second, advice }) => [`Contradicting settings:`, ...[first, second].map(({ name, primary }) => `  "${name}": ${JSON.stringify(primary)}`), advice].join(MESSAGE_LINE_BREAK))

	return configurationError(blocks.join(MESSAGE_LINE_BREAK.repeat(2)))
}

/**
 * Reads a rule as a configuration sets it.
 * @param name - The name it is configured under, namespace included.
 * @param value - The configured value: a primary, or an array opening with one.
 * @returns The setting, its primary `null` or `undefined` where the rule is off.
 */
export function configuredSetting (name: string, value: unknown): ConfiguredSetting {
	return { name, shortName: name.slice(name.lastIndexOf(`/`) + 1), primary: Array.isArray(value) ? value[0] as unknown : value }
}

/** The roots each configuration was read for already, by the namespaces accepting them. */
let readConfigurations: WeakMap<object, Set<string>> = new WeakMap()

/**
 * Stops the run where the configuration Stylelint merged for this stylesheet holds contradicting settings. Only the copy of each rule that reads the root is asked, since no other runs over it; the answer is one per configuration and set of namespaces, so every later rule and file passes at once.
 * @param root - The stylesheet.
 * @param result - The PostCSS result carrying the configuration.
 * @throws {Error} A configuration error naming the pairs.
 */
export function refuseContradictingSettings (root: Root, result: PostcssResult): void {
	let config = result.stylelint?.config
	let rules: Record<string, unknown> | undefined = config?.rules

	if (!config || !rules) return

	let accepting = [css, ...namespaces].filter((syntax) => syntax.accepts(root, result))
	let key = accepting.map((syntax) => syntax.namespace ?? ``).join(`,`)
	let read = readConfigurations.get(config)

	if (read?.has(key)) return

	let settings: ConfiguredSetting[] = []

	for (let [name, value] of Object.entries(rules)) {
		let setting = configuredSetting(name, value)

		if (!name.startsWith(PREFIX) || setting.primary === null || setting.primary === undefined) continue

		// Only the copy of a rule that reads this root runs over it
		if (copyReadingTheRoot(setting.shortName, root, result) === name) settings.push(setting)
	}

	let contradictions = contradictionsAmong(settings)

	if (contradictions.length > 0) throw contradictionsError(contradictions)

	if (!read) {
		read = new Set()
		readConfigurations.set(config, read)
	}

	read.add(key)
}
