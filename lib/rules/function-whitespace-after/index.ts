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
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		/**
		 * Checks a node for function whitespace after violations.
		 * @param node - The node to check.
		 * @param value - The value to check.
		 * @param searchString - The copy of that value {@link searchCopy} builds, which is as long as it and spells it character for character outside its comments.
		 * @param nodeIndex - The index of the node.
		 * @param fix - The fix function.
		 */
		function check (node: Node, value: string, searchString: string, nodeIndex: number, fix: (index: number) => void): void {
			// The parenthesis a call closes is the one this rule is about, and it is looked for rather than come across: the parentheses of `(@a * 2)px` group an arithmetic expression, and the unit standing behind them belongs to it, so neither option may touch that spelling. A call the text never closes ends at the end of it, where no parenthesis stands and nothing follows to space from. The spans come in the order the text closes them, so the fixer is handed its positions front to back, as it reads them
			for (let { end } of findFunctionArgumentSpans(searchString)) {
				if (searchString.charAt(end) !== `)`) continue

				checkClosingParen(value, searchString, end + 1, node, nodeIndex, fix)
			}
		}

		/**
		 * Checks a closing parenthesis for whitespace violations.
		 * @param source - The source string.
		 * @param searchString - The copy of that string {@link searchCopy} builds, whose comments are blanked out — which is what a sum is looked for in. CSS discards a comment rather than reading it as whitespace, so what makes a sum is the whitespace left standing in front of the operator once the comments are gone; blanking one to spaces reads it as though whitespace stood there, which is the wider question of the two, and a wider one here can only leave a warning unsaid where the fix would have been safe.
		 * @param index - The index to check.
		 * @param node - The node with the violation.
		 * @param nodeIndex - The index of the node.
		 * @param fix - The fix function.
		 */
		function checkClosingParen (source: string, searchString: string, index: number, node: Node, nodeIndex: number, fix: (index: number) => void): void {
			let nextChar = source.charAt(index)

			if (!nextChar) return

			let problemIndex = nodeIndex + index

			if (primary === `always`) {
				// Allow for the next character to be a single empty space, another closing parenthesis, a comma, or the end of the value
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
				// The whitespace in front of a `+` or a `-` that stands as an operator belongs to the sum rather than to the call: it is what makes the sign one, so `a { b: calc(var(--x) + 1px); }` closed up is a calculation no browser reads and a declaration it drops. Which signs stand as operators is what the syntax says: CSS reads `-1px` as a single number token, so a sign opening a number is part of that number and the whitespace in front of it is the call's, while a syntax spelling arithmetic of its own reads that whitespace as the whole of what tells a list of two values from a subtraction
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
		 * Creates a fixer function for whitespace violations.
		 * @param value - The value to fix.
		 * @returns The fixer object.
		 */
		function createFixer (value: string): {
			applyFix: (index: number) => void,
			hasFixed: boolean,
			fixed: string,
		} {
			let fixed = ``
			let lastIndex = 0

			/**
			 * Applies a fix at the given index.
			 * @param index - The index to fix at.
			 * @throws {Error} Throws an error if the primary option is unexpected.
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
