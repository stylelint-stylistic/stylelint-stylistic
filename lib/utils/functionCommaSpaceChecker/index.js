import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { endsWithInlineComment } from "../endsWithInlineComment/index.js"
import { findCommentSpans } from "../findCommentSpans/index.js"
import { getDeclarationValue } from "../getDeclarationValue/index.js"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.js"
import { isStandardSyntaxFunction } from "../isStandardSyntaxFunction/index.js"
import { optionsMatches } from "../optionsMatches/index.js"
import { readsInlineComments } from "../readsInlineComments/index.js"
import { setDeclarationValue } from "../setDeclarationValue/index.js"
import { commentsRemovedBefore, withoutComments } from "../withoutComments/index.js"

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
		// A double slash opens a comment that runs to the end of its line, and `postcss-value-parser` knows nothing of the kind: it reads the text of such a comment as code of the value, and every comma standing in that text as a comma of the value
		let endsOnFormFeed = endsInlineCommentOnFormFeed(decl)
		// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence everything standing behind it on the line
		let readsComments = readsInlineComments(decl, opts.result)
		let inlineComments = findCommentSpans(declValue, endsOnFormFeed, readsComments).filter(({ isInline }) => isInline)

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
			// The reading that takes the comments out of the arguments is the reading that placed the commas: one scan of the run, whose spans say where every comment stands and which double slash opens one. The false openings are spelled out of harm's way in the same copy, so that nothing downstream of it reads an address for a comment either.
			let commentSpans = findCommentSpans(argumentsRun, endsOnFormFeed, readsComments)
			let hiddenArguments = hideFalseInlineComments(argumentsRun, commentSpans)

			// The index each argument opens at inside that run, so that the text standing in front of a comma is taken by its length rather than joined together once per comma
			let argumentOffsets = []
			let argumentOffset = valueNode.before.length

			for (let argumentString of argumentStrings) {
				argumentOffsets.push(argumentOffset)
				argumentOffset += argumentString.length
			}

			// A comment standing behind code takes only itself out; one followed by nothing but whitespace takes the whitespace in front of it too
			let functionArguments = withoutComments(hiddenArguments, commentSpans)

			/**
			 * Gets the index of the comma for checking.
			 * @param {ValueParserDivNode} commaNode - The comma node.
			 * @param {number} nodeIndex - The index of the comma node.
			 * @returns {number} The index of the comma for checking.
			 */
			function getCommaCheckIndex (commaNode, nodeIndex) {
				let commaIndex = argumentOffsets[nodeIndex] + commaNode.before.length

				return commaIndex - commentsRemovedBefore(hiddenArguments, commaIndex, commentSpans)
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
				// A div node begins where its own leading whitespace does, and that whitespace is what closed the comment where one stands in front of the comma: the comma itself is what has to be placed, and it stands behind that whitespace.
				let commaIndex = commaNode.sourceIndex + commaNode.before.length

				return inlineComments.some(({ start, end }) => commaIndex >= start && commaIndex < end)
			}

			/**
			 * Asks whether the comma can be moved at all.
			 *
			 * The `before` rules write the whitespace standing in front of the comma, and where an inline comment ends that whitespace, the line break it holds is what closes the comment. Neither option can be satisfied without taking the comma, and everything the declaration has left, into the comment's text: leave the value alone and let the warning stand. The `after` rules write behind the comma, where no comment can be open, so they ask nothing.
			 * @param {ValueParserDivNode} commaNode - The comma being fixed.
			 * @returns {boolean} True if the fix can write without commenting the comma out.
			 */
			function isFixable (commaNode) {
				if (opts.fixPosition !== `before`) return true

				return !endsWithInlineComment(declValue.slice(0, commaNode.sourceIndex), readsComments)
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
