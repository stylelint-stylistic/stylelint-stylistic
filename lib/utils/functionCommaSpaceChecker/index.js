import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { endsWithInlineComment } from "../endsWithInlineComment/index.js"
import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { getDeclarationValue } from "../getDeclarationValue/index.js"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.js"
import { isStandardSyntaxFunction } from "../isStandardSyntaxFunction/index.js"
import { optionsMatches } from "../optionsMatches/index.js"
import { setDeclarationValue } from "../setDeclarationValue/index.js"

const COMMENT_PATTERN = / *\/(?:\*.*?\*\/(?!\S)|\/.*)/u

let { utils: { report } } = stylelint

/** @typedef {import('postcss-value-parser').Node} ValueParserNode */
/** @typedef {import('postcss-value-parser').DivNode} ValueParserDivNode */
/**
 * A function that checks whitespace at a specific location.
 * @typedef {(args: { source: string, index: number, err: (message: string) => void }) => void} LocationChecker
 */

/**
 * Checks whitespace around commas in function arguments.
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: LocationChecker,
 *   fix: ((node: ValueParserDivNode, index: number, nodes: ValueParserNode[]) => boolean),
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 *   fixPosition?: 'before' | 'after',
 *   ignoreFunctions?: string | RegExp | Array<string | RegExp>,
 * }} opts - The options object
 */
export function functionCommaSpaceChecker (opts) {
	opts.root.walkDecls((decl) => {
		let declValue = getDeclarationValue(decl)
		// A double slash opens a comment that runs to the end of its line, and `postcss-value-parser`
		// knows nothing of the kind: it reads the text of such a comment as code of the value, and
		// every comma standing in that text as a comma of the value
		let endsOnFormFeed = endsInlineCommentOnFormFeed(decl)
		let inlineComments = findInlineCommentSpans(declValue, endsOnFormFeed)

		let hasFixed
		let parsedValue = valueParser(declValue)

		parsedValue.walk((valueNode) => {
			if (valueNode.type !== `function`) return

			if (!isStandardSyntaxFunction(valueNode)) return

			// Ignore `url()` arguments, which may contain data URIs or other funky stuff
			if (valueNode.value.toLowerCase() === `url`) return

			// Ignore functions listed in the `ignoreFunctions` option, including everything nested inside them
			if (optionsMatches(opts, `ignoreFunctions`, valueNode.value)) return false

			let argumentStrings = valueNode.nodes.map((node) => valueParser.stringify(node))

			// Remove function name and parens
			let argumentsRun = valueNode.before + argumentStrings.join(``) + valueNode.after
			// `COMMENT_PATTERN` knows a double slash and nothing else, and would take the address of
			// `url(//cdn/a.png)` for a comment reaching the end of the line, the comma behind it with it,
			// leaving the index of that comma pointing past the end of what it measures. The arguments
			// are spelled out of harm's way once and every comma is then measured in a prefix of that one
			// copy: a prefix spelled on its own would be scanned again once per comma, and a scan opened
			// on a prefix can be cut through the middle of an address and read it differently.
			let hiddenArguments = hideFalseInlineComments(argumentsRun, findInlineCommentSpans(argumentsRun, endsOnFormFeed))

			// The index each argument opens at inside that run, so that the text standing in front of a
			// comma is taken by its length rather than joined together once per comma
			let argumentOffsets = []
			let argumentOffset = valueNode.before.length

			for (let argumentString of argumentStrings) {
				argumentOffsets.push(argumentOffset)
				argumentOffset += argumentString.length
			}

			// 1. Remove comments including preceding whitespace (when only succeeded by whitespace)
			// 2. Remove all other comments, but leave adjacent whitespace intact
			let functionArguments = hiddenArguments.replace(COMMENT_PATTERN, ``)

			/**
			 * Gets the index of the comma for checking.
			 * @param {ValueParserDivNode} commaNode The comma node.
			 * @param {number} nodeIndex The index of the comma node.
			 * @returns {number} The index of the comma for checking.
			 */
			function getCommaCheckIndex (commaNode, nodeIndex) {
				let commaBefore = hiddenArguments.slice(0, argumentOffsets[nodeIndex] + commaNode.before.length)

				// 1. Remove comments including preceding whitespace (when only succeeded by whitespace)
				// 2. Remove all other comments, but leave adjacent whitespace intact
				commaBefore = commaBefore.replace(COMMENT_PATTERN, ``)

				return commaBefore.length
			}

			/** @type {{ commaNode: ValueParserDivNode, checkIndex: number, nodeIndex: number }[]} */
			let commaDataList = []

			for (let [nodeIndex, node] of valueNode.nodes.entries()) {
				if (node.type !== `div` || node.value !== `,`) continue

				// A comma inside the text of an inline comment is a comma of that text and of nothing else
				if (isCommentedOut(node)) continue

				let checkIndex = getCommaCheckIndex(node, nodeIndex)

				commaDataList.push({
					commaNode: node,
					checkIndex,
					nodeIndex,
				})
			}

			/**
			 * Asks whether a comma stands in the text of an inline comment rather than in the value.
			 * @param {ValueParserDivNode} commaNode - The comma to place.
			 * @returns {boolean} True if the comma is inside a comment.
			 */
			function isCommentedOut (commaNode) {
				// A div node begins where its own leading whitespace does, and that whitespace is what
				// closed the comment where one stands in front of the comma: the comma itself is what
				// has to be placed, and it stands behind that whitespace.
				let commaIndex = commaNode.sourceIndex + commaNode.before.length

				return inlineComments.some(({ start, end }) => commaIndex >= start && commaIndex < end)
			}

			/**
			 * Asks whether the comma can be moved at all.
			 *
			 * The `before` rules write the whitespace standing in front of the comma, and where an inline
			 * comment ends that whitespace, the line break it holds is what closes the comment. Neither
			 * option can be satisfied without taking the comma, and everything the declaration has left,
			 * into the comment's text: leave the value alone and let the warning stand. The `after` rules
			 * write behind the comma, where no comment can be open, so they ask nothing.
			 * @param {ValueParserDivNode} commaNode - The comma being fixed.
			 * @returns {boolean} True if the fix can write without commenting the comma out.
			 */
			function isFixable (commaNode) {
				if (opts.fixPosition !== `before`) return true

				return !endsWithInlineComment(declValue.slice(0, commaNode.sourceIndex))
			}

			function createErrHandler (commaNode, nodeIndex) {
				return (message) => {
					let index = declarationValueIndex(decl) + commaNode.sourceIndex + commaNode.before.length

					report({
						index,
						endIndex: index,
						message,
						node: decl,
						result: opts.result,
						ruleName: opts.checkedRuleName,
						fix: opts.fix && isFixable(commaNode)
							? () => {
								hasFixed = true

								return opts.fix(commaNode, nodeIndex, valueNode.nodes)
							}
							: undefined,
					})
				}
			}

			for (let { commaNode, checkIndex, nodeIndex } of commaDataList) {
				opts.locationChecker({
					source: functionArguments,
					index: checkIndex,
					err: createErrHandler(commaNode, nodeIndex),
				})
			}
		})

		if (hasFixed) setDeclarationValue(decl, parsedValue.toString())
	})
}
