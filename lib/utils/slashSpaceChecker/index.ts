import type { AtRule, Declaration, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { LEADING_CSS_WHITESPACE, MEDIA_AT_RULE, SPACES_THEN_BLOCK_COMMENT, SPACES_THEN_INLINE_COMMENT, TRAILING_CSS_WHITESPACE, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import type { InlineCommentReading, Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../atRuleParamIndex/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { editKeepsEscapedCharacter } from "../editKeepsEscapedCharacter/index.ts"
import { findEscapeSpans } from "../findCommentSpans/index.ts"
import { findSeparatorSlashes, type SeparatorSlash } from "../findSeparatorSlashes/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { maskEscapes } from "../maskEscapes/index.ts"
import { matchesStringOrRegExp } from "../matchesStringOrRegExp/index.ts"
import { rawInFrontOfText } from "../rawInFrontOfText/index.ts"
import { report } from "../report/index.ts"
import { rereadsAnAddress } from "../rereadsAnAddress/index.ts"
import { type EdgeFix, edgeRunOutOfReach, edgeRunOwned, type EdgeWrite, textBeforeAsLeft, writeEdgeRun } from "../textEdge/index.ts"
import { isAtRule } from "../typeGuards/index.ts"
import type { WhitespaceChecker } from "../whitespaceChecker/index.ts"
import { fixApplies } from "../writesKeepingAddresses/index.ts"

/** The solidus rules' options. */
export type SlashSpaceCheckerOptions = {
	root: Root,
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,

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

/**
 * Names the span the fix of a solidus rule writes beside one solidus: a break asked behind the solidus goes in front of the run, which becomes the next line's indentation.
 * @param text - The text the solidus stands in.
 * @param checkIndex - The index the rule checks at.
 * @param position - The side of the solidus the rule reads.
 * @param whitespace - What the rule's `always` writes.
 * @param writes - Whether the rule's option writes whitespace.
 * @returns The span.
 */
function spanAt (text: string, checkIndex: number, position: `before` | `after`, whitespace: `space` | `newline`, writes: boolean): { start: number, end: number } {
	let run = position === `before`
		? { start: checkIndex - (text.slice(0, checkIndex).match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0].length, end: checkIndex }
		: { start: checkIndex + 1, end: checkIndex + 1 + (text.slice(checkIndex + 1).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0].length }

	return whitespace === `newline` && position === `after` && writes ? { start: run.start, end: run.start } : run
}

/**
 * Asks whether a solidus rule may write the span it names; a fixer cannot decline, so the answer is needed before the report.
 *
 * Both sides refuse the write that moves the character behind the span into a `//` comment: behind the solidus that is closing it up against a comment (`1 /// c` is one), in front of it the solidus itself, which a write emptying the run brings against the solidus ahead of it and so opens the comment it moves into. `before` refuses as well the write landing in a comment the text already stands in, which `movesEndIntoInlineComment` passes over wherever the run holds no break to close that comment.
 *
 * A write behind the solidus is refused too where it parts the name of a bare address from the solidus or joins it to it and the two readings of the parentheses part: PostCSS's tokenizer reads `1/url` as one word, so the parentheses behind it are code, while behind `1/ url` they are one token closed at the first `)`.
 *
 * And a write is refused where the character behind a backslash the text in front of it ends on would change, since one of the two readings of that backslash takes what is written: `1\⏎/2` is a word, a delimiter and a ratio's solidus, and emptying the run would leave `1\/2`, one word.
 * @param syntax - The syntax the rule is built over.
 * @param reading - What the syntax makes of a `//` comment.
 * @param text - The text the solidus stands in.
 * @param span - The span the fix writes.
 * @param written - What the fix puts there.
 * @param position - The side of the solidus.
 * @param node - The declaration or the at-rule the text is read from.
 * @returns True where the fix may be written.
 */
function writesTheSpan (syntax: Syntax, reading: InlineCommentReading, text: string, span: { start: number, end: number }, written: string, position: `before` | `after`, node: AtRule | Declaration): boolean {
	if (syntax.movesEndIntoInlineComment(text.slice(0, span.end + 1), text.slice(0, span.start) + written + text.charAt(span.end), reading)) return false

	if (rereadsAnAddress(text, { ...span, text: written }, reading, node)) return false

	if (!editKeepsEscapedCharacter(text, { ...span, text: written })) return false

	return position === `after` || !syntax.endsWithInlineComment(text.slice(0, span.start), reading)
}

/**
 * Builds the check of one text's separator solidi.
 *
 * A run ends at a vertical tab or a no-break space. The text is edited from the back, not printed, since `postcss-value-parser` may not return what it was given.
 *
 * A newline rule behind the solidus reads as its comma twin does: a `//` comment behind it already ends in a break, so the solidus is skipped; a block comment is read through, the break asked for behind its `*\/`. The break goes in front of the run, which becomes the next line's indentation.
 * @param opts - The options.
 * @returns The check.
 */
function textChecker (opts: SlashSpaceCheckerOptions): (node: AtRule | Declaration, text: string, textIndex: number, lineCheckStr: string, readsGroups: boolean) => void {
	let { syntax, result, position, whitespace } = opts
	let writes = opts.expectation.startsWith(`always`)

	return (node, text, textIndex, lineCheckStr, readsGroups) => {
		let reading = syntax.inlineComments(node, result)
		// The run beside the solidus is read over the copy with its escapes masked, where an escaped space is a character of a word and no run; the guards read the text the write lands in
		let runText = maskEscapes(text, findEscapeSpans(text, reading), true)
		let written = writes ? (whitespace === `newline` ? getLineBreak(node, result) : ` `) : ``
		let edits: Edit[] = []
		// What the fix writes in front of a solidus opening the text, in the raw in front of it
		let edge: { written?: string } = {}

		let checks: { slash: SeparatorSlash, checkIndex: number }[] = []

		for (let slash of findSeparatorSlashes(text, syntax, node, result, { readsGroups, ignoreFunctions: opts.ignoreFunctions })) {
			let checkIndex = checkIndexOf(text, slash.index, position, whitespace)

			if (checkIndex !== undefined) checks.push({ slash, checkIndex })
		}

		// A solidus opening the text has its run in the raw in front of it, so whether the rule may write it there is asked over the rule's whole fix: what the other solidi would write, each of them where its own check reports a problem the guard reading the text its write lands in accepts and Stylelint will apply the fix to. The solidus at the head is therefore checked last and its problem reported first, it being the first in the text.
		let head = position === `before` ? checks.find(({ slash }) => slash.index === 0) : undefined

		/**
		 * Checks one solidus that does not open the text, its message and whether its fix would be given.
		 * @param check - The solidus and the index it is checked at.
		 * @returns The solidus, its span and whether the fix writes.
		 */
		function checked (check: { slash: SeparatorSlash, checkIndex: number }): { slash: SeparatorSlash, checkIndex: number, span: { start: number, end: number }, isWritten: boolean } {
			let { slash, checkIndex } = check
			let span = spanAt(runText, checkIndex, position, whitespace, writes)
			let message: string | undefined

			opts.locationChecker({
				source: runText,
				index: checkIndex,
				lineCheckStr,
				err: (m) => {
					message = m
				},
			})

			// Refused before the report, since a fixer cannot decline
			return { slash, checkIndex, span, isWritten: message !== undefined && writesTheSpan(syntax, reading, text, span, written, position, node) && fixApplies(node, textIndex + slash.index, result, opts.checkedRuleName) }
		}

		let others = checks.filter((check) => check !== head).map((check) => checked(check))
		// Only a solidus opening the text has its run in a raw, so the descriptor is built where the rule reads in front of a solidus at all; a rule reading behind one asks nothing of that run
		let wholeFix: EdgeFix | undefined = head ? { written: writes ? (whitespace === `newline` ? `newline` : `space`) : `none`, edits: others.filter(({ isWritten }) => isWritten).map(({ span }) => ({ start: span.start, end: span.end, text: written })) } : undefined
		// The run in front of the text is read as the live neighbors writing it leave it, over the whole fix
		let textBefore = textBeforeAsLeft(node, rawInFrontOfText(node), result, wholeFix)

		/**
		 * Checks the solidus opening the text, its message and whether the rule may write the run in front of it, over the whole fix.
		 * @param fix - The rule's whole fix.
		 * @param before - What the file holds in front of the text, as the neighbors leave it.
		 * @returns The problem at the solidus, and whether its fix writes.
		 */
		function problemAtTheHead (fix: EdgeFix | undefined, before: string): { message: string, index: number, isWritten: boolean } | undefined {
			if (!head) return undefined

			// Refused before the report, since a fixer cannot decline; emptied behind an at-rule's name, the run would join the name to the parameters, so a `never` leaves it
			let edgeWritten: EdgeWrite = writes ? (whitespace === `newline` ? `newline` : `space`) : `none`
			let isWritten = (writes || !isAtRule(node)) && !edgeRunOutOfReach(node, syntax, result, edgeWritten) && fix !== undefined && !edgeRunOwned(node, result, fix)
			let problem: { message: string, index: number, isWritten: boolean } | undefined

			opts.locationChecker({
				source: runText,
				index: head.checkIndex,
				lineCheckStr,
				textBefore: before,
				err: (message) => {
					problem = { message, index: textIndex + head.slash.index, isWritten }
				},
			})

			return problem
		}

		let headProblem = problemAtTheHead(wholeFix, textBefore)

		if (headProblem) {
			report({
				message: headProblem.message,
				node,
				index: headProblem.index,
				endIndex: headProblem.index,
				result,
				ruleName: opts.checkedRuleName,
				...(headProblem.isWritten && {
					fix: (): void => {
						edge.written = written
					},
				}),
			})
		}

		for (let { slash, checkIndex, span, isWritten } of others) {
			opts.locationChecker({
				source: runText,
				index: checkIndex,
				lineCheckStr,
				textBefore,
				err: (message) => {
					let index = textIndex + slash.index
					report({
						message,
						node,
						index,
						endIndex: index,
						result,
						ruleName: opts.checkedRuleName,
						...(isWritten && {
							fix: (): void => {
								edits.push({ start: span.start, end: span.end, text: written })
							},
						}),
					})
				},
			})
		}

		if (edits.length > 0) syntax.write(node, applyEditsFromEnd(text, edits))

		// A break is written in front of the spaces and tabs ending the run, which become the indentation of the solidus's line
		if (edge.written !== undefined) {
			let run = edge.written

			writeEdgeRun(node, (standing) => (whitespace === `newline` && run ? run + (standing.match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``) : run))
		}
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
 * Checks every `@media` query's separator solidi; a feature is a nameless parenthesized group, so the walk reads into every group, and an interpolation skips the parameters.
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
