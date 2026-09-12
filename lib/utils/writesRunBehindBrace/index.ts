import type { AtRule, ChildNode, Rule } from "postcss"
import type { PostcssResult } from "stylelint"

import { LEADING_LINE_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { blockString } from "../blockString/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { type NeighbourRule, neighbourSettings, speaksOf } from "../neighbourSettings/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { pastEndOfLineComment } from "../pastEndOfLineComment/index.ts"
import { runBehindBrace } from "../runBehindBrace/index.ts"
import { isAtRule } from "../typeGuards/index.ts"

/** The two rules that read the run behind a closing brace. */
type Participant = `newline` | `space`

/** A spelling of that run, as the rules judge it. */
type Run = `newline` | `space` | `none` | `other`

/** The two rules and the whitespace each writes where its option is an `always` one. */
const PARTICIPANTS: Record<Participant, NeighbourRule & { writes: Run }> = {
	newline: {
		name: `block-closing-brace-newline-after`,
		options: [`always`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
		writes: `newline`,
	},
	space: {
		name: `block-closing-brace-space-after`,
		options: [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
		writes: `space`,
	},
}

/**
 * The spellings a rule's option accepts of the run: `always` what the rule writes, `never` no whitespace at all.
 * @param participant - The rule.
 * @param option - Its primary option, `always` or `never` with any line suffix.
 * @returns The accepted spellings.
 */
function accepts (participant: Participant, option: string): Run[] {
	return option.startsWith(`always`) ? [PARTICIPANTS[participant].writes] : [`none`]
}

/**
 * Reads the spelling of the run as it stands, which each rule judges by its first character.
 * @param run - The run, from {@link runBehindBrace}.
 * @returns The spelling.
 */
function spellingOf (run: string): Run {
	if (run === ``) return `none`
	if (LEADING_LINE_BREAK.test(run)) return `newline`

	return run === ` ` ? `space` : `other`
}

/**
 * The node whose leading raw a rule writes behind this brace.
 *
 * The space rule writes the very next node's. The newline rule reads past a comment ending the brace's line and writes the raw of whatever stands behind it, so behind such a comment the two write different raws and contend over nothing; it also passes over an at-rule its `ignoreAtRules` names, and writes nothing where the comment ends the block or the file.
 * @param participant - The rule.
 * @param configuredName - The name the configuration lists that rule under, whose secondaries are read.
 * @param result - The Stylelint result, which holds the configuration.
 * @param statement - The rule or at-rule whose closing brace the run stands behind.
 * @returns The node, or nothing where the rule writes no raw here.
 */
function writtenNodeOf (participant: Participant, configuredName: string, result: PostcssResult, statement: AtRule | Rule): ChildNode | undefined {
	let next = statement.next()

	if (!next || participant === `space`) return next

	let setting: unknown = result.stylelint?.config?.rules?.[configuredName]
	let secondary: unknown = Array.isArray(setting) ? setting[1] : undefined

	if (isAtRule(statement) && optionsMatches(typeof secondary === `object` && secondary !== null ? secondary as Record<string, unknown> : {}, `ignoreAtRules`, statement.name)) return undefined

	return pastEndOfLineComment(next)
}

/**
 * Asks whether the asking rule is the one to write the run behind a closing brace, which both `block-closing-brace-*-after` rules write into a node's `raws.before` ([#698](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/698)).
 *
 * A rule writes only where every rule behind it in run order that would write the very same raw accepts a spelling it accepts too; otherwise that rule's write would be the file's last and this one's warning would be dropped as fixed over a run it does not accept ([#704](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/704)). Where the two accept a spelling in common both may write, since what either leaves the other accepts; the texts are not identical, the space rule keeping a stray semicolon the break rule takes away with the rest of the raw ([#687](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/687)).
 *
 * A neighbour that would write nothing gates nothing, so its `disableFix`, its disable ranges and its own guards — the at-rules it passes over, the raw it writes, the semicolon the space rule refuses to write over — are asked before it is counted in ([#536](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/536)).
 *
 * A rule ahead ran before the write and judged the run as it stood, so where it was content with that and refuses what the write leaves, the write would put the file in breach of a rule that reported nothing ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)). Both judge the lineness of the block whose brace it is, and a write behind a brace nested inside that block does move it, so the two answer about the block as each of them finds it.
 * @param syntax - The asking rule's syntax, whose namespace names the neighbour.
 * @param statement - The rule or at-rule whose closing brace the run stands behind.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - The asking rule's registered name.
 * @returns True where the asking rule writes the run.
 */
export function writesRunBehindBrace (syntax: Syntax, statement: AtRule | Rule, result: PostcssResult, ruleName: string): boolean {
	let asking = (Object.keys(PARTICIPANTS) as Participant[]).find((participant) => addNamespace(PARTICIPANTS[participant].name, syntax.namespace) === ruleName)

	if (!asking) return true

	let settings = neighbourSettings(statement, result, PARTICIPANTS)
	let position = settings.findIndex(([, , , name]) => name === ruleName)

	if (position === -1) return true

	let askingNode = writtenNodeOf(asking, ruleName, result, statement)

	if (!askingNode) return true

	let [, option] = settings[position] as [Participant, string, boolean, string]
	let accepted = accepts(asking, option)
	let singleLine: boolean | undefined

	/**
	 * Whether the block is on one line, printed once.
	 * @returns True when it is.
	 */
	function isSingleLine (): boolean {
		singleLine ??= isSingleLineString(blockString(statement, result))

		return singleLine
	}

	let line = statement.source?.end?.line
	let parted = runBehindBrace(askingNode)

	/**
	 * Asks whether a neighbour would write this very raw, so that its option gates the asking rule at all.
	 * @param neighbour - The rule.
	 * @param neighbourOption - Its primary option.
	 * @param neighbourName - The name the configuration lists it under.
	 * @returns True where it speaks of this block, writes this raw, and no disable comment keeps it off the line.
	 */
	function contends (neighbour: Participant, neighbourOption: string, neighbourName: string): boolean {
		if (!speaksOf(neighbourOption, isSingleLine)) return false
		if (writtenNodeOf(neighbour, neighbourName, result, statement) !== askingNode) return false
		// The space rule writes nothing where a further semicolon stands inside the run, so it contends for nothing there
		if (neighbour === `space` && parted.holdsASemicolon) return false

		return line === undefined || !fixDisabledOnLine(result, neighbourName, line)
	}

	let restsBehind = settings.slice(position + 1).every(([behind, behindOption, behindFixTurnedOff, behindName]) => {
		// A turned-off fix rewrites nothing, so it gates nothing (#485)
		if (behindFixTurnedOff || !contends(behind, behindOption, behindName)) return true

		return accepts(behind, behindOption).some((run) => accepted.includes(run))
	})

	let standing = spellingOf(parted.run)

	// A rule ahead judged the run before the write, so where it was content with what stands and refuses what the write leaves, the write would put the file in breach of a rule that reported nothing (#355). A turned-off fix exempts nothing here: such a rule still reports, or still stays silent
	let restsAhead = settings.slice(0, position).every(([ahead, aheadOption, , aheadName]) => {
		if (!contends(ahead, aheadOption, aheadName)) return true

		let aheadAccepts = accepts(ahead, aheadOption)

		return !aheadAccepts.includes(standing) || aheadAccepts.some((run) => accepted.includes(run))
	})

	return restsBehind && restsAhead
}
