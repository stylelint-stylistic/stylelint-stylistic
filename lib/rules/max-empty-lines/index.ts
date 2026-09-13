import { type ChildNode, type Container, type Document, type Root, stringify } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { CRLF, CRLF_RUN, EVERY_CRLF_RUN, EVERY_LF_RUN, LEADING_LINE_BREAK_RUN, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `max-empty-lines`

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
 * @param scope.syntax - The syntax, which says where a `//` comment runs.
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

		/** Collapses every run of empty lines to the maximum: `raws.before`, a comment's `left` and `right`, the run in front of a closing brace, and the root's first node and tail apart from the walk, where an empty line counts one short. */
		function fix (): void {
			root.walk((node) => {
				if (node.type === `comment` && !ignoreComments) {
					node.raws.left = getChars(node.raws.left)
					node.raws.right = getChars(node.raws.right)
				}

				if (node.raws.before) node.raws.before = getChars(node.raws.before)

				if (carriesABlock(node)) {
					let blockAfter = getBlockAfter(node)

					if (typeof blockAfter === `string`) setBlockAfter(node, getChars(blockAfter))
				}
			})

			let { first } = root
			let { document } = root as { document?: Document }
			let firstNodeRawsBefore = first && first.raws.before
			let rootRawsAfter = root.raws.after

			// In an embedded block, the whitespace around the first and last nodes is the page's
			if ((document && document.constructor.name) !== `Document`) {
				if (first && firstNodeRawsBefore) first.raws.before = getChars(firstNodeRawsBefore, true)

				if (rootRawsAfter) {
					// Zero is read as one, a file ending on a break satisfying it. An empty root keeps the whole file here, and its leading run is written as such first, or a break survived every `--fix` (#404)
					root.raws.after = replaceEmptyLines(primary === 0 ? 1 : primary, first ? rootRawsAfter : rootRawsAfter.replace(LEADING_LINE_BREAK_RUN, (run) => getChars(run, true)), true)
				}
			}
			else if (rootRawsAfter) {
				// `css in js` or `html`
				root.raws.after = replaceEmptyLines(primary === 0 ? 1 : primary, rootRawsAfter)
			}
		}

		let emptyLines = 0
		let lastIndex = -1
		let rootString = countedText(root, result)

		// A file ending on a break counts one empty line more, and spaces and tabs behind the last break are `no-eol-whitespace`'s line, so the end is measured in front of them
		let endOfFile = rootString.replace(TRAILING_SPACES_AND_TABS, ``).length
		let opensTheFile = false

		styleSearch(
			{
				// `style-search` skips the break closing a `//` comment, so the inline comment spans the syntax finds are blanked
				source: ignoreComments ? blankComments(rootString, syntax.commentSpans(rootString, root, result).filter(({ isInline }) => isInline)) : rootString,
				target: CRLF.test(rootString) ? `\r\n` : `\n`,
				comments: ignoreComments ? `skip` : `check`,
			},
			(match) => {
				checkMatch(match.startIndex, match.endIndex, root)
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

			// Additional check for beginning of file
			if (!matchStartIndex || lastIndex === matchStartIndex) emptyLines += 1
			else emptyLines = 0

			opensTheFile = !matchStartIndex || (opensTheFile && lastIndex === matchStartIndex)
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
 * Asks whether a node carries a block. Put to the node, not a list of types, so a Sass nested property's declaration is answered like a rule: a container however typed.
 * @param node - A node of the walk.
 * @returns True where it carries a block.
 */
function carriesABlock (node: ChildNode): node is ChildNode & Container {
	return hasBlock(node)
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
 * Collapses runs of empty lines to the maximum.
 * @param maxLines - The maximum.
 * @param str - The string.
 * @param isSpecialCase - Whether at the end of file.
 * @returns The collapsed string.
 */
function replaceEmptyLines (maxLines: number, str: unknown, isSpecialCase: boolean = false): string {
	let repeatTimes = isSpecialCase ? maxLines : maxLines + 1

	if (repeatTimes === 0 || typeof str !== `string`) return ``

	let emptyLFLines = `\n`.repeat(repeatTimes)
	let emptyCRLFLines = `\r\n`.repeat(repeatTimes)

	return CRLF_RUN.test(str)
		? str.replaceAll(EVERY_CRLF_RUN, ($1) => {
			if ($1.length / 2 > repeatTimes) return emptyCRLFLines

			return $1
		})
		: str.replaceAll(EVERY_LF_RUN, ($1) => {
			if ($1.length > repeatTimes) return emptyLFLines

			return $1
		})
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
