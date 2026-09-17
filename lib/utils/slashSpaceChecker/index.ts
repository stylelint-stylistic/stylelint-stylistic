import type { AtRule, Declaration, Root } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { LEADING_CSS_WHITESPACE, MEDIA_AT_RULE, SPACES_THEN_BLOCK_COMMENT, SPACES_THEN_INLINE_COMMENT, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { InlineCommentReading, Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../atRuleParamIndex/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { findEscapeSpans } from "../findCommentSpans/index.ts"
import { findSeparatorSlashes, type SeparatorSlash } from "../findSeparatorSlashes/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { maskEscapes } from "../maskEscapes/index.ts"
import { matchesStringOrRegExp } from "../matchesStringOrRegExp/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { rereadsAnAddress } from "../rereadsAnAddress/index.ts"
import type { WhitespaceChecker } from "../whitespaceChecker/index.ts"
import { runBehind, runInFront, writesTwinRun } from "../writesTwinRun/index.ts"

let { utils: { report } } = stylelint

/** The solidus rules' options. */
export type SlashSpaceCheckerOptions = {
	root: Root,
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,

	/** The rule's name without its namespace, which names its twin. */
	shortName: string,

	/** A `whitespaceChecker`'s side. */
	locationChecker: WhitespaceChecker,

	/** The side of the solidus. */
	position: `before` | `after`,

	/** The primary option. */
	expectation: string,

	/** What `always` writes. */
	whitespace: `space` | `newline`,

	/** The calls skipped, nested too. */
	ignoreFunctions?: string | RegExp | (string | RegExp)[] | undefined,

	/** The properties skipped. */
	ignoreProperties?: string | RegExp | (string | RegExp)[] | undefined,
}

/**
 * Where a solidus rule checks one solidus, or nothing where it passes it over: only a break asked behind the solidus is asked anywhere but at the solidus itself.
 * @param text - The text the solidus stands in.
 * @param slashIndex - The solidus's index.
 * @param position - The side of the solidus the rule reads.
 * @param whitespace - What the rule's `always` writes.
 * @returns The index checked, or nothing.
 */
function checkIndexOf (text: string, slashIndex: number, position: `before` | `after`, whitespace: `space` | `newline`): number | undefined {
	if (position === `before` || whitespace === `space`) return slashIndex

	let behind = text.slice(slashIndex + 1)

	if (SPACES_THEN_INLINE_COMMENT.test(behind)) return undefined

	return SPACES_THEN_BLOCK_COMMENT.test(behind) ? text.indexOf(`*/`, slashIndex + 1) + 1 : slashIndex
}

/** The run a solidus rule reads beside one solidus, and the span its fix writes. */
type SolidusSpans = {
	run: { start: number, end: number },
	span: { start: number, end: number },
}

/**
 * Reads the run beside a solidus and names the span the fix writes: a break asked behind the solidus goes in front of the run, which becomes the next line's indentation.
 * @param text - The text the solidus stands in.
 * @param checkIndex - The index the rule checks at.
 * @param position - The side of the solidus the rule reads.
 * @param whitespace - What the rule's `always` writes.
 * @param writes - Whether the rule's option writes whitespace.
 * @returns The run and the span.
 */
function spansAt (text: string, checkIndex: number, position: `before` | `after`, whitespace: `space` | `newline`, writes: boolean): SolidusSpans {
	let run = position === `before`
		? { start: checkIndex - (text.slice(0, checkIndex).match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0].length, end: checkIndex }
		: { start: checkIndex + 1, end: checkIndex + 1 + (text.slice(checkIndex + 1).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0].length }

	return { run, span: whitespace === `newline` && position === `after` && writes ? { start: run.start, end: run.start } : run }
}

/**
 * Asks whether a solidus rule may write the span it names; a fixer cannot decline, so the answer is needed before the report.
 *
 * Both sides refuse the write that moves the character behind the span into a `//` comment: behind the solidus that is closing it up against a comment (`1 /// c` is one), in front of it the solidus itself, which a write emptying the run brings against the solidus ahead of it and so opens the comment it moves into. `before` refuses as well the write landing in a comment the text already stands in, which `movesEndIntoInlineComment` passes over wherever the run holds no break to close that comment.
 *
 * A write behind the solidus is refused too where it parts the name of a bare address from the solidus or joins it to it and the two readings of the parentheses part: PostCSS's tokenizer reads `1/url` as one word, so the parentheses behind it are code, while behind `1/ url` they are one token closed at the first `)`.
 * @param syntax - The syntax the rule is built over.
 * @param reading - What the syntax makes of a `//` comment.
 * @param text - The text the solidus stands in.
 * @param span - The span the fix writes.
 * @param written - What the fix puts there.
 * @param position - The side of the solidus.
 * @returns True where the fix may be written.
 */
function writesTheSpan (syntax: Syntax, reading: InlineCommentReading, text: string, span: { start: number, end: number }, written: string, position: `before` | `after`): boolean {
	if (syntax.movesEndIntoInlineComment(text.slice(0, span.end + 1), text.slice(0, span.start) + written + text.charAt(span.end), reading)) return false

	if (rereadsAnAddress(text, { ...span, text: written }, reading)) return false

	return position === `after` || !syntax.endsWithInlineComment(text.slice(0, span.start), reading)
}

/**
 * Builds the check of one text's separator solidi.
 *
 * A run ends at a vertical tab or a no-break space ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). The text is edited from the back, not printed, since `postcss-value-parser` may not return what it was given.
 *
 * A newline rule behind the solidus reads as its comma twin does ([#622](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/622)): a `//` comment behind it already ends in a break, so the solidus is skipped; a block comment is read through, the break asked for behind its `*\/`. The break goes in front of the run, which becomes the next line's indentation.
 *
 * The break rule and the space rule of one side write the same run, so only one of them writes it ([#704](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/704)); the other reports and leaves the text.
 * @param opts - The options.
 * @returns The check.
 */
function textChecker (opts: SlashSpaceCheckerOptions): (node: AtRule | Declaration, text: string, textIndex: number, lineCheckStr: string, readsGroups: boolean) => void {
	let { syntax, result, position, whitespace } = opts
	let writes = opts.expectation.startsWith(`always`)

	return (node, text, textIndex, lineCheckStr, readsGroups) => {
		let reading = syntax.inlineComments(node, result)
		// The run beside the solidus is read over the copy with its escapes masked, where an escaped space is a character of a word and no run (1789661964); the guards read the text the write lands in
		let runText = maskEscapes(text, findEscapeSpans(text, reading), true)
		let written = writes ? (whitespace === `newline` ? getLineBreak(node, result) : ` `) : ``
		let edits: Edit[] = []

		let checks: { slash: SeparatorSlash, checkIndex: number }[] = []

		for (let slash of findSeparatorSlashes(text, syntax, node, result, { readsGroups, ignoreFunctions: opts.ignoreFunctions })) {
			let checkIndex = checkIndexOf(text, slash.index, position, whitespace)

			if (checkIndex !== undefined) checks.push({ slash, checkIndex })
		}

		for (let { slash, checkIndex } of checks) {
			let { run, span } = spansAt(runText, checkIndex, position, whitespace, writes)
			// Refused before the report, since a fixer cannot decline
			let isFixable = writesTheSpan(syntax, reading, text, span, written, position)

			opts.locationChecker({
				source: runText,
				index: checkIndex,
				lineCheckStr,
				err: (message) => {
					let index = textIndex + slash.index
					// Asked here rather than before the check, so a text no rule reports on is never weighed against the twin
					let writesTheRun = isFixable && writesTwinRun(opts.shortName, opts.checkedRuleName, node, result, {
						side: position,
						run: text.slice(run.start, run.end),
						lineText: lineCheckStr,
						runs: () => checks.map(({ checkIndex: each }) => position === `before` ? runInFront(runText, each) : runBehind(runText, each)),
						line: node.rangeBy({ index }).start.line,
						twinWrites: (twinOption, secondary, over) => {
							// A twin passing the property or a call around the solidus over contends for nothing
							if (node.type === `decl` && optionsMatches(secondary, `ignoreProperties`, node.prop)) return false

							if (slash.functionNames.some((name) => optionsMatches(secondary, `ignoreFunctions`, name))) return false

							// The text this write leaves, the run standing over by what the gate asks about; in front of the solidus the write moves the solidus itself. The copy is edited alike, since the run holds no escape
							let twinText = text.slice(0, run.start) + over + text.slice(run.end)
							let twinRunText = runText.slice(0, run.start) + over + runText.slice(run.end)
							let twinIndex = position === `before` ? run.start + over.length : slash.index

							// In front of the solidus both twins read the very run the other writes; behind it they part over a comment
							if (position === `after`) {
								// The space twin reads the run right behind the solidus, which is this one where no comment moved the check (#704)
								if (whitespace === `newline`) {
									if (checkIndex !== slash.index) return false
								}
								else {
									// The break twin reads past a block comment behind the solidus and passes over one a `//` comment follows, and a write can move either against the solidus or off it
									let behind = twinText.slice(slash.index + 1)

									if (SPACES_THEN_INLINE_COMMENT.test(behind) || SPACES_THEN_BLOCK_COMMENT.test(behind)) return false
								}
							}

							// A twin whose own guard refuses writes nothing, so it holds nothing (#536): asked over the text this write leaves, since emptying a run brings two solidi together into a `//` comment
							let twinWhitespace = whitespace === `newline` ? `space` as const : `newline` as const
							let twinWrites = twinOption.startsWith(`always`)
							let twinWritten = twinWrites ? (twinWhitespace === `newline` ? getLineBreak(node, result) : ` `) : ``

							return writesTheSpan(syntax, reading, twinText, spansAt(twinRunText, twinIndex, position, twinWhitespace, twinWrites).span, twinWritten, position)
						},
					})

					report({
						message,
						node,
						index,
						endIndex: index,
						result,
						ruleName: opts.checkedRuleName,
						...(writesTheRun && { fix: (): void => { edits.push({ ...span, text: written }) } }),
					})
				},
			})
		}

		if (edits.length > 0) syntax.write(node, applyEditsFromEnd(text, edits))
	}
}

/**
 * Checks every declaration value's separator solidi; a computed value is skipped, and `-single-line` reads the declaration to its bang's end.
 * @param opts - The options.
 */
export function checkValueSlashes (opts: SlashSpaceCheckerOptions): void {
	let { syntax } = opts
	let check = textChecker(opts)

	opts.root.walkDecls((decl) => {
		if (!syntax.isStandardDeclaration(decl) || !syntax.isStandardProperty(decl.prop)) return

		if (opts.ignoreProperties !== undefined && matchesStringOrRegExp(decl.prop, opts.ignoreProperties)) return

		let value = syntax.read(decl)

		if (!syntax.isStandardValue(value) || syntax.valueEmbedsHostCode(decl)) return

		check(decl, value, declarationValueIndex(decl), declarationString(syntax, decl), false)
	})
}

/**
 * Checks every `@media` query's separator solidi; a feature is a nameless parenthesised group, so the walk reads into every group, and an interpolation skips the parameters.
 * @param opts - The options.
 */
export function checkMediaFeatureSlashes (opts: SlashSpaceCheckerOptions): void {
	let { syntax } = opts
	let check = textChecker(opts)

	opts.root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
		if (!syntax.isStandardAtRule(atRule)) return

		let params = syntax.read(atRule)

		if (!syntax.isStandardValue(params)) return

		check(atRule, params, atRuleParamIndex(atRule), params, true)
	})
}
