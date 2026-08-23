import stylelint from "stylelint"

import { IMPORT_AT_RULE, LEADING_SPACED_SUM_OPERATOR } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { findFunctionArgumentSpans } from "../../utils/findFunctionArgumentSpans/index.js"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isWhitespace } from "../../utils/isWhitespace/index.js"
import { searchCopy } from "../../utils/searchCopy/index.js"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `function-whitespace-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		/**
		 * Checks a node for function whitespace after violations.
		 * @param {import('postcss').Node} node - The node to check.
		 * @param {string} value - The value to check.
		 * @param {string} searchString - The copy of that value {@link searchCopy} builds, which is as long as it and spells it character for character outside its comments.
		 * @param {number} nodeIndex - The index of the node.
		 * @param {((index: number) => void) | undefined} fix - The fix function.
		 */
		function check (node, value, searchString, nodeIndex, fix) {
			// The parenthesis a call closes is the one this rule is about, and it is looked for rather than come across: the parentheses of `(@a * 2)px` group an arithmetic expression, and the unit standing behind them belongs to it, so neither option may touch that spelling. A call the text never closes ends at the end of it, where no parenthesis stands and nothing follows to space from. The spans come in the order the text closes them, so the fixer is handed its positions front to back, as it reads them
			for (let { end } of findFunctionArgumentSpans(searchString)) {
				if (searchString.charAt(end) !== `)`) continue

				checkClosingParen(value, searchString, end + 1, node, nodeIndex, fix)
			}
		}

		/**
		 * Checks a closing parenthesis for whitespace violations.
		 * @param {string} source - The source string.
		 * @param {string} searchString - The copy of that string {@link searchCopy} builds, whose comments are blanked out — which is what a sum is looked for in. CSS discards a comment rather than reading it as whitespace, so what makes a sum is the whitespace left standing in front of the operator once the comments are gone; blanking one to spaces reads it as though whitespace stood there, which is the wider question of the two, and a wider one here can only leave a warning unsaid where the fix would have been safe.
		 * @param {number} index - The index to check.
		 * @param {import('postcss').Node} node - The node with the violation.
		 * @param {number} nodeIndex - The index of the node.
		 * @param {((index: number) => void) | undefined} fix - The fix function.
		 */
		function checkClosingParen (source, searchString, index, node, nodeIndex, fix) {
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
				// The whitespace in front of a `+` or a `-` that opens no number belongs to the sum rather than to the call: it is what makes the sign an operator, so `a { b: calc(var(--x) + 1px); }` closed up is a calculation no browser reads and a declaration it drops
				if (LEADING_SPACED_SUM_OPERATOR.test(searchString.slice(index))) return

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
		 * @param {string} value - The value to fix.
		 * @returns {{ applyFix: (index: number) => void, hasFixed: boolean, fixed: string }} The fixer object.
		 */
		function createFixer (value) {
			let fixed = ``
			let lastIndex = 0

			/**
			 * Applies a fix at the given index.
			 * @param {number} index - The index to fix at.
			 * @returns {void}
			 * @throws {Error} Throws an error if the primary option is unexpected.
			 */
			function applyFix (index) {
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
			let param = getAtRuleParams(atRule)
			let { searchString } = searchCopy(param, atRule, result)
			let fixer = createFixer(param)

			check(atRule, param, searchString, atRuleParamIndex(atRule), fixer ? fixer.applyFix : undefined)

			if (fixer && fixer.hasFixed) setAtRuleParams(atRule, fixer.fixed)
		})
		root.walkDecls((decl) => {
			let value = getDeclarationValue(decl)
			let { searchString } = searchCopy(value, decl, result)
			let fixer = createFixer(value)

			check(decl, value, searchString, declarationValueIndex(decl), fixer ? fixer.applyFix : undefined)

			if (fixer && fixer.hasFixed) setDeclarationValue(decl, fixer.fixed)
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
