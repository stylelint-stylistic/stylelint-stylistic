import type { Root } from "postcss"
import valueParser, { type DivNode as ValueParserDivNode, type FunctionNode as ValueParserFunctionNode } from "postcss-value-parser"
import stylelint, { type PostcssResult } from "stylelint"

import { LINE_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { breakRereadsParentheses } from "../breakRereadsParentheses/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { type CommentReading, type CommentSpan, findCommentSpans, findEscapeSpans } from "../findCommentSpans/index.ts"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.ts"
import { hideParenthesesInUrlStrings } from "../hideParenthesesInUrlStrings/index.ts"
import { hideQuotesInComments } from "../hideQuotesInComments/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { maskEscapes } from "../maskEscapes/index.ts"
import { opensAnAddress } from "../opensAnAddress/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { quotesItsAddress } from "../quotesItsAddress/index.ts"
import { rereadsAnAddress } from "../rereadsAnAddress/index.ts"
import { isValueFunction } from "../typeGuards/index.ts"
import { commentsRemovedBefore, withoutComments } from "../withoutComments/index.ts"
import { runBehind, runInFront, type TwinRun, writesTwinRun } from "../writesTwinRun/index.ts"

let { utils: { report } } = stylelint

/** Checks the whitespace at one index of a source, counting the lines of another text. */
export type LocationChecker = (args: {
	source: string,
	index: number,
	err: (message: string) => void,
	lineCheckStr?: string,
}) => void

/** A comma of a call as the check reads it. */
type FunctionComma = {
	commaNode: ValueParserDivNode,
	checkIndex: number,
	commentedIndex: number,
	nodeIndex: number,
}

/**
 * Reads the two copies of a call's arguments a check runs over — the one with the comments taken out, which the lines are counted of, and the one with them left standing, which the run behind a comma is read over — and where each comma stands in either.
 * @param functionNode - The call.
 * @param reading - Whether `//` opens a comment.
 * @param valueCommentSpans - The comment spans of the whole value.
 * @returns The two copies and the commas.
 */
function commasOf (functionNode: ValueParserFunctionNode, reading: CommentReading, valueCommentSpans: CommentSpan[]): { runArguments: string, commentedArguments: string, commaDataList: FunctionComma[] } {
	let argumentStrings = functionNode.nodes.map((node) => valueParser.stringify(node))
	// Remove function name and parens
	let argumentsRun = functionNode.before + argumentStrings.join(``) + functionNode.after
	// False `//` openings are masked in the same copy so nothing downstream reads an address as a comment
	let commentSpans = findCommentSpans(argumentsRun, reading)
	let hiddenArguments = hideFalseInlineComments(argumentsRun, commentSpans)
	// Where each argument opens, so the text in front of a comma is found by offset
	let argumentOffsets: number[] = []
	let argumentOffset = functionNode.before.length

	for (let argumentString of argumentStrings) {
		argumentOffsets.push(argumentOffset)
		argumentOffset += argumentString.length
	}

	let commaDataList: FunctionComma[] = []

	for (let [nodeIndex, node] of functionNode.nodes.entries()) {
		if (node.type !== `div` || node.value !== `,`) continue

		// A comma in a comment's text is not the value's; a div node starts at its whitespace, and the comma is placed behind it, which differs only where an inline comment's closing break is that whitespace
		let valueIndex = node.sourceIndex + node.before.length

		if (valueCommentSpans.some(({ start, end }) => valueIndex >= start && valueIndex < end)) continue

		let openingOffset = argumentOffsets[nodeIndex]

		if (openingOffset === undefined) throw new Error(`The comma stands in no argument of the function`)

		let commaIndex = openingOffset + node.before.length

		commaDataList.push({ commaNode: node, checkIndex: commaIndex - commentsRemovedBefore(hiddenArguments, commaIndex, commentSpans), commentedIndex: commaIndex, nodeIndex })
	}

	// A comment followed by whitespace alone takes the whitespace in front of it out too
	let functionArguments = withoutComments(hiddenArguments, commentSpans)

	// The value parser reads an escaped space as a character of its word, so the fix cuts none, and the check reads the run over a copy where it is none either (1789661964)
	return {
		runArguments: maskEscapes(functionArguments, findEscapeSpans(functionArguments, reading), true),
		commentedArguments: maskEscapes(hiddenArguments, findEscapeSpans(hiddenArguments, reading), true),
		commaDataList,
	}
}

/**
 * Reads the calls nested in a call whose commas the check reads, as the walk of the value finds them.
 * @param functionNode - The call.
 * @param reading - Whether `//` opens a comment.
 * @param valueCommentSpans - The comment spans of the whole value.
 * @param reads - Whether the rule reads a call's commas, or `ignored` where its `ignoreFunctions` names the call, which covers everything inside.
 * @returns Each nested call's arguments and commas.
 */
function nestedCallsOf (functionNode: ValueParserFunctionNode, reading: CommentReading, valueCommentSpans: CommentSpan[], reads: (call: ValueParserFunctionNode) => `ignored` | boolean): ReturnType<typeof commasOf>[] {
	let calls: ReturnType<typeof commasOf>[] = []

	valueParser.walk(functionNode.nodes, (node, at, siblings) => {
		if (!isValueFunction(node) || (opensAnAddress(node, at, siblings) && !quotesItsAddress(node))) return

		let answer = reads(node)

		if (answer === `ignored`) return false
		if (answer) calls.push(commasOf(node, reading, valueCommentSpans))
	})

	return calls
}

/**
 * Names the calls around every nested call of a value, since `ignoreFunctions` covers everything inside a call it names.
 * @param parsedValue - The parsed value.
 * @returns The names by call, the innermost first; a call standing in no other has no entry.
 */
function enclosingNamesOf (parsedValue: valueParser.ParsedValue): WeakMap<ValueParserFunctionNode, string[]> {
	let names: WeakMap<ValueParserFunctionNode, string[]> = new WeakMap()

	parsedValue.walk((valueNode) => {
		if (!isValueFunction(valueNode)) return

		for (let child of valueNode.nodes) {
			if (isValueFunction(child)) names.set(child, [child.value, ...(names.get(valueNode) ?? [valueNode.value])])
		}
	})

	return names
}

/**
 * Describes the run beside a comma to the gate between twins: the run in dispute is read over the copy the check reads it over, while the lines are counted, and the runs they are counted without are read, over the copy with the comments taken out — the one the `-single-line` and `-multi-line` options are judged over.
 * @param position - The side of the comma the rule writes.
 * @param runText - The copy of the arguments the run in dispute is read over.
 * @param lineText - The copy the lines are counted of, which the runs subtracted from them are read over too.
 * @param comma - Where the comma stands.
 * @param comma.checkIndex - The comma's index in `runText`.
 * @param comma.lineIndices - The index in `lineText` of every comma of the call.
 * @param comma.nestedCalls - The calls nested in it that the rule reads, whose runs it writes in the same pass.
 * @param comma.line - The line the comma stands on.
 * @param comma.functionNames - The names of the call and of the calls around it, which a twin's `ignoreFunctions` passes over.
 * @returns The run.
 */
function twinRunAt (position: `before` | `after`, runText: string, lineText: string, { checkIndex, lineIndices, nestedCalls, line, functionNames }: { checkIndex: number, lineIndices: number[], nestedCalls: () => ReturnType<typeof commasOf>[], line: number, functionNames: string[] }): TwinRun {
	let readRun = position === `before` ? runInFront : runBehind

	return {
		side: position,
		run: readRun(runText, checkIndex),
		lineText,
		// A nested call's runs are lines of this one's text too
		runs: () => [...lineIndices.map((each) => readRun(lineText, each)), ...nestedCalls().flatMap((call) => call.commaDataList.map((each) => readRun(call.runArguments, each.checkIndex)))],
		line,
		// Both twinread and write the comma'own run, whatever comment standbehind it
		twinWrites: (_option, secondary) => !functionNames.some((name) => optionsMatches(secondary, `ignoreFunctions`, name)),
	}
}

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
	shortName: string,
}): void {
	let { fix } = opts
	// A `before` rule reads the run in front of the comma, which a comment there leaves where it stands until the fix writes there (1789971383); only the run behind one is read past a comment by the copy with the comments taken out
	let readsBehind = opts.fixPosition !== `before`

	opts.root.walkDecls((decl) => {
		let declValue = opts.syntax.read(decl)
		// The value parser reads commas inside a `//` comment; whether `//` opens one the syntax says (in plain CSS `myurl(//a)` is code)
		let reading = opts.syntax.inlineComments(decl, opts.result)
		// Block comments too: the value parser closes `/*/` on its own star and returns the rest as nodes, commas among them (#275)
		let valueCommentSpans = findCommentSpans(declValue, reading)

		// Edited by position rather than printed from the tree, which gives `/*/` back as `/**/`
		let edits: Edit[] = []
		// Masked so the parser pairs quotation marks as the file does (#508)
		let parsedValue = valueParser(hideParenthesesInUrlStrings(hideQuotesInComments(declValue, valueCommentSpans), valueCommentSpans))
		let enclosingNames = enclosingNamesOf(parsedValue)

		parsedValue.walk((valueNode, at, siblings) => {
			if (!isValueFunction(valueNode)) return

			// The narrowing does not reach into the functions below
			let functionNode = valueNode

			if (!opts.syntax.isStandardFunction(valueNode)) return

			// A comma in a bare address separates no arguments, while one behind a quoted address does; the name is read, not matched, so `u\rl(` and `URL(` are `url(` here as to the comment scan
			if (opensAnAddress(valueNode, at, siblings) && !quotesItsAddress(valueNode)) return

			// `ignoreFunctions` covers everything nested inside too
			if (optionsMatches(opts, `ignoreFunctions`, valueNode.value)) return false

			let { runArguments, commentedArguments, commaDataList } = commasOf(valueNode, reading, valueCommentSpans)
			// A comment behind a comma takes the whitespace in front of itself out of the copy with the comments removed, so the run read there is the one past the comment while the fix writes the one in front of it (1789508660); the list families read this side with the comments standing
			let readText = readsBehind ? commentedArguments : runArguments

			/**
			 * Reads a comma's index in the copy the runs are read over.
			 * @param comma - The comma.
			 * @returns The index.
			 */
			function readIndexOf (comma: FunctionComma): number {
				return readsBehind ? comma.commentedIndex : comma.checkIndex
			}

			/**
			 * Asks whether a fix can write at the comma. A `before` rule writes over the whitespace in front of it, and where that is an inline comment's closing break either option would take the comma into the comment; an `after` rule writes behind the comma, where no comment is open.
			 * @param commaNode - The div node holding the comma.
			 * @param nodeIndex - Its index among the arguments.
			 * @param readIndex - Its index in the copy the runs are read over.
			 * @param index - Its index in the declaration.
			 * @returns True where the fix writes into no comment, parts the name of no bare address from the comma or joins it to the comma, which switches how PostCSS reads the parentheses, writes no break into parentheses PostCSS holds as one token whose bracket the break would leave open, and its twin, reading the same run, leaves it that run ([#704](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/704)).
			 */
			function isFixable (commaNode: ValueParserDivNode, nodeIndex: number, readIndex: number, index: number): boolean {
				if (opts.fixPosition === `before` && opts.syntax.endsWithInlineComment(declValue.slice(0, commaNode.sourceIndex), reading)) return false

				let commaEdits = fix?.(commaNode, nodeIndex, functionNode) ?? []

				if (commaEdits.some((edit) => rereadsAnAddress(declValue, edit, reading))) return false

				// A break written into parentheses PostCSS holds as one token makes them code, and a `[` nothing closes inside, or such a `{` in a custom property's value, is then a group the parser finds open and the file stops parsing: the break is refused there and the warning stands
				if (commaEdits.some((edit) => LINE_BREAK.test(edit.text)) && breakRereadsParentheses(declValue, functionNode.sourceIndex + functionNode.value.length, isCustomProperty(decl.prop))) return false

				return writesTwinRun(opts.shortName, opts.checkedRuleName, decl, opts.result, twinRunAt(readsBehind ? `after` : `before`, readText, runArguments, {
					checkIndex: readIndex,
					lineIndices: commaDataList.map((each) => each.checkIndex),
					nestedCalls: () => nestedCallsOf(functionNode, reading, valueCommentSpans, (call) => optionsMatches(opts, `ignoreFunctions`, call.value) ? `ignored` : opts.syntax.isStandardFunction(call)),
					line: decl.rangeBy({ index }).start.line,
					functionNames: enclosingNames.get(functionNode) ?? [functionNode.value],
				}))
			}

			/**
			 * Builds the callback reporting a problem at one comma.
			 * @param commaNode - The div node holding the comma.
			 * @param nodeIndex - Its index among the arguments.
			 * @param readIndex - Its index in the copy the runs are read over.
			 * @returns The callback, which reports the message at the comma.
			 */
			function createErrHandler (commaNode: ValueParserDivNode, nodeIndex: number, readIndex: number): (message: string) => void {
				return (message) => {
					let index = declarationValueIndex(decl) + commaNode.sourceIndex + commaNode.before.length

					report({
						index,
						endIndex: index,
						message,
						node: decl,
						result: opts.result,
						ruleName: opts.checkedRuleName,
						...(fix && isFixable(commaNode, nodeIndex, readIndex, index) && {
							fix: (): void => {
								edits.push(...fix(commaNode, nodeIndex, functionNode))
							},
						}),
					})
				}
			}

			for (let comma of commaDataList) {
				let readIndex = readIndexOf(comma)

				opts.locationChecker({
					source: readText,
					index: readIndex,
					// The lines are counted of the copy with the comments taken out, which is what a comma of a call has always been judged single- or multi-line over
					lineCheckStr: runArguments,
					err: createErrHandler(comma.commaNode, comma.nodeIndex, readIndex),
				})
			}
		})

		if (edits.length > 0) opts.syntax.write(decl, applyEditsFromEnd(declValue, edits))
	})
}
