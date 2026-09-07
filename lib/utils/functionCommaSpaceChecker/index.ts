import type { Root } from "postcss"
import valueParser, { type DivNode as ValueParserDivNode, type FunctionNode as ValueParserFunctionNode } from "postcss-value-parser"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { findCommentSpans } from "../findCommentSpans/index.ts"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.ts"
import { hideQuotesInComments } from "../hideQuotesInComments/index.ts"
import { opensAnAddress } from "../opensAnAddress/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { isValueFunction } from "../typeGuards/index.ts"
import { commentsRemovedBefore, withoutComments } from "../withoutComments/index.ts"

let { utils: { report } } = stylelint

/** Checks the whitespace at one index of a source. */
export type LocationChecker = (args: {
	source: string,
	index: number,
	err: (message: string) => void,
}) => void

/**
 * Checks whitespace around the commas of function arguments.
 * @param opts - The options.
 */
export function functionCommaSpaceChecker (opts: {
	root: Root,
	locationChecker: LocationChecker,
	fix?: ((node: ValueParserDivNode, index: number, functionNode: ValueParserFunctionNode) => Edit[]),
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,
	fixPosition?: `before` | `after`,
	ignoreFunctions?: string | RegExp | Array<string | RegExp> | undefined,
}): void {
	let { fix } = opts

	opts.root.walkDecls((decl) => {
		let declValue = opts.syntax.read(decl)
		// The value parser reads commas inside a `//` comment; whether `//` opens one the syntax says (in plain CSS `myurl(//a)` is code)
		let reading = opts.syntax.inlineComments(decl, opts.result)
		// Block comments too: the value parser closes `/*/` on its own star and returns the rest as nodes, commas among them (#275)
		let valueCommentSpans = findCommentSpans(declValue, reading.spells)

		// Edited by position rather than printed from the tree, which gives `/*/` back as `/**/`
		let edits: Edit[] = []
		// Masked so the parser pairs quotation marks as the file does (#508)
		let parsedValue = valueParser(hideQuotesInComments(declValue, valueCommentSpans))

		parsedValue.walk((valueNode, at, siblings) => {
			if (!isValueFunction(valueNode)) return

			// The narrowing does not reach into the functions below
			let functionNode = valueNode

			if (!opts.syntax.isStandardFunction(valueNode)) return

			// A comma in an address separates no arguments; the name is read, not matched, so `u\rl(` and `URL(` are `url(` here as to the comment scan
			if (opensAnAddress(valueNode, at, siblings)) return

			// `ignoreFunctions` covers everything nested inside too
			if (optionsMatches(opts, `ignoreFunctions`, valueNode.value)) return false

			let argumentStrings = valueNode.nodes.map((node) => valueParser.stringify(node))

			// Remove function name and parens
			let argumentsRun = valueNode.before + argumentStrings.join(``) + valueNode.after
			// False `//` openings are masked in the same copy so nothing downstream reads an address as a comment
			let commentSpans = findCommentSpans(argumentsRun, reading.spells)
			let hiddenArguments = hideFalseInlineComments(argumentsRun, commentSpans)

			// Where each argument opens, so the text in front of a comma is found by offset
			let argumentOffsets: number[] = []
			let argumentOffset = valueNode.before.length

			for (let argumentString of argumentStrings) {
				argumentOffsets.push(argumentOffset)
				argumentOffset += argumentString.length
			}

			// A comment followed by whitespace alone takes the whitespace in front of it out too
			let functionArguments = withoutComments(hiddenArguments, commentSpans)

			/**
			 * Places a comma in the arguments with the comments taken out.
			 * @param commaNode - The div node holding the comma.
			 * @param nodeIndex - Where the comma stands among the function's nodes.
			 * @returns The index there.
			 */
			function getCommaCheckIndex (commaNode: ValueParserDivNode, nodeIndex: number): number {
				let openingOffset = argumentOffsets[nodeIndex]

				if (openingOffset === undefined) throw new Error(`The comma stands in no argument of the function`)

				let commaIndex = openingOffset + commaNode.before.length

				return commaIndex - commentsRemovedBefore(hiddenArguments, commaIndex, commentSpans)
			}

			let commaDataList: {
				commaNode: ValueParserDivNode,
				checkIndex: number,
				nodeIndex: number,
			}[] = []

			for (let [nodeIndex, node] of valueNode.nodes.entries()) {
				if (node.type !== `div` || node.value !== `,`) continue

				// A comma in a comment's text is not the value's
				if (isCommentedOut(node)) continue

				let checkIndex = getCommaCheckIndex(node, nodeIndex)

				commaDataList.push({
					commaNode: node,
					checkIndex,
					nodeIndex,
				})
			}

			/**
			 * Asks whether a comma stands in a comment's text.
			 * @param commaNode - The div node holding the comma.
			 * @returns True inside a comment.
			 */
			function isCommentedOut (commaNode: ValueParserDivNode): boolean {
				// A div node starts at its whitespace; the comma is placed behind it, which differs only where an inline comment's closing break is that whitespace
				let commaIndex = commaNode.sourceIndex + commaNode.before.length

				return valueCommentSpans.some(({ start, end }) => commaIndex >= start && commaIndex < end)
			}

			/**
			 * Asks whether a fix can write at the comma. A `before` rule writes over the whitespace in front of it, and where that is an inline comment's closing break either option would take the comma into the comment; an `after` rule writes behind the comma, where no comment is open.
			 * @param commaNode - The div node holding the comma.
			 * @returns True where the fix writes into no comment.
			 */
			function isFixable (commaNode: ValueParserDivNode): boolean {
				if (opts.fixPosition !== `before`) return true

				return !opts.syntax.endsWithInlineComment(declValue.slice(0, commaNode.sourceIndex), reading)
			}

			/**
			 * Builds the callback reporting a problem at one comma.
			 * @param commaNode - The div node holding the comma.
			 * @param nodeIndex - Its index among the arguments.
			 * @returns The callback, which reports the message at the comma.
			 */
			function createErrHandler (commaNode: ValueParserDivNode, nodeIndex: number): (message: string) => void {
				return (message) => {
					let index = declarationValueIndex(decl) + commaNode.sourceIndex + commaNode.before.length

					report({
						index,
						endIndex: index,
						message,
						node: decl,
						result: opts.result,
						ruleName: opts.checkedRuleName,
						...(fix && isFixable(commaNode) && {
							fix: (): void => {
								edits.push(...fix(commaNode, nodeIndex, functionNode))
							},
						}),
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

		if (edits.length > 0) opts.syntax.write(decl, applyEditsFromEnd(declValue, edits))
	})
}
