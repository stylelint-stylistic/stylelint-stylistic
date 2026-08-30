import type { Root } from "postcss"
import valueParser, { type DivNode as ValueParserDivNode, type FunctionNode as ValueParserFunctionNode } from "postcss-value-parser"
import stylelint, { type PostcssResult } from "stylelint"

import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { endsWithInlineComment } from "../endsWithInlineComment/index.ts"
import { findCommentSpans } from "../findCommentSpans/index.ts"
import { getDeclarationValue } from "../getDeclarationValue/index.ts"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.ts"
import { isStandardSyntaxFunction } from "../isStandardSyntaxFunction/index.ts"
import { opensAnAddress } from "../opensAnAddress/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { inlineCommentReading } from "../readsInlineComments/index.ts"
import { setDeclarationValue } from "../setDeclarationValue/index.ts"
import { isValueFunction } from "../typeGuards/index.ts"
import { commentsRemovedBefore, withoutComments } from "../withoutComments/index.ts"

let { utils: { report } } = stylelint

/** A function that checks whitespace at a specific location. */
export type LocationChecker = (args: {
	source: string,
	index: number,
	err: (message: string) => void,
}) => void

/**
 * Checks whitespace around commas in function arguments.
 * @param opts - The options object.
 */
export function functionCommaSpaceChecker (opts: {
	root: Root,
	locationChecker: LocationChecker,
	fix?: ((node: ValueParserDivNode, index: number, functionNode: ValueParserFunctionNode) => Edit[]),
	result: PostcssResult,
	checkedRuleName: string,
	fixPosition?: `before` | `after`,
	ignoreFunctions?: string | RegExp | Array<string | RegExp> | undefined,
}): void {
	let { fix } = opts

	opts.root.walkDecls((decl) => {
		let declValue = getDeclarationValue(decl)
		// A double slash opens a comment that runs to the end of its line, and `postcss-value-parser` knows nothing of the kind: it reads the text of such a comment as code of the value, and every comma standing in that text as a comma of the value
		// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence everything standing behind it on the line
		let reading = inlineCommentReading(decl, opts.result)
		// Every comment the file spells, and not the inline ones alone. `postcss-value-parser` has a node for a block comment, but looks for the closing delimiter from the opening slash itself, so the star of the opening serves as the star of that delimiter: it reads `/*/` as a comment entire where CSS reads an opening and goes on looking for a `*/` behind it. The rest of what the file spells as the text of that comment then comes back out of the parser as ordinary nodes of the value, the commas standing in it among them as `div` nodes (#275)
		let valueCommentSpans = findCommentSpans(declValue, reading.spells)

		// What a fix changed, and nothing else: the value is edited at the positions the fixes name rather than printed anew from the parsed tree, since `postcss-value-parser` does not always give back the text it was handed — a comment opening `/*/` comes back as `/**/` — and a fix made anywhere in such a value would rewrite a comment standing elsewhere in it
		let edits: Edit[] = []
		let parsedValue = valueParser(declValue)

		parsedValue.walk((valueNode, at, siblings) => {
			if (!isValueFunction(valueNode)) return

			// The node narrowed to a call, under a name the closures below can read it by: a narrowing made in this callback is not carried into a function created inside it
			let functionNode = valueNode

			if (!isStandardSyntaxFunction(valueNode)) return

			// The arguments of an address are no list of arguments at all — a data URI, a query string, whatever the address holds — so a comma standing there is none of this checker's. The name is read rather than matched against four characters, so that `u\rl(`, `\75 rl(` and `URL(` are the token `url(` is here as they are to the scan that finds the comments.
			if (opensAnAddress(valueNode, at, siblings)) return

			// Ignore functions listed in the `ignoreFunctions` option, including everything nested inside them
			if (optionsMatches(opts, `ignoreFunctions`, valueNode.value)) return false

			let argumentStrings = valueNode.nodes.map((node) => valueParser.stringify(node))

			// Remove function name and parens
			let argumentsRun = valueNode.before + argumentStrings.join(``) + valueNode.after
			// The reading that takes the comments out of the arguments is the reading that placed the commas: one scan of the run, whose spans say where every comment stands and which double slash opens one. The false openings are spelled out of harm's way in the same copy, so that nothing downstream of it reads an address for a comment either.
			let commentSpans = findCommentSpans(argumentsRun, reading.spells)
			let hiddenArguments = hideFalseInlineComments(argumentsRun, commentSpans)

			// The index each argument opens at inside that run, so that the text standing in front of a comma is taken by its length rather than joined together once per comma
			let argumentOffsets: number[] = []
			let argumentOffset = valueNode.before.length

			for (let argumentString of argumentStrings) {
				argumentOffsets.push(argumentOffset)
				argumentOffset += argumentString.length
			}

			// A comment standing behind code takes only itself out; one followed by nothing but whitespace takes the whitespace in front of it too
			let functionArguments = withoutComments(hiddenArguments, commentSpans)

			/**
			 * Gets the index of the comma for checking.
			 * @param commaNode - The comma node.
			 * @param nodeIndex - The index of the comma node.
			 * @returns The index of the comma for checking.
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

				// A comma inside the text of a comment is a comma of that text and of nothing else
				if (isCommentedOut(node)) continue

				let checkIndex = getCommaCheckIndex(node, nodeIndex)

				commaDataList.push({
					commaNode: node,
					checkIndex,
					nodeIndex,
				})
			}

			/**
			 * Asks whether a comma stands in the text of a comment rather than in the value.
			 * @param commaNode - The comma to place.
			 * @returns True if the comma is inside a comment.
			 */
			function isCommentedOut (commaNode: ValueParserDivNode): boolean {
				// A div node begins where its own leading whitespace does, and the comma is what has to be placed, so the question is put to the index behind that whitespace rather than to the node's own. Of a block comment the two indices ask the same thing wherever they stand: a run of whitespace holds neither `*/` nor `/*`, so it never straddles either edge of a closed span, and an unclosed one ends with the text, which no comma stands at or past. They part company where an inline comment ends in front of the comma, that whitespace being the break which closed it, and that is the reading this was written for.
				let commaIndex = commaNode.sourceIndex + commaNode.before.length

				return valueCommentSpans.some(({ start, end }) => commaIndex >= start && commaIndex < end)
			}

			/**
			 * Asks whether the comma can be moved at all.
			 *
			 * The `before` rules write the whitespace standing in front of the comma, and where an inline comment ends that whitespace, the line break it holds is what closes the comment. Neither option can be satisfied without taking the comma, and everything the declaration has left, into the comment's text: leave the value alone and let the warning stand. The `after` rules write behind the comma, where no comment can be open, so they ask nothing.
			 * @param commaNode - The comma being fixed.
			 * @returns True if the fix can write without commenting the comma out.
			 */
			function isFixable (commaNode: ValueParserDivNode): boolean {
				if (opts.fixPosition !== `before`) return true

				return !endsWithInlineComment(declValue.slice(0, commaNode.sourceIndex), reading)
			}

			/**
			 * Builds the callback that reports a problem at one comma.
			 * @param commaNode - The comma the problem is about.
			 * @param nodeIndex - The index of that comma among the arguments.
			 * @returns The callback, which reports the message it is handed at the comma.
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

		if (edits.length > 0) setDeclarationValue(decl, applyEditsFromEnd(declValue, edits))
	})
}
