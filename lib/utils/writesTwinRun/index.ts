import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LEADING_CSS_WHITESPACE, LEADING_LINE_BREAK, TRAILING_CSS_WHITESPACE, TRAILING_LINE_BREAK_AND_INDENTATION } from "../../regexps.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { type NeighbourRule, neighbourSettings, speaksOf } from "../neighbourSettings/index.ts"

/** The two twins: the rule asking for a break and the rule asking for a space. */
type Twin = `newline` | `space`

/** A spelling of the run, as the twins judge it; `other` (two spaces, a space and a break) is one no option accepts. */
type Run = `newline` | `space` | `none` | `other`

/** The primaries of every rule that shares its run with a twin, by short name; the twin's name swaps `-newline-` and `-space-`. */
const TWIN_OPTIONS: Record<string, string[]> = {
	"function-comma-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"function-comma-newline-before": [`always`, `always-multi-line`, `never-multi-line`],
	"function-comma-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
	"function-comma-space-before": [`always`, `never`, `always-single-line`, `never-single-line`],
	"media-query-list-comma-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"media-query-list-comma-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
	"selector-list-comma-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"selector-list-comma-newline-before": [`always`, `always-multi-line`, `never-multi-line`],
	"selector-list-comma-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
	"selector-list-comma-space-before": [`always`, `never`, `always-single-line`, `never-single-line`],
	"value-list-comma-newline-after": [`always`, `always-multi-line`, `never-multi-line`],
	"value-list-comma-space-after": [`always`, `never`, `always-single-line`, `never-single-line`],
}

/** The twin tables, built once per pair. */
let tablesByPair: Map<string, Record<Twin, NeighbourRule>> = new Map()

/**
 * Builds the table of one pair of twins.
 * @param shortName - Either twin's short name.
 * @returns The table, or nothing where the rule has no twin.
 */
function twinsOf (shortName: string): Record<Twin, NeighbourRule> | undefined {
	let newlineName = shortName.replace(`-space-`, `-newline-`)
	let spaceName = shortName.replace(`-newline-`, `-space-`)
	let table = tablesByPair.get(newlineName)

	if (table) return table

	let newlineOptions = TWIN_OPTIONS[newlineName]
	let spaceOptions = TWIN_OPTIONS[spaceName]

	if (!newlineOptions || !spaceOptions || newlineName === spaceName) return undefined

	table = { newline: { name: newlineName, options: newlineOptions }, space: { name: spaceName, options: spaceOptions } }
	tablesByPair.set(newlineName, table)

	return table
}

/** The run a twin's check reads at one delimiter, and what its lineness is judged over. */
export type TwinRun = {

	/** The side of the delimiter the run stands on. */
	side: `after` | `before`,

	/** The whitespace standing there. */
	run: string,

	/** The text both twins count lines of, the runs included. */
	lineText: string,

	/** The runs on the same side of every delimiter of that text, this one included, which the rule writes alike, so a write is judged by the lines it leaves once all are written. */
	runs: () => string[],

	/** The line a fix would write on, for the disable comments. */
	line: number | undefined,

	/** Whether the twin, under its primary and secondaries, reads this very run and would write it where the given whitespace stands over it; a twin passing the delimiter over or reading behind a comment contends for nothing, and a write can move that comment against the delimiter. */
	twinWrites: (option: string, secondary: Record<string, unknown>, run: string) => boolean,
}

/**
 * Reads the spelling of the run as the twins' checks read it: the break rule's `always` takes a break opening the run behind the delimiter, or closing it in front with indentation behind, and the space rule's a single space.
 * @param side - The side of the delimiter.
 * @param run - The run.
 * @returns The spelling.
 */
function spellingOf (side: `after` | `before`, run: string): Run {
	if (run === ``) return `none`
	if (run === ` `) return `space`

	return (side === `after` ? LEADING_LINE_BREAK : TRAILING_LINE_BREAK_AND_INDENTATION).test(run) ? `newline` : `other`
}

/**
 * The spellings an option accepts: `always` what its twin writes, `never` no whitespace.
 * @param twin - The twin.
 * @param option - The primary option.
 * @returns The accepted spellings.
 */
function accepts (twin: Twin, option: string): Run[] {
	return option.startsWith(`always`) ? [twin] : [`none`]
}

/**
 * Counts the line breaks of a text.
 * @param text - The text.
 * @returns The count.
 */
function breaksOf (text: string): number {
	return text.match(EVERY_LINE_BREAK)?.length ?? 0
}

/**
 * Reads a copy's secondary options out of the configuration.
 * @param result - The Stylelint result, which holds the configuration.
 * @param name - The name the copy is configured under.
 * @returns The secondaries, empty where none are given.
 */
function secondaryOf (result: PostcssResult, name: string): Record<string, unknown> {
	let setting: unknown = result.stylelint?.config?.rules?.[name]
	let secondary: unknown = Array.isArray(setting) ? setting[1] : undefined

	return typeof secondary === `object` && secondary !== null ? secondary as Record<string, unknown> : {}
}

/**
 * Reads the run behind a delimiter.
 * @param text - The text the delimiter stands in.
 * @param index - The delimiter's index.
 * @returns The whitespace behind it.
 */
export function runBehind (text: string, index: number): string {
	return (text.slice(index + 1).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]
}

/**
 * Reads the run in front of a delimiter.
 * @param text - The text the delimiter stands in.
 * @param index - The delimiter's index.
 * @returns The whitespace in front of it.
 */
export function runInFront (text: string, index: number): string {
	return (text.slice(0, index).match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0]
}

/**
 * Asks whether a rule is the one to write the run beside a delimiter, which its twin reads and writes too ([#704](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/704)).
 *
 * A rule writes only where every twin behind it in run order that would write the very same run accepts a spelling it accepts, or is one the write silences; otherwise that twin's write would be the file's last, and this rule's warning would be dropped as fixed over a run it refuses. A twin ahead ran before the write, so where it was content with the run as it stood and refuses what the write leaves, the write would put the file in breach of a rule that reported nothing ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)).
 *
 * A twin behind that would write nothing gates nothing: its `disableFix`, its disable ranges and its own guards are asked before it is counted in; a twin ahead is asked about its disable ranges and guards alone, a turned-off fix still reporting or staying silent ([#536](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/536)). A `-single-line` or `-multi-line` option is judged over the text as the write leaves it, a written break making it multi-line.
 * @param shortName - The asking rule's short name.
 * @param ruleName - The asking rule's configured name.
 * @param node - The node the run stands in.
 * @param result - The Stylelint result, which holds the configuration.
 * @param twinRun - The run and how the twin reads it.
 * @returns True where the asking rule writes the run.
 */
export function writesTwinRun (shortName: string, ruleName: string, node: Node, result: PostcssResult, twinRun: TwinRun): boolean {
	let twins = twinsOf(shortName)

	if (!twins) return true

	let settings = neighbourSettings(node, result, twins)
	let position = settings.findIndex(([, , , name]) => name === ruleName)

	if (position === -1) return true

	let { side, run, lineText, runs, line, twinWrites } = twinRun
	let [asking, option] = settings[position] as [Twin, string, boolean, string]
	let accepted = accepts(asking, option)
	let writes: Run = option.startsWith(`always`) ? asking : `none`
	let standing = spellingOf(side, run)
	let breaksOutsideTheRuns: number | undefined

	/**
	 * Asks whether the text is one line once a spelling stands over every run.
	 * @param written - The spelling over the runs.
	 * @returns True where it is one line.
	 */
	function isSingleLineWith (written: Run): boolean {
		if (written === `newline`) return false

		breaksOutsideTheRuns ??= breaksOf(lineText) - runs().reduce((sum, each) => sum + breaksOf(each), 0)

		return breaksOutsideTheRuns === 0
	}

	let written = writes === `newline` ? getLineBreak(node, result) : (writes === `space` ? ` ` : ``)

	/**
	 * Asks whether a twin copy would write this run, its fix kept on by the disable comments.
	 * @param twinOption - The copy's primary.
	 * @param twinName - The name it is configured under.
	 * @param over - The whitespace standing over the run.
	 * @returns True where it contends for the run.
	 */
	function contends (twinOption: string, twinName: string, over: string): boolean {
		if (line !== undefined && fixDisabledOnLine(result, twinName, line)) return false

		return twinWrites(twinOption, secondaryOf(result, twinName), over)
	}

	let restsBehind = settings.slice(position + 1).every(([behind, behindOption, behindFixTurnedOff, behindName]) => {
		// A turned-off fix rewrites nothing, so it gates nothing (#485)
		if (behind === asking || behindFixTurnedOff || !speaksOf(behindOption, () => isSingleLineWith(writes)) || !contends(behindOption, behindName, written)) return true

		let behindWrites: Run = behindOption.startsWith(`always`) ? behind : `none`

		return accepts(behind, behindOption).some((spelling) => accepted.includes(spelling)) || !speaksOf(option, () => isSingleLineWith(behindWrites))
	})

	// A turned-off fix exempts nothing ahead: such a rule still reports, or still stays silent
	let restsAhead = settings.slice(0, position).every(([ahead, aheadOption, , aheadName]) => {
		if (ahead === asking) return true

		// One that read another run, past a comment the write moves against the delimiter, judged nothing here; one the write moves off this run reads nothing it leaves
		let readStanding = contends(aheadOption, aheadName, run)

		if (!contends(aheadOption, aheadName, written)) return true

		let aheadAccepts = accepts(ahead, aheadOption)

		// It warned about the run as it stood, or is silent about what the write leaves
		if (readStanding && speaksOf(aheadOption, () => isSingleLineString(lineText)) && !aheadAccepts.includes(standing)) return true
		if (!speaksOf(aheadOption, () => isSingleLineWith(writes))) return true

		return aheadAccepts.includes(writes)
	})

	return restsBehind && restsAhead
}
