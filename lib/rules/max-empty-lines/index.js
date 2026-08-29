import styleSearch from "style-search"
import stylelint from "stylelint"

import { CRLF, CRLF_RUN, EVERY_CRLF_RUN, EVERY_LF_RUN, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `max-empty-lines`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? `line` : `lines`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Limits the number of adjacent empty lines.
 * @type {import('stylelint').RuleBase<number, { ignore?: 'comments' | 'comments'[] }>}
 */
function rule (primary, secondaryOptions) {
	let emptyLines = 0
	let lastIndex = -1

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

		/**
		 * Collapses every run of empty lines to the number the option allows.
		 *
		 * The walk reaches the whitespace each node keeps in front of itself, and the two runs a comment keeps around its text. The first node of the root and the text standing behind its last one are dealt with apart from the walk: neither is whitespace a node keeps, and the last of them counts an empty line one short, so a max of zero is read as one there.
		 */
		function fix () {
			root.walk((node) => {
				if (node.type === `comment` && !ignoreComments) {
					node.raws.left = getChars(node.raws.left)
					node.raws.right = getChars(node.raws.right)
				}

				if (node.raws.before) node.raws.before = getChars(node.raws.before)
			})

			let { first } = root
			let { document } = /** @type {{ document?: import('postcss').Document }} */ (root)
			let firstNodeRawsBefore = first && first.raws.before
			let rootRawsAfter = root.raws.after

			// Where the stylesheet is a block embedded in a page, the whitespace in front of its first node and the whitespace behind its last one belong to the page around it, and are left alone.
			if ((document && document.constructor.name) !== `Document`) {
				if (first && firstNodeRawsBefore) first.raws.before = getChars(firstNodeRawsBefore, true)

				if (rootRawsAfter) {
					// when max set 0, should be treated as 1 in this situation.
					root.raws.after = replaceEmptyLines(primary === 0 ? 1 : primary, rootRawsAfter, true)
				}
			}
			else if (rootRawsAfter) {
				// `css in js` or `html`
				root.raws.after = replaceEmptyLines(primary === 0 ? 1 : primary, rootRawsAfter)
			}
		}

		emptyLines = 0
		lastIndex = -1

		let rootString = root.toString()

		// A file that ends on a line break is counted one empty line more than the breaks inside it, so where the file ends decides that count — and it is not the last character of the text. A run of spaces and tabs written behind the file's last break is a line of its own, and emptying it is `no-eol-whitespace`'s work; read as the last character, the end of the file would stand behind that run and hide the break in front of it. So `a {}` and two line feeds was reported for the empty line it ends on and the same file with three spaces written behind them was not, and which of the two a neighbouring fixer had left standing decided the answer. It is measured once here rather than at every match, where each would cost a slice of the tail.
		let endOfFile = rootString.replace(TRAILING_SPACES_AND_TABS, ``).length

		styleSearch(
			{
				source: rootString,
				target: CRLF.test(rootString) ? `\r\n` : `\n`,
				comments: ignoreComments ? `skip` : `check`,
			},
			(match) => {
				checkMatch(match.startIndex, match.endIndex, root)
			},
		)

		/**
		 * Checks a match for empty line violations.
		 * @param {number} matchStartIndex - The start index of the match.
		 * @param {number} matchEndIndex - The end index of the match.
		 * @param {import('postcss').Root} node - The root node.
		 */
		function checkMatch (matchStartIndex, matchEndIndex, node) {
			let eof = matchEndIndex >= endOfFile
			let problem = false

			// Additional check for beginning of file
			if (!matchStartIndex || lastIndex === matchStartIndex) emptyLines += 1
			else emptyLines = 0

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

			// Additional check for end of file
			if (eof && primary) {
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
 * Replaces excessive empty lines in a string with the allowed maximum.
 * @param {number} maxLines - The maximum number of allowed adjacent empty lines.
 * @param {unknown} str - The string to process.
 * @param {boolean} [isSpecialCase] - Whether this is a special case (end of file).
 * @returns {string} The string with excessive empty lines replaced.
 */
function replaceEmptyLines (maxLines, str, isSpecialCase = false) {
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
 * Checks whether the given node is the last node of file.
 * @param {import('stylelint').PostcssResult['root']} document - The document node with `postcss-html` and `postcss-jsx`.
 * @param {import('postcss').Root} root - The root node of CSS.
 * @returns {boolean} True if the node is the last node of file, false otherwise.
 */
function isEofNode (document, root) {
	if (!document || document.constructor.name !== `Document` || !(`type` in document)) return true

	// In the `postcss-html` and `postcss-jsx` syntax, checks that there is text after the given node.
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

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
