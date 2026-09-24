import type { ChildNode, Container, Node, Root } from "postcss"
import type { PostcssResult, RuleMessage } from "stylelint"

import { EVERY_LINE_BREAK, LEADING_WHITESPACE_WITHOUT_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { carriesABlock } from "../carriesABlock/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { fixIndentation, lastLineIndentation, lastLineStart, lineStarts, replaceIndentation } from "../lineIndentation/index.ts"
import { opensALine } from "../opensALine/index.ts"
import { report } from "../report/index.ts"
import { runInFrontOf } from "../runInFrontOf/index.ts"
import { setBlockAfter } from "../setBlockAfter/index.ts"
import { statementString } from "../statementString/index.ts"
import { isAtRule, isDeclaration, isRoot, isRule } from "../typeGuards/index.ts"
import { readWhitespaceBeforeSemicolon, writeWhitespaceBeforeSemicolon } from "../whitespaceBeforeSemicolon/index.ts"

/**
 * Checks the line a statement's semicolon opens, for `indentation`.
 *
 * The run in front of the semicolon is read where `writeWhitespaceBeforeSemicolon` writes it. Nobody else reads its last line: `checkMultilineBit` passes over a line without content, and `checkAtRuleParams` trims the run off the params. The line closes the statement, so it is asked for the statement's own level, as a closing brace stands at its block's; `except` and `ignore` speak of the lines of a value or of params, and this line holds neither. A whitespace-only line in front of it is `no-eol-whitespace`'s, and the fix writes the last line alone, since `fixIndentation` takes a break's indentation only in front of content or the end. Behind a Less mixin call's `!important` the run is read from the flag's raw, where the `less` namespace hands it wherever it finds the flag in the file.
 * @param options - The node, the syntax, the result, the rule's name and message, the indentation asked for and how the message words it.
 * @param options.node - The node walked; only a declaration or a bodiless at-rule a semicolon closes has such a line.
 * @param options.syntax - The syntax that reads and writes the run.
 * @param options.result - The Stylelint result.
 * @param options.checkedRuleName - The configured name.
 * @param options.message - The rule's message, which takes the worded expectation.
 * @param options.expectedIndentation - The indentation of the statement's level.
 * @param options.expectation - That level, worded for the message.
 */
export function semicolonLineChecker ({ node, syntax, result, checkedRuleName, message, expectedIndentation, expectation }: {
	node: Node,
	syntax: Syntax,
	result: PostcssResult,
	checkedRuleName: string,
	message: RuleMessage,
	expectedIndentation: string,
	expectation: string,
}): void {
	if (!isDeclaration(node) && !isAtRule(node)) return
	if (hasBlock(node) || isLastNodeWithoutSemicolon(node)) return

	let run = readWhitespaceBeforeSemicolon(syntax, node, result)
	let lines = run.split(EVERY_LINE_BREAK)

	if (lines.length < 2 || lastLineIndentation(run) === expectedIndentation) return

	// The semicolon stands behind the statement's text as the file spells it
	let problemIndex = isDeclaration(node) ? declarationString(syntax, node).length : `@${node.name}${node.raws.afterName || ``}${syntax.read(node)}${node.raws.between || ``}${typeof node.raws.important === `string` ? node.raws.important : ``}`.length

	report({
		message,
		messageArgs: [expectation],
		node,
		index: problemIndex,
		endIndex: problemIndex,
		result,
		ruleName: checkedRuleName,
		fix () {
			writeWhitespaceBeforeSemicolon(syntax, node, result, fixIndentation(run, expectedIndentation))
		},
	})
}

/**
 * Checks the line of a node standing behind a free semicolon behind a rule's closing brace, for `indentation`.
 *
 * PostCSS files such a semicolon, with the break and the run in front of it, into the rule's `raws.ownSemicolon`, so the node's own raw holds no break and the node's check passed the line over. The line opens in that raw, and is read and written there as the node's check reads and writes `raws.before`, where the parser files the same semicolon behind a declaration or an at-rule's block: the run in front of the semicolon is asked for the node's level, and the warning stands on the node. A break inside a styled template's interpolation opens no line of the stylesheet.
 * @param options - The node, the syntax, the result, the rule's name and message, the indentation asked for and how the message words it.
 * @param options.node - The node walked.
 * @param options.syntax - The syntax that finds the host code in the raws.
 * @param options.result - The Stylelint result.
 * @param options.checkedRuleName - The configured name.
 * @param options.message - The rule's message, which takes the worded expectation.
 * @param options.expectedIndentation - The indentation of the node's level.
 * @param options.expectation - That level, worded for the message.
 */
export function ownSemicolonLineChecker ({ node, syntax, result, checkedRuleName, message, expectedIndentation, expectation }: {
	node: Node,
	syntax: Syntax,
	result: PostcssResult,
	checkedRuleName: string,
	message: RuleMessage,
	expectedIndentation: string,
	expectation: string,
}): void {
	let previous = node.prev()

	if (!node.source || !previous || !isRule(previous)) return

	let run = previous.raws.ownSemicolon

	if (typeof run !== `string`) return

	let before = runInFrontOf(node)
	let spans = syntax.hostCodeSpans(run, previous)

	if (lastLineStart(before, syntax.hostCodeSpans(before, node)) >= 0 || lastLineStart(run, spans) < 0 || lastLineIndentation(run, spans) === expectedIndentation) return

	report({
		message,
		messageArgs: [expectation],
		node,
		result,
		ruleName: checkedRuleName,
		fix () {
			previous.raws.ownSemicolon = fixIndentation(run, expectedIndentation, spans)
		},
	})
}

/** The indentation a statement with no block stands at in a container, and how the message words it; nothing where the container cannot tell. */
export type StatementExpectation = (container: Container) => { indentation: string, expectation: string } | undefined

/** A raw a line of a free semicolon stands in: read afresh, written back, the node whose host code it holds, the container the line is a statement of, whether its start opens a line, which of its lines to read, and the line a start stands on in the file. */
type FreeSemicolonRaw = {
	read: () => string,
	write: (text: string) => void,
	holder: Node,
	container: Container,
	head: boolean,
	pick: (lines: number[]) => number[],
	lineOf: (text: string, start: number) => number,
}

/**
 * Finds the raws of a node where a line of a free semicolon may stand, as {@link freeSemicolonLineChecker} reads them.
 * @param node - The node walked.
 * @param syntax - The syntax that reads the run in front of a brace.
 * @param result - The Stylelint result, for the statement's text.
 * @returns The raws.
 */
function freeSemicolonRaws (node: ChildNode, syntax: Syntax, result: PostcssResult): FreeSemicolonRaw[] {
	let { parent } = node
	let start = node.source?.start
	let raws: FreeSemicolonRaw[] = []

	if (!start || !parent) return raws

	let opensTheFile = isRoot(parent) && isTheFile(parent)
	let ownSemicolon = isRule(node) ? node.raws.ownSemicolon : undefined
	let end = parent.source?.end

	if (typeof node.raws.before === `string`) raws.push({ read: () => node.raws.before ?? ``, write: (text) => { node.raws.before = text }, holder: node, container: parent, head: isRoot(parent) && parent.first === node && opensALine(parent), pick: (lines) => lines.slice(0, -1), lineOf: (text, index) => start.line - lineBreaks(text.slice(index)) })

	if (carriesABlock(node)) {
		let brace = node.positionInside(statementString(node, result).length - 1)

		raws.push({ read: () => getBlockAfter(syntax, node) ?? ``, write: (text) => setBlockAfter(syntax, node, text), holder: node, container: node, head: false, pick: (lines) => lines.slice(0, -1), lineOf: (text, index) => brace.line - lineBreaks(text.slice(index)) })
	}

	if (isRule(node) && typeof ownSemicolon === `string` && closesALine(syntax, node, opensTheFile)) {
		let brace = node.positionInside(statementString(node, result).length - 1)

		raws.push({ read: () => node.raws.ownSemicolon ?? ``, write: (text) => { node.raws.ownSemicolon = text }, holder: node, container: parent, head: false, pick: (lines) => lines.slice(-1), lineOf: (text, index) => brace.line + lineBreaks(text.slice(0, index)) })
	}

	if (isRoot(parent) && parent.last === node && end) raws.push({ read: () => parent.raws.after ?? ``, write: (text) => { parent.raws.after = text }, holder: parent, container: parent, head: false, pick: (lines) => (opensTheFile ? lines : lines.slice(0, -1)), lineOf: (text, index) => end.line - lineBreaks(text.slice(index)) })

	return raws
}

/**
 * Finds where the lines of a raw open: behind every break outside host code, and at its start where it opens the file.
 * @param syntax - The syntax that finds the host code.
 * @param raw - The raw.
 * @returns The starts, in order.
 */
function semicolonLineStarts (syntax: Syntax, raw: FreeSemicolonRaw): number[] {
	let text = raw.read()
	let starts = lineStarts(text, syntax.hostCodeSpans(text, raw.holder))

	return raw.head ? [0, ...starts] : starts
}

/**
 * Finds where one line of a raw opens, counted as {@link semicolonLineStarts} counts them; no write of an indentation moves a break, so a line counted once stands there for good.
 * @param syntax - The syntax that finds the host code.
 * @param raw - The raw.
 * @param lineIndex - The line's place among the starts.
 * @returns The start.
 */
function lineStartAt (syntax: Syntax, raw: FreeSemicolonRaw, lineIndex: number): number {
	let start = semicolonLineStarts(syntax, raw)[lineIndex]

	if (start === undefined) throw new Error(`A line of a free semicolon must still stand in its raw`)

	return start
}

/**
 * Asks whether a break, or the end of the file, closes the line a rule's free semicolon stands on.
 * @param syntax - The syntax that finds the host code and reads the run in front of a brace.
 * @param rule - The rule whose `raws.ownSemicolon` holds the semicolon.
 * @param opensTheFile - Whether the rule's root is the file.
 * @returns True where it does.
 */
function closesALine (syntax: Syntax, rule: ChildNode, opensTheFile: boolean): boolean {
	let next = rule.next()
	let { parent } = rule

	if (!parent) return false

	let holder = next ?? parent
	let following = next ? runInFrontOf(next) : (isRoot(parent) ? parent.raws.after ?? `` : getBlockAfter(syntax, parent) ?? ``)

	return lineStarts(following, syntax.hostCodeSpans(following, holder)).length > 0 || (!next && opensTheFile)
}

/**
 * Asks whether a root is the file: neither embedded in a document nor nested in a template.
 * @param root - The root.
 * @returns True where it is.
 */
function isTheFile (root: Root): boolean {
	return !root.parent && root.raws.codeBefore === undefined && root.raws.codeAfter === undefined
}

/**
 * Counts the line feeds of a text, which is what a position in the file counts.
 * @param text - The text.
 * @returns The count.
 */
function lineBreaks (text: string): number {
	return text.match(EVERY_LINE_BREAK)?.length ?? 0
}

/**
 * Checks every line a free semicolon opens with neither a node nor a brace behind it on the line, for `indentation`.
 *
 * Such a line is an empty statement of its container, so it is asked for the level a statement with no block stands at there. Nobody else measures it: the node's check reads the last line of `raws.before`, the brace's the last line of the run in front of the brace, and the parser files the line in one of four raws: the middle lines of a node's `raws.before`, the middle lines of the run in front of a closing brace, the last line of a rule's `raws.ownSemicolon` where a break or the end of the file closes it, and the lines of a root's `raws.after`, its last one only where the root is the file. The line of a node or a brace behind the semicolon is theirs, and the first line of a raw opens behind the text in front of it, unless the raw opens the file or the host code in front of it ends in a break. The warning stands on the semicolon, counted from a point of the raw whose place in the file is known, and the fix writes that one line. The check runs behind the node's and the brace's own fixes, which write every line of their raw at their level.
 * @param options - The node, the syntax, the result, the rule's name and message, and the expectation in a container.
 * @param options.node - The node walked.
 * @param options.syntax - The syntax that finds the host code in the raws and reads the run in front of a brace.
 * @param options.result - The Stylelint result.
 * @param options.checkedRuleName - The configured name.
 * @param options.message - The rule's message, which takes the worded expectation.
 * @param options.statementIn - The expectation of a statement with no block in a container.
 */
export function freeSemicolonLineChecker ({ node, syntax, result, checkedRuleName, message, statementIn }: {
	node: ChildNode,
	syntax: Syntax,
	result: PostcssResult,
	checkedRuleName: string,
	message: RuleMessage,
	statementIn: StatementExpectation,
}): void {
	for (let raw of freeSemicolonRaws(node, syntax, result)) {
		let expected = statementIn(raw.container)

		if (!expected) continue

		// By index, since a fix of a line in front moves every start behind it
		for (let lineIndex of raw.pick(semicolonLineStarts(syntax, raw).map((_, index) => index))) {
			let text = raw.read()
			let lineStart = lineStartAt(syntax, raw, lineIndex)
			let indentation = text.slice(lineStart).match(LEADING_WHITESPACE_WITHOUT_BREAK)?.[0] ?? ``

			if (text[lineStart + indentation.length] !== `;` || indentation === expected.indentation) continue

			let position = { line: raw.lineOf(text, lineStart), column: indentation.length + 1 }

			report({
				message,
				messageArgs: [expected.expectation],
				node,
				start: position,
				end: position,
				result,
				ruleName: checkedRuleName,
				fix () {
					raw.write(replaceIndentation(text, indentation, expected.indentation, lineStart - 1))
				},
			})
		}
	}
}
