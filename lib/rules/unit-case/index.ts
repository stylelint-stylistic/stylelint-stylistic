import { tokenize, TokenType } from "@csstools/css-tokenizer"
import type { AtRule, Declaration } from "postcss"
import valueParser, { type Node } from "postcss-value-parser"
import stylelint, { type RuleMessage } from "stylelint"

import { MEDIA_AT_RULE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { findInterpolationSpanTouching } from "../../utils/findInterpolationSpans/index.ts"
import { getDimension } from "../../utils/getDimension/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { weldEscapedWords } from "../../utils/weldEscapedWords/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `unit-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** One miscased unit: the warning, indexed in the node, and the edit, indexed in the text the walk reads. */
type Problem = {
	index: number,
	endIndex: number,
	message: RuleMessage,
	messageArgs: string[],
	edit: Edit,
}

/** One dimension read out of a word: how far into it the number and the unit reach, and the warning where that unit is miscased. */
type Reading = {
	end: number,
	problem: Problem | null,
}

/** The case, `lower` or `upper`. */
export type PrimaryOption = `lower` | `upper`

/**
 * Specifies lowercase or uppercase for units.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		/**
		 * Checks a node for miscased units.
		 * @param node - The at-rule or declaration whose text is checked.
		 * @param checkedValue - The params or value text the units are read from.
		 * @param getIndex - Where the value starts in the node.
		 */
		function check<T extends AtRule | Declaration> (node: T, checkedValue: string, getIndex: (node: T) => number): void {
			let problems: Problem[] = []
			let hasFixed = false

			// The value parser reads a `//` comment as words and calls, and closes a block comment opening `/*/` on its own star (#378)
			let comments = syntax.commentSpans(checkedValue, node, result)
			// Sought in a copy with the comments blanked, since a brace in a comment closes no interpolation
			let interpolations = syntax.interpolationSpans(blankComments(checkedValue, comments), node, result)

			/**
			 * Reads the dimension a value node holds and names its unit where it is miscased.
			 * @param valueNode - The value parser node.
			 * @returns How far the dimension reaches, and the problem where the case is wrong.
			 */
			function readMiscasedUnit (valueNode: Node): Reading {
				let whole: Reading = { end: valueNode.value.length, problem: null }
				let dimension = getDimension(syntax, valueNode)

				// A unit of no length is no unit and is never named, but the number it stands behind was read, and what follows it is a word of its own: `10--2REM` is `10` less `-2REM` to Less (#633)
				if (!dimension.number) return whole

				let { number, unit, positions } = dimension
				// The warning covers the unit alone. `positions` maps a length in the hack-free copy to a place in the file's text, so a `\9` between the letters keeps its place.
				let unitStart = positions[number.length]
				let unitLast = positions[number.length + unit.length - 1]

				if (unitStart === undefined || unitLast === undefined) return whole

				let unitEnd = unitLast + 1
				let expectedUnit = primary === `lower` ? unit.toLowerCase() : unit.toUpperCase()

				if (unit === expectedUnit) return { end: unitEnd, problem: null }

				let index = getIndex(node)
				// Recased in the file's text, not printed from the tree: `postcss-value-parser` prints `/*/` as `/**/`, and a hack unit between the letters keeps its place
				let run = valueNode.value.slice(unitStart, unitEnd)

				return {
					end: unitEnd,
					problem: {
						index: index + valueNode.sourceIndex + unitStart,
						endIndex: index + valueNode.sourceIndex + unitEnd,
						message: messages.expected,
						messageArgs: [unit, expectedUnit],
						edit: {
							start: valueNode.sourceIndex + unitStart,
							end: valueNode.sourceIndex + unitEnd,
							text: primary === `lower` ? run.toLowerCase() : run.toUpperCase(),
						},
					},
				}
			}

			/**
			 * Reads a word dimension by dimension and names every miscased unit it holds.
			 *
			 * The parser hands over one word where the grammar reads several: `10PX*2REM`, `10PX%2REM`, `10PX.2REM` and `10PX+2REM` are each two dimensions (#526), so the tokenizer reads the word, each dimension through a node standing where its token does. Escapes are the tokenizer's: `10PX\*2REM` is one dimension with unit `PX\*2REM` (#414), `10PX\\*2REM` two. Each unit carries its own edit, so nothing outside a unit is written (#413, #425).
			 * @param valueNode - The value parser node the word belongs to.
			 * @param text - The word, or what a parted dimension left of it.
			 * @param index - Where the text stands in the word.
			 */
			function readDimensions (valueNode: Node, text: string, index: number): void {
				// What a parted dimension leaves behind is read like a word of its own, in turn rather than one call deep, so a word of many parts costs no stack
				let words = [{ text, index }]

				for (let word of words) {
					for (let token of tokenize({ css: word.text })) {
						if (token[0] !== TokenType.Dimension) continue

						let start = word.index + token[2]
						let end = word.index + token[3] + 1
						let dimensionNode = {
							...valueNode,
							sourceIndex: valueNode.sourceIndex + start,
							sourceEndIndex: valueNode.sourceIndex + end,
							value: valueNode.value.slice(start, end),
						}
						let reading = readMiscasedUnit(dimensionNode)

						if (reading.problem) problems.push(reading.problem)

						// What the unit leaves inside the dimension is a word of its own to a syntax reading a unit shorter than the identifier: `10PX-2REM` is two dimensions to Less, as `10PX*2REM` is to the core, and `10PX-A` a dimension and a keyword. Under the core what it leaves is the rest of that same identifier — the escape of a hack taken out of the copy the unit was read in — and no word to read (#633)
						let rest = syntax.readsUnitAsIdentifier() ? `` : dimensionNode.value.slice(reading.end)
						// A hyphen ending a unit is Less's operator and no character of the operand, which carries a sign of its own: `10PX--2REM` is `10PX` less `-2REM`, `12PX` compiled, while a third hyphen leaves the keyword `--2REM` and no dimension at all. An escape ends a unit without being an operator, and opens the word standing behind it.
						let operator = rest.startsWith(`-`) ? 1 : 0

						if (rest.length > operator) words.push({ text: rest.slice(operator), index: start + reading.end + operator })
					}
				}
			}

			// Every quotation mark a comment leaves open is masked, so the parser pairs the marks as the file does (#508)
			let parsed = valueParser(hideQuotesInComments(checkedValue, comments))

			// The parser breaks a word at the whitespace closing a hexadecimal escape, so `10px\9 2PX` came back as two; the words are welded back, one inside a comment onto nothing (#526)
			weldEscapedWords(parsed.nodes, comments)

			parsed.walk((valueNode, at, siblings) => {
				let value = valueNode.value

				// A call opening an address holds no arguments and is passed over whole, under every spelling of `url(`
				if (opensAnAddress(valueNode, at, siblings)) return false

				// A node inside a comment is no node of the value, but its children are still walked: a call opened inside a `//` comment reaches past the comment's end. The address check comes first, since such a `url()` reaches past the end too.
				if (findCommentSpanHolding(valueNode, comments)) return

				// A node touching an interpolation is passed over, since the parser breaks an interpolation holding whitespace into words (`10px#{$a`); its children are still walked
				if (findInterpolationSpanTouching(valueNode, interpolations)) return

				if (valueNode.type !== `word`) return

				readDimensions(valueNode, value, 0)
			})

			/** Records that a fix was asked for. */
			function markFixed (): void {
				hasFixed = true
			}

			if (problems.length > 0) {
				// A word read part by part names the parts out of order, and a warning belongs where the file spells it
				for (let err of problems.toSorted((one, other) => one.index - other.index)) {
					report({
						index: err.index,
						endIndex: err.endIndex,
						message: err.message,
						messageArgs: err.messageArgs,
						node,
						result,
						ruleName,
						fix: markFixed,
					})
				}

				// One write with every unit the walk named, once the whole list is reported
				if (hasFixed) {
					let fixedValue = applyEditsFromEnd(checkedValue, problems.map((problem) => problem.edit))

					syntax.write(node, fixedValue)
				}
			}
		}

		root.walkAtRules((atRule) => {
			if (!MEDIA_AT_RULE.test(atRule.name) && !syntax.readsAtRuleAsVariable(atRule)) return

			check(atRule, syntax.read(atRule), atRuleParamIndex)
		})
		root.walkDecls((decl) => check(decl, syntax.read(decl), declarationValueIndex))
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
