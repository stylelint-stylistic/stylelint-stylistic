import { type ChildNode, type Comment, type Container, type Document, type Root, stringify } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { CRLF, EVERY_LINE_BREAK, EVERY_RUN_OF_LINE_BREAKS, EVERY_SEMICOLON, LEADING_LINE_BREAK_RUN, OPENS_WITH_LINE_BREAK, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { blockTailTaken, getBlockTail, setBlockTail } from "../../utils/blockTail/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { type CommentSpan, findStringSpans } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { opensALine } from "../../utils/opensALine/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { straySemicolonOffsetsTaken, straySemicolonsTaken, straySemicolonsTakenBefore, straySemicolonsTakenOwn, writtenAsLeft } from "../../utils/straySemicolonsTaken/index.ts"
import { takesTheOpeningLines } from "../../utils/takesTheOpeningLines/index.ts"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"

import { printEscapes, takenInPrint, textIndex } from "./printEscapes.ts"

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
		let isFixed = false

		/** Collapses every run of empty lines to the maximum: `raws.before`, a comment's `left`, text and `right`, the raws between the parts of a statement and the node's own text, the run in front of a closing brace, the run in front of a free semicolon behind one, and the root's head and tail apart from the walk, where a run opening a line of the file counts an empty line more. */
		function fix (): void {
			// Every warning hands this fix over, and it collapses every run at once; a second pass would read the semicolons the neighbors take against the lines of a raw it had shortened already
			if (isFixed) return

			isFixed = true

			let { first } = root

			root.walk((node) => {
				if (isComment(node) && !ignoreComments) writeComment(syntax, node, getChars)

				if (!writeAcrossTheFreeSemicolon(node, result, getChars) && node.raws.before) node.raws.before = node === first ? pastTheOpeningLines(node.raws.before, openingLinesAreTaken, getChars) : writtenAsLeft(getChars, node.raws.before, straySemicolonsTakenBefore(node, result))

				writeStatementText(syntax, node, result, ignoreComments, getChars)

				// The run in front of the closing brace, behind a free semicolon behind the last rule's brace too, as the neighbors taking semicolons leave it
				if (carriesABlock(node)) {
					let tail = getBlockTail(syntax, node)

					if (typeof tail === `string`) setBlockTail(syntax, node, writtenAsLeft(getChars, tail, blockTailTaken(node, result)))
				}

				// The run in front of a free semicolon behind a closing brace stands in the rule's own raw, together with the semicolon; behind a node it runs on into that node's raw, and behind the last node of a block into the block's tail, both written with it above. Behind the root's last node it runs on into the root's tail, written with it apart below where the neighbors take the semicolon
			})

			writeTheRootsEnds(root, result, primary, openingLinesAreTaken, getChars, writeHead)
		}

		let emptyLines = 0
		let lastIndex = -1
		// A line holding nothing but stray semicolons a neighbor takes out in the same run is read as it will stand, empty, whichever side of the neighbor this rule is listed
		let rootString = countedText(root, result)
		// The print parts from the file where PostCSS escapes a `<`, and the neighbors' semicolons and the warnings are carried across
		let escapes = rootString === (root.source?.input.css ?? rootString) ? [] : printEscapes(root.source?.input.css ?? ``, rootString)
		let taken = takenInPrint(straySemicolonOffsetsTaken(root, result), escapes)

		// A file ending on a break counts one empty line more, and spaces and tabs behind the last break are `no-eol-whitespace`'s line, so the end is measured in front of them, and in front of the semicolons the neighbors take there
		let endOfFile = [...rootString].map((character, index) => (taken.has(index) ? ` ` : character)).join(``).replace(TRAILING_SPACES_AND_TABS, ``).length
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
			let opensTheText = (!matchStartIndex || onlyTakenBetween(taken, 0, matchStartIndex)) && headOpensALine

			if (opensTheText || lastIndex === matchStartIndex || onlyTakenBetween(taken, lastIndex, matchStartIndex)) emptyLines += 1
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
					index: textIndex(matchStartIndex, escapes),
					endIndex: textIndex(matchStartIndex, escapes),
					result,
					ruleName,
					fix,
				})
			}

			// Additional check for end of file, skipped where the file's last run is its first, counted already; such a run alone was counted at both ends
			if (eof && primary && !opensTheFile) {
				emptyLines += 1

				if (emptyLines > primary && isEofNode(result.root, node)) {
					report({
						message: messages.expected,
						messageArgs: [primary],
						node,
						index: textIndex(matchEndIndex, escapes),
						endIndex: textIndex(matchEndIndex, escapes),
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
 * Writes the root's head and tail apart from the walk, which reads every run as one standing inside a line.
 * @param root - The root.
 * @param result - The Stylelint result, which holds the configuration.
 * @param primary - The most empty lines allowed.
 * @param openingLinesAreTaken - Whether `no-empty-first-line` takes the lines the file opens with.
 * @param getChars - What the rule makes of a run it writes.
 * @param writeHead - What it makes of the run the text opens with.
 */
function writeTheRootsEnds (root: Root, result: PostcssResult, primary: number, openingLinesAreTaken: boolean, getChars: (text: string, isSpecialCase?: boolean) => string, writeHead: (text: string) => string): void {
	let { first, last } = root
	let { document } = root as { document?: Document }
	let firstNodeRawsBefore = first && first.raws.before
	let rootRawsAfter = root.raws.after ?? ``
	let isDocumentBlock = (document && document.constructor.name) === `Document`

	// The raw is written here rather than left to the walk, which reads every run as one standing inside a line; how many empty lines this one closes is the head's own question. A stray semicolon the neighbors take stays for them, the run written as they leave it
	if (first && firstNodeRawsBefore) {
		let taken = straySemicolonsTakenBefore(first, result)

		first.raws.before = pastTheOpeningLines(firstNodeRawsBefore, openingLinesAreTaken, (text) => writtenAsLeft(writeHead, text, new Set([...taken].map((index) => index - (firstNodeRawsBefore.length - text.length)).filter((index) => index >= 0))))
	}

	// A root standing in an `html` document, or a styled template host code follows, whose tail is written as any run is, zero included, since the file's special case is the check's only where the root ends the file; a root ending the file, where zero is read as one, a file ending on a break satisfying it
	/**
	 * Writes the root's tail.
	 * @param text - The tail.
	 * @returns It written.
	 */
	function writeTail (text: string): string {
		return isDocumentBlock || !isEofNode(result.root, root) ? getChars(text) : replaceEmptyLines(primary === 0 ? 1 : primary, text, true)
	}

	// Behind a free semicolon behind the last rule's brace the tail opens in that rule's own raw, and the two are written as one run, the semicolons the neighbors take kept for them
	if (first && last && isRule(last) && typeof last.raws.ownSemicolon === `string`) {
		let own = last.raws.ownSemicolon
		let ownTaken = straySemicolonsTakenOwn(last, result)
		let taken = new Set([...ownTaken, ...[...straySemicolonsTaken(root, result)].map((index) => index + own.length)])

		// Where the neighbors keep the semicolon, the run in front of it is a run of its own, not the file's end
		if ((own.match(EVERY_SEMICOLON) ?? []).length > ownTaken.size) last.raws.ownSemicolon = getChars(own)
		else {
			let [ownWritten, tailWritten] = partedAtTheHeld(writtenAsLeft(writeTail, own + rootRawsAfter, taken), own)

			last.raws.ownSemicolon = ownWritten
			root.raws.after = tailWritten

			return
		}
	}

	if (!rootRawsAfter) return

	if (first) root.raws.after = writtenAsLeft(writeTail, rootRawsAfter, straySemicolonsTaken(root, result))
	// An empty root keeps the whole file here, and its leading run is written as such first, or a break survived every `--fix`; where an `html` block got no node this raw is the block entire, so the lines it opens with are the taker's here as they are in a file of its own
	else {
		let taken = straySemicolonsTaken(root, result)

		root.raws.after = pastTheOpeningLines(rootRawsAfter, openingLinesAreTaken, (text) => writtenAsLeft((run) => writeTail(writeHead(run)), text, new Set([...taken].map((index) => index - (rootRawsAfter.length - text.length)).filter((index) => index >= 0))))
	}
}

/**
 * Asks whether nothing but semicolons the neighbors take stands between two points of the text.
 * @param taken - The offsets of those semicolons.
 * @param from - The first point.
 * @param to - The second point.
 * @returns True where nothing else does.
 */
function onlyTakenBetween (taken: Set<number>, from: number, to: number): boolean {
	if (from < 0 || to <= from) return false

	for (let index = from; index < to; index += 1) if (!taken.has(index)) return false

	return true
}

/**
 * Writes the run in front of a node standing behind a free semicolon behind a rule's closing brace, where a line opens in the rule's own raw and runs on into the node's: the two are written as one run, the semicolons the neighbors take kept for them.
 * @param node - The node.
 * @param result - The Stylelint result, which holds the configuration.
 * @param getChars - What the rule makes of a run it writes.
 * @returns True where the node stands there and its run is written.
 */
function writeAcrossTheFreeSemicolon (node: ChildNode, result: PostcssResult, getChars: (text: string) => string): boolean {
	let previous = node.prev()

	if (!previous || !isRule(previous) || typeof previous.raws.ownSemicolon !== `string` || typeof node.raws.before !== `string`) return false

	let own = previous.raws.ownSemicolon
	let taken = new Set([...straySemicolonsTakenOwn(previous, result), ...[...straySemicolonsTakenBefore(node, result)].map((index) => index + own.length)])
	let [ownWritten, beforeWritten] = partedAtTheHeld(writtenAsLeft(getChars, own + node.raws.before, taken), own)

	previous.raws.ownSemicolon = ownWritten
	node.raws.before = beforeWritten

	return true
}

/**
 * Parts a run written across a rule's `raws.ownSemicolon` and the raw behind it: the first as many semicolons as the rule's raw held, with what stands in front of them, go back into it, the rest into the other. A write keeps the semicolons in their order.
 * @param written - The run written.
 * @param own - The rule's raw as it stood.
 * @returns The two raws.
 */
function partedAtTheHeld (written: string, own: string): [string, string] {
	let held = (own.match(EVERY_SEMICOLON) ?? []).length
	let end = held === 0 ? undefined : [...written.matchAll(EVERY_SEMICOLON)][held - 1]
	let cut = end ? end.index + 1 : 0

	return [written.slice(0, cut), written.slice(cut)]
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
 * Collapses the runs a comment holds: the two around its text, which are raws of the node, and the ones inside the text, which the check counts as it counts any run of the file. A quotation mark standing inside a comment opens no string, so none of the text is left alone but the host code of a styled interpolation.
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
 * Collapses the runs a statement holds: the ones between its parts — an at-rule's `raws.afterName`, the `raws.between` of a rule, a declaration or an at-rule, and the raw a flag stands in — and the ones inside the node's own text, its selector, parameters or value.
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
 * Writes the run a raw opens with and nothing else, so the rest of it is the caller's: the raw of a first node was written by the walk, which reads a run as one standing inside a line, and the raw of a root with no node is written around this call. The narrowing is what keeps zero from taking a free semicolon standing in the raw with the breaks, since `replaceEmptyLines` empties a whole text where it is left no break to keep.
 * @param getChars - What the rule makes of a run it writes.
 * @param headOpensALine - Whether the run stands at the start of a line, closing one empty line per break rather than one fewer.
 * @param text - The raw as it stands.
 * @returns The raw written.
 */
function writeHeadRun (getChars: (text: string, isSpecialCase?: boolean) => string, headOpensALine: boolean, text: string): string {
	return text.replace(LEADING_LINE_BREAK_RUN, (run) => getChars(run, headOpensALine))
}

/**
 * Writes a raw the file opens with, leaving the empty lines `no-empty-first-line` takes off where that rule is the one taking them.
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
 * Builds what `style-search` is handed. The search reads comments and strings by rules of its own, so it is told to read neither. A comment the option ignores is blanked with its breaks and every other `//` masked in the text handed in, since the search skipping comments of its own swallows the break behind an address's `//`. A string is blanked, the breaks inside it included, since the search opens one at a quotation mark inside a bare address, closes none behind an escaped backslash, and opens none inside what it took for a comment.
 * @param text - The text the breaks are counted in, or its copy with the ignored comments blanked.
 * @param comments - The comment spans the syntax finds in the text.
 * @returns The search's options.
 */
function searchOptions (text: string, comments: CommentSpan[]): Parameters<typeof styleSearch>[0] {
	return {
		source: blankComments(text, findStringSpans(blankComments(text, comments), STRING_READING)),
		// A line feed is a break whatever stands in front of it, so a run spelling its breaks both ways is one run, as PostCSS counts it
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

	// Printed by the syntax, since PostCSS's stringifier drops a Sass nested property's block and a Less mixin call's `!important`, and widens a `//` comment; without the root's opening piece, which is the byte-order mark PostCSS's stringifier prints and `input.css`, which the indices are resolved in, leaves out, while `sugarss` prints none
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
