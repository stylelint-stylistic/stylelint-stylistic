import { type ChildNode, type Comment, type Container, type Document, type Root, stringify } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { CRLF, EVERY_LINE_BREAK, EVERY_RUN_OF_LINE_BREAKS, LEADING_LINE_BREAK_RUN, OPENS_WITH_LINE_BREAK, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { type CommentSpan, findStringSpans } from "../../utils/findCommentSpans/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { opensALine } from "../../utils/opensALine/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { takesTheOpeningLines } from "../../utils/takesTheOpeningLines/index.ts"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `max-empty-lines`

/** What the strings of a text are found by: the comments are blanked in front of the scan, so whichever reading a `//` gets changes nothing there. */
const STRING_READING = { spells: false, tokenizes: false, endsOnFormFeed: false }

const MESSAGES = defineMessages({
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? `line` : `lines`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The most empty lines allowed in a row. */
export type PrimaryOption = number

/** The secondary options. */
export type SecondaryOptions = {

	/** `comments` passes the empty lines inside comments over. */
	ignore?: `comments` | `comments`[],
}

/**
 * Limits the number of adjacent empty lines.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax, which says where a comment runs.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: isNumber,
			},
			{
				actual: secondaryOptions,
				possible: {
					ignore: [`comments`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let ignoreComments = optionsMatches(secondaryOptions, `ignore`, `comments`)
		let getChars = replaceEmptyLines.bind(null, primary)
		let openingLinesAreTaken = takesTheOpeningLines(root, result)
		let headOpensALine = opensALine(root)
		let writeHead = writeHeadRun.bind(null, getChars, headOpensALine)

		/** Collapses every run of empty lines to the maximum: `raws.before`, a comment's `left`, text and `right`, the raws between the parts of a statement and the node's own text, the run in front of a closing brace, the run in front of a free semicolon behind one, and the root's head and tail apart from the walk, where a run opening a line of the file counts an empty line more. */
		function fix (): void {
			let { first } = root

			root.walk((node) => {
				if (isComment(node) && !ignoreComments) writeComment(syntax, node, getChars)

				if (node.raws.before) node.raws.before = node === first ? pastTheOpeningLines(node.raws.before, openingLinesAreTaken, getChars) : getChars(node.raws.before)

				writeStatementText(syntax, node, result, ignoreComments, getChars)

				if (carriesABlock(node)) {
					let blockAfter = getBlockAfter(syntax, node)

					if (typeof blockAfter === `string`) setBlockAfter(syntax, node, getChars(blockAfter))
				}

				// The run in front of a free semicolon behind a closing brace stands in the rule's own raw, together with the semicolon, and reaches no other walk of the pass ([#584](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/584)). Written for a rule alone, since `freeSemicolon` hands the raw to a rule alone; elsewhere such a semicolon lands in the block's `raws.after` or in the next node's `raws.before`, both written already. Nothing but whitespace stands in front of the semicolon there, a comment in front of one being a node of its own, so the raw is written whole as any run is
				if (isRule(node) && node.raws.ownSemicolon) node.raws.ownSemicolon = getChars(node.raws.ownSemicolon)
			})

			let { document } = root as { document?: Document }
			let firstNodeRawsBefore = first && first.raws.before
			let rootRawsAfter = root.raws.after

			// The raw is written here rather than left to the walk, which reads every run as one standing inside a line; how many empty lines this one closes is the head's own question ([#585](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/585))
			if (first && firstNodeRawsBefore) first.raws.before = pastTheOpeningLines(firstNodeRawsBefore, openingLinesAreTaken, writeHead)

			if (rootRawsAfter) {
				// A root standing in an `html` document, whose tail is written as any run is, zero included, since the file's special case is its own; where such a root got no node this raw is the block entire, so the lines it opens with are the taker's here as they are in a file of its own (#682)
				if ((document && document.constructor.name) === `Document`) root.raws.after = first ? getChars(rootRawsAfter) : pastTheOpeningLines(rootRawsAfter, openingLinesAreTaken, (text) => getChars(writeHead(text)))
				// A root of its own, a file's or a styled template's, whose tail ends the text it stands in. Zero is read as one, a file ending on a break satisfying it. An empty root keeps the whole file here, and its leading run is written as such first, or a break survived every `--fix` (#404)
				else {
					root.raws.after = first
						? replaceEmptyLines(primary === 0 ? 1 : primary, rootRawsAfter, true)
						: pastTheOpeningLines(rootRawsAfter, openingLinesAreTaken, (text) => replaceEmptyLines(primary === 0 ? 1 : primary, writeHead(text), true))
				}
			}
		}

		let emptyLines = 0
		let lastIndex = -1
		let rootString = countedText(root, result)

		// A file ending on a break counts one empty line more, and spaces and tabs behind the last break are `no-eol-whitespace`'s line, so the end is measured in front of them
		let endOfFile = rootString.replace(TRAILING_SPACES_AND_TABS, ``).length
		let opensTheFile = false

		styleSearch(
			searchOptions(ignoreComments ? syntax.searchCopy(rootString, root, result).searchString : rootString, syntax.commentSpans(rootString, root, result)),
			(match) => {
				checkMatch(breakStart(rootString, match.startIndex), match.endIndex, root)
			},
		)

		/**
		 * Checks a match.
		 * @param matchStartIndex - The match's start.
		 * @param matchEndIndex - The match's end.
		 * @param node - The root.
		 */
		function checkMatch (matchStartIndex: number, matchEndIndex: number, node: Root): void {
			let eof = matchEndIndex >= endOfFile
			let problem = false

			// Additional check for beginning of file, where the text counted opens a line of it
			let opensTheText = !matchStartIndex && headOpensALine

			if (opensTheText || lastIndex === matchStartIndex) emptyLines += 1
			else emptyLines = 0

			opensTheFile = opensTheText || (opensTheFile && lastIndex === matchStartIndex)
			lastIndex = matchEndIndex

			if (emptyLines > primary) problem = true

			if (!eof && !problem) return

			if (problem) {
				report({
					message: messages.expected,
					messageArgs: [primary],
					node,
					index: matchStartIndex,
					endIndex: matchStartIndex,
					result,
					ruleName,
					fix,
				})
			}

			// Additional check for end of file, skipped where the file's last run is its first, counted already; such a run alone was counted at both ends (#404)
			if (eof && primary && !opensTheFile) {
				emptyLines += 1

				if (emptyLines > primary && isEofNode(result.root, node)) {
					report({
						message: messages.expected,
						messageArgs: [primary],
						node,
						index: matchEndIndex,
						endIndex: matchEndIndex,
						result,
						ruleName,
						fix,
					})
				}
			}
		}
	}
}

/**
 * Collapses every run of breaks a text holds outside the spans handed over, leaving the rest as the file spells them.
 * @param getChars - What the rule makes of a run it writes.
 * @param text - The text as the file spells it.
 * @param blanked - The copy of it the runs are read off, as long as the text.
 * @returns The text written.
 */
function writeRuns (getChars: (text: string) => string, text: string, blanked: string): string {
	let pieces = []
	let index = 0

	for (let run of blanked.matchAll(EVERY_RUN_OF_LINE_BREAKS)) {
		pieces.push(text.slice(index, run.index), getChars(run[0]))
		index = run.index + run[0].length
	}

	pieces.push(text.slice(index))

	return pieces.join(``)
}

/**
 * Blanks what a run written into would not be the stylesheet's: the host code of a styled template's interpolation, whose breaks end lines of the host file and none of the stylesheet, and every string, which a write would rewrite. A comment is blanked too where `ignore: comments` is set, the option's whole question; a quotation mark standing inside one opens no string, so the strings are read with every comment gone either way.
 * @param syntax - The syntax the rule is built over, which says where a comment and an interpolation run.
 * @param node - The node the text is from.
 * @param result - The Stylelint result, which names the syntax the file was parsed with.
 * @param ignoreComments - Whether the option passes the empty lines inside comments over.
 * @param text - The text as the file spells it.
 * @returns The copy, as long as the text.
 */
function countedCopy (syntax: Syntax, node: ChildNode, result: PostcssResult, ignoreComments: boolean, text: string): string {
	let outsideHostCode = blankComments(text, syntax.hostCodeSpans(text, node))
	let outsideComments = blankComments(outsideHostCode, syntax.commentSpans(outsideHostCode, node, result))

	return blankComments(ignoreComments ? outsideComments : outsideHostCode, findStringSpans(outsideComments, STRING_READING))
}

/**
 * Collapses the runs a comment holds: the two around its text, which are raws of the node, and the ones inside the text, which the check counts as it counts any run of the file. A quotation mark standing inside a comment opens no string, so none of the text is left alone but the host code of a styled interpolation ([#582](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/582)).
 * @param syntax - The syntax the rule is built over, which says where an interpolation runs.
 * @param comment - The comment node.
 * @param getChars - What the rule makes of a run it writes; a raw the parser left unfilled comes back empty, as it did before the text was written beside them.
 */
function writeComment (syntax: Syntax, comment: Comment, getChars: (text: string | undefined) => string): void {
	comment.raws.left = getChars(comment.raws.left)
	comment.text = writeRuns(getChars, comment.text, blankComments(comment.text, syntax.hostCodeSpans(comment.text, comment)))
	comment.raws.right = getChars(comment.raws.right)
}

/**
 * Collapses the runs a statement holds: the ones between its parts — an at-rule's `raws.afterName`, the `raws.between` of a rule, a declaration or an at-rule, and the raw a flag stands in ([#581](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/581)) — and the ones inside the node's own text, its selector, parameters or value ([#582](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/582)).
 * @param syntax - The syntax the rule is built over, which reads and writes a text.
 * @param node - The node of the walk.
 * @param result - The Stylelint result, which names the syntax the file was parsed with.
 * @param ignoreComments - Whether the option passes the empty lines inside comments over.
 * @param getChars - What the rule makes of a run it writes.
 */
function writeStatementText (syntax: Syntax, node: ChildNode, result: PostcssResult, ignoreComments: boolean, getChars: (text: string) => string): void {
	if (isComment(node)) return

	/**
	 * Writes one text or raw of this node.
	 * @param text - The text as the file spells it.
	 * @returns The text written.
	 */
	function write (text: string): string {
		return writeRuns(getChars, text, countedCopy(syntax, node, result, ignoreComments, text))
	}

	if (isAtRule(node) && node.raws.afterName) node.raws.afterName = write(node.raws.afterName)

	if (node.raws.between) node.raws.between = write(node.raws.between)

	let flag = isAtRule(node) || isDeclaration(node) ? node.raws.important : undefined

	// The raw a flag stands in runs from the end of the value through the flag, so the runs on both sides of it and the one inside `! important` are all in it; it is left undefined at the exact ` !important`, where none of them stands. A Less mixin call carries the same raw as a declaration does
	if (typeof flag === `string`) node.raws.important = write(flag)

	let text = syntax.read(node)
	let written = write(text)

	// Written through the syntax, so every copy it keeps of the text stays in step
	if (written !== text) syntax.write(node, written)
}

/**
 * Writes the run a raw opens with and nothing else, so the rest of it is the caller's: the raw of a first node was written by the walk, which reads a run as one standing inside a line, and the raw of a root with no node is written around this call. The narrowing is what keeps zero from taking a free semicolon standing in the raw with the breaks ([#598](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/598)), since `replaceEmptyLines` empties a whole text where it is left no break to keep.
 * @param getChars - What the rule makes of a run it writes.
 * @param headOpensALine - Whether the run stands at the start of a line, closing one empty line per break rather than one fewer.
 * @param text - The raw as it stands.
 * @returns The raw written.
 */
function writeHeadRun (getChars: (text: string, isSpecialCase?: boolean) => string, headOpensALine: boolean, text: string): string {
	return text.replace(LEADING_LINE_BREAK_RUN, (run) => getChars(run, headOpensALine))
}

/**
 * Writes a raw the file opens with, leaving the empty lines `no-empty-first-line` takes off where that rule is the one taking them ([#682](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/682)).
 * @param raw - The raw as it stands.
 * @param openingLinesAreTaken - Whether that rule takes the run off this file.
 * @param write - What this rule makes of the text it may write.
 * @returns The run left alone and the rest written.
 */
function pastTheOpeningLines (raw: string, openingLinesAreTaken: boolean, write: (text: string) => string): string {
	if (!openingLinesAreTaken) return write(raw)

	let opening = OPENS_WITH_LINE_BREAK.exec(raw)?.[0] ?? ``

	return opening + write(raw.slice(opening.length))
}

/**
 * Asks whether a node carries a block. Put to the node, not a list of types, so a Sass nested property's declaration is answered like a rule: a container however typed.
 * @param node - A node of the walk.
 * @returns True where it carries a block.
 */
function carriesABlock (node: ChildNode): node is ChildNode & Container {
	return hasBlock(node)
}

/**
 * Finds where the break of a line feed opens.
 * @param text - The text searched.
 * @param lineFeedIndex - The line feed's index.
 * @returns The index of the carriage return of a Windows pair, or the line feed's own.
 */
function breakStart (text: string, lineFeedIndex: number): number {
	return lineFeedIndex > 0 && CRLF.test(text.slice(lineFeedIndex - 1, lineFeedIndex + 1)) ? lineFeedIndex - 1 : lineFeedIndex
}

/**
 * Builds what `style-search` is handed. The search reads comments and strings by rules of its own, so it is told to read neither. A comment the option ignores is blanked with its breaks and every other `//` masked in the text handed in, since the search skipping comments of its own swallows the break behind an address's `//` (#725). A string is blanked, the breaks inside it included, since the search opens one at a quotation mark inside a bare address, closes none behind an escaped backslash, and opens none inside what it took for a comment.
 * @param text - The text the breaks are counted in, or its copy with the ignored comments blanked.
 * @param comments - The comment spans the syntax finds in the text.
 * @returns The search's options.
 */
function searchOptions (text: string, comments: CommentSpan[]): Parameters<typeof styleSearch>[0] {
	return {
		source: blankComments(text, findStringSpans(blankComments(text, comments), STRING_READING)),
		// A line feed is a break whatever stands in front of it, so a run spelling its breaks both ways is one run, as PostCSS counts it (#586)
		target: `\n`,
		comments: `check`,
		strings: `check`,
	}
}

/**
 * Prints the text the breaks are counted in, as the file the warnings are placed in holds it.
 * @param root - The root checked.
 * @param result - The Stylelint result, which holds the file's syntax and tells a standalone root from a block of a document.
 * @returns The root's text.
 */
function countedText (root: Root, result: PostcssResult): string {
	// A block embedded in a document is placed in the document's text, which keeps a byte-order mark; a styled template's root hangs in its document, whose stringifier prints the host code around it
	if (result.root !== root) return root.parent ? root.toString() : nodeString(root, result)

	let text = ``

	// Printed by the syntax, since PostCSS's stringifier drops a Sass nested property's block and a Less mixin call's `!important`, and widens a `//` comment (#583); without the root's opening piece, which is the byte-order mark PostCSS's stringifier prints and `input.css`, which the indices are resolved in, leaves out, while `sugarss` prints none (#601)
	;(nodeSyntax(root, result)?.stringify ?? stringify)(root, (piece, node, type) => {
		if (node !== root || type !== `start`) text += piece
	})

	return text
}

/**
 * Collapses runs of empty lines to the maximum, keeping the first breaks of a run as they are spelled.
 * @param maxLines - The maximum.
 * @param str - The string.
 * @param isSpecialCase - Whether at the end of file.
 * @returns The collapsed string.
 */
function replaceEmptyLines (maxLines: number, str: unknown, isSpecialCase: boolean = false): string {
	let repeatTimes = isSpecialCase ? maxLines : maxLines + 1

	if (repeatTimes === 0 || typeof str !== `string`) return ``

	return str.replaceAll(EVERY_RUN_OF_LINE_BREAKS, (run) => run.match(EVERY_LINE_BREAK)?.slice(0, repeatTimes).join(``) ?? run)
}

/**
 * Asks whether the root is the last node of the file.
 * @param document - The document under a host syntax.
 * @param root - The stylesheet parsed out of the document.
 * @returns True if only whitespace follows.
 */
function isEofNode (document: PostcssResult[`root`], root: Root): boolean {
	if (!document || document.constructor.name !== `Document` || !(`type` in document)) return true

	// The text behind the root
	let after

	if (root === document.last) after = document.raws && document.raws.codeAfter
	else {
		// @ts-expect-error -- TS2345: Argument of type 'Root' is not assignable to parameter of type 'number | ChildNode'.
		let rootIndex = document.index(root)

		let nextNode = document.nodes[rootIndex + 1]

		after = nextNode && nextNode.raws && nextNode.raws.codeBefore
	}

	return !String(after).trim()
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
