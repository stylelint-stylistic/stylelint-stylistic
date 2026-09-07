import type { Node } from "postcss"
import stylelint from "stylelint"

import { IMPORT_AT_RULE, LEADING_SPACED_SIGN, LEADING_SPACED_SUM_OPERATOR } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findFunctionArgumentSpans } from "../../utils/findFunctionArgumentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isWhitespace } from "../../utils/isWhitespace/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `function-whitespace-after`

const MESSAGES = defineMessages({
	expected: `Expected whitespace after ")"`,
	rejected: `Unexpected whitespace after ")"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

const ACCEPTABLE_AFTER_CLOSING_PAREN = new Set([`)`, `,`, `}`, `:`, `/`, undefined])

/**
 * Requires or disallows whitespace after functions.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always` or `never`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		/**
		 * Checks every closing parenthesis of a value.
		 * @param node - The declaration or at-rule the text belongs to.
		 * @param value - The value or params text, comments in place.
		 * @param searchString - The {@link searchCopy} of the value, same length, comments blanked.
		 * @param nodeIndex - The node's index.
		 * @param fix - The fixer.
		 */
		function check (node: Node, value: string, searchString: string, nodeIndex: number, fix: (index: number) => void): void {
			// Only a call's closing `)` is the rule's: `(@a * 2)px` groups an expression, and an unclosed call ends with the text. The spans come in closing order, so the fixer gets its positions front to back
			for (let { end } of findFunctionArgumentSpans(searchString)) {
				if (searchString.charAt(end) !== `)`) continue

				checkClosingParen(value, searchString, end + 1, node, nodeIndex, fix)
			}
		}

		/**
		 * Checks the whitespace behind one closing parenthesis.
		 * @param source - The value or params text the parenthesis stands in.
		 * @param searchString - The {@link searchCopy} with comments blanked; blanking asks the wider question and can only leave a safe fix unwritten.
		 * @param index - The index behind the parenthesis.
		 * @param node - The declaration or at-rule reported.
		 * @param nodeIndex - The node's index.
		 * @param fix - The fixer.
		 */
		function checkClosingParen (source: string, searchString: string, index: number, node: Node, nodeIndex: number, fix: (index: number) => void): void {
			let nextChar = source.charAt(index)

			if (!nextChar) return

			let problemIndex = nodeIndex + index

			if (primary === `always`) {
				// A space, a break, a closer, a comma or the end of the value is accepted
				if (nextChar === ` `) return

				if (nextChar === `\n`) return

				if (source.slice(index, index + 2) === `\r\n`) return

				if (ACCEPTABLE_AFTER_CLOSING_PAREN.has(nextChar)) return

				report({
					message: messages.expected,
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix () {
						fix(index)
					},
				})
			}
			else if (primary === `never` && isWhitespace(nextChar)) {
				// The whitespace in front of an operator is the sum's: `calc(var(--x) + 1px)` closed up is no calculation. To CSS a sign opening a number (`-1px`) is no operator; a syntax with its own arithmetic tells a subtraction from a list by that whitespace alone
				if ((syntax.spellsOwnArithmetic(node, result) ? LEADING_SPACED_SIGN : LEADING_SPACED_SUM_OPERATOR).test(searchString.slice(index))) return

				report({
					message: messages.rejected,
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix () {
						fix(index)
					},
				})
			}
		}

		/**
		 * Creates a fixer over a value.
		 * @param value - The value or params text the fixes are written into.
		 * @returns The fixer.
		 */
		function createFixer (value: string): {
			applyFix: (index: number) => void,
			hasFixed: boolean,
			fixed: string,
		} {
			let fixed = ``
			let lastIndex = 0

			/**
			 * Applies a fix at an index.
			 * @param index - The offset just behind a closing parenthesis.
			 * @throws {Error} On a primary option that is neither `always` nor `never`.
			 */
			function applyFix (index: number): void {
				if (primary === `always`) {
					fixed += `${value.slice(lastIndex, index)} `
					lastIndex = index
				}
				else if (primary === `never`) {
					let whitespaceEndIndex = index + 1

					while (whitespaceEndIndex < value.length && isWhitespace(value.charAt(whitespaceEndIndex))) whitespaceEndIndex += 1

					fixed += value.slice(lastIndex, index)
					lastIndex = whitespaceEndIndex
				}
				else throw new Error(`Unexpected option: "${primary}"`)
			}

			return {
				applyFix,
				get hasFixed () {
					return Boolean(lastIndex)
				},
				get fixed () {
					return fixed + value.slice(lastIndex)
				},
			}
		}

		root.walkAtRules(IMPORT_AT_RULE, (atRule) => {
			let param = syntax.read(atRule)
			let { searchString } = syntax.searchCopy(param, atRule, result)
			let fixer = createFixer(param)

			check(atRule, param, searchString, atRuleParamIndex(atRule), fixer.applyFix)

			if (fixer.hasFixed) syntax.write(atRule, fixer.fixed)
		})
		root.walkDecls((decl) => {
			let value = syntax.read(decl)
			let { searchString } = syntax.searchCopy(value, decl, result)
			let fixer = createFixer(value)

			check(decl, value, searchString, declarationValueIndex(decl), fixer.applyFix)

			if (fixer.hasFixed) syntax.write(decl, fixer.fixed)
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
