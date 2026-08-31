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
import { findInlineCommentSpanHolding } from "../../utils/findInlineCommentSpans/index.ts"
import { findInterpolationSpanTouching } from "../../utils/findInterpolationSpans/index.ts"
import { getDimension } from "../../utils/getDimension/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `unit-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** What one miscased unit is reported as: where the warning stands, counted in the node, and what it says. */
type Problem = {
	index: number,
	endIndex: number,
	message: RuleMessage,
	messageArgs: string[],
}

/**
 * Specifies lowercase or uppercase for units.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `lower` and `upper`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `lower` | `upper`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		/**
		 * Checks a node for unit case violations.
		 * @param node - The node to check.
		 * @param checkedValue - The value to check.
		 * @param getIndex - Function to get the index of the node.
		 */
		function check<T extends AtRule | Declaration> (node: T, checkedValue: string, getIndex: (node: T) => number): void {
			let problems: Problem[] = []

			// What the walk changed, and nothing else: the text is edited at the positions the changed words stand at rather than printed anew from the parsed tree, since `postcss-value-parser` does not always give back the text it was handed — a comment opening `/*/` comes back as `/**/` — and a fix made anywhere in such a text would rewrite a comment standing elsewhere in it
			let edits: Edit[] = []
			let hasFixed = false

			// Every comment of the value, both kinds: one of the two readings below wants the inline ones and the other wants them all. The inline ones are taken out of this list rather than asked of `findInlineCommentSpans`, since that helper is this very scan with the filter below already applied, and asking it as well would read one text twice over for one answer
			let comments = syntax.commentSpans(checkedValue, node, result)
			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary words and calls
			let inlineComments = comments.filter(({ isInline }) => isInline)
			// An interpolation is written in a language of its own, and the compiler expanding it settles what the text beside it means, so nothing a value spells next to one is a dimension this rule can read. The interpolations are found in the value once, and every node of the walk is measured against them. They are sought in a copy with every comment blanked out, since a brace written in a comment closes no interpolation and the code standing behind such a brace is code the file spells
			let interpolations = syntax.interpolationSpans(blankComments(checkedValue, comments), node, result)

			/**
			 * Reads the dimension a value node holds and says where its unit is written in the case the option does not ask for.
			 * @param valueNode - The value parser node to read.
			 * @returns What to report about the unit, or `null` where the node carries no miscased one.
			 */
			function readMiscasedUnit (valueNode: Node): Problem | null {
				let dimension = getDimension(syntax, valueNode)

				if (!dimension.number || !dimension.unit) return null

				let { number, unit: tail, positions } = dimension

				let unit = withoutBangFlag(tail)

				if (!unit) return null

				let expectedUnit = primary === `lower` ? unit.toLowerCase() : unit.toUpperCase()

				if (unit === expectedUnit) return null

				let index = getIndex(node)
				// The warning opens where the unit's first character stands and closes one character past its last, so it covers the run that reading was taken from and nothing besides. `getDimension` reads its unit out of a copy with the interpolation and the hack units taken out, and `positions` is the only way from a length counted in that copy to a place in the text the file spells: a bang flag riding behind the unit, a `\9` written after it and the brace an interpolation was broken on all stay outside a run measured this way.
				let unitStart = positions[number.length]
				let unitLast = positions[number.length + unit.length - 1]

				if (unitStart === undefined || unitLast === undefined) return null

				let unitEnd = unitLast + 1

				return {
					index: index + valueNode.sourceIndex + unitStart,
					endIndex: index + valueNode.sourceIndex + unitEnd,
					message: messages.expected,
					messageArgs: [unit, expectedUnit],
				}
			}

			valueParser(checkedValue).walk((valueNode, at, siblings) => {
				let value = valueNode.value

				// A call opening an address holds a URL and no arguments of its own, so it is passed over whole. The name is read rather than matched against four characters, so that `u\rl(`, `\75 rl(` and `URL(` are the token `url(` is here as they are to the scan that finds the comments — and to Sass, and to `lightningcss`.
				if (opensAnAddress(valueNode, at, siblings)) return false

				// A node standing in the text of an inline comment is no node of the value: leave it alone. What it holds is still walked, and every node of that asked the same question, since a call opened inside such a comment reaches past the break that closes it and the code it gathers there is code the file spells. An address is passed over first, since the scan that finds the comments steps over one only where it reads it as code: an `url()` opened in a comment's text is a node of that comment holding an address that reaches past the break, and what stands there is nothing this rule may read.
				if (findInlineCommentSpanHolding(valueNode, inlineComments)) return

				// A node carrying any text of an interpolation is passed over whichever side of it the node opens on, since a value parser breaks an interpolation holding whitespace into words and hands no one of them the whole of it: `isStandardSyntaxValue` is asked about a word at a time and answers that `10px#{$a` holds no interpolation at all. What such a node holds is still walked, as the text of an inline comment is, and every node of it asked the same
				if (findInterpolationSpanTouching(valueNode, interpolations)) return

				let holdsMultiplication = value.includes(`*`)
				let holdsMiscasedPart = false

				if (holdsMultiplication) {
					// Every part of a multiplication stands where the word does plus what the parts in front of it take up, the star between each pair counted in. Positions of any other making describe no text of the part: `2*10PX` was underlined as an empty run standing past the end of the line, and `10px*2REM` as the closing brace of the block behind the value. Nothing reads the second position of such a node, and it is written because a node carrying one position of the file and one of nowhere is the shape this whole reading went wrong on
					let partIndex = 0

					for (let part of value.split(`*`)) {
						let partProblem = readMiscasedUnit({
							...valueNode,
							sourceIndex: valueNode.sourceIndex + partIndex,
							sourceEndIndex: valueNode.sourceIndex + partIndex + part.length,
							value: part,
						})

						if (partProblem) {
							problems.push(partProblem)
							holdsMiscasedPart = true
						}

						partIndex += part.length + 1
					}
				}

				let wordProblem = readMiscasedUnit(valueNode)

				if (!wordProblem) return

				// A word holding a multiplication is more than one dimension, and the whole of it is a dimension of no language: `valueParser.unit` answers any word opening with a number and calls everything standing behind that number a unit, so `10PX*2REM*3EM` reads as the unit `PX*2REM*3EM`. What a reader is told about such a word is its parts, each named by the unit it holds, and the whole-word reading is what decides the write: one edit recases the word, and every unit standing in it with it.
				if (!holdsMultiplication) problems.push(wordProblem)
				// So a word no part of which was named is written by nothing. The write below is applied as soon as any one fix of this text is called, whichever word that fix was reported over, and what such a word holds outside its units is no unit of anything — the `A` of `1px*A`, the exponent of `10px*2E5` — so a neighbour's fix must not recase it.
				else if (!holdsMiscasedPart) return

				let dimension = withoutBangFlag(value)
				// A dimension is a word, and the text a word node stands in is its own value: the span is as long as the value the parser read, which the flag riding behind the unit is written back into unchanged
				edits.push({
					start: valueNode.sourceIndex,
					end: valueNode.sourceIndex + value.length,
					text: (primary === `lower` ? dimension.toLowerCase() : dimension.toUpperCase()) + value.slice(dimension.length),
				})
			})

			/** Says that a fix was called, so that the write below knows it was asked for. */
			function markFixed (): void {
				hasFixed = true
			}

			if (problems.length > 0) {
				for (let err of problems) {
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

				// Every fix of this rule writes every unit the walk changed, whichever problem it was reported for: a word carrying a multiplication is reported part by part, and no part of it names a write of its own. So the writing waits for the whole list of problems to be reported, and one fix among them called is what asks for it.
				if (hasFixed) {
					let fixedValue = applyEditsFromEnd(checkedValue, edits)

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

/**
 * Takes the bang flag off the end of a text, where it carries one.
 *
 * PostCSS moves only the last `!important` of a declaration out of the value, so every flag written in front of it stays where it was, and `postcss-value-parser` reads `1px!important` as one word; Sass writes `!default` and `!global` in the same place. No unit is spelled with a bang, so a unit ends where a flag begins, and the keyword behind it is nothing this rule is about.
 * @param text - A unit read out of a value word, or the word itself.
 * @returns What stands in front of the first bang, or the whole text where it holds none.
 */
function withoutBangFlag (text: string): string {
	let bang = text.indexOf(`!`)

	return bang === -1 ? text : text.slice(0, bang)
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
