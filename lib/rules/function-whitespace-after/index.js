import stylelint from "stylelint"
import styleSearch from "style-search"

import { addNamespace } from "../../utils/addNamespace.js"
import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isWhitespace from "../../utils/isWhitespace.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"

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

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) {
			return
		}

		/**
		 * @param {import('postcss').Node} node
		 * @param {string} value
		 * @param {number} nodeIndex
		 * @param {((index: number) => void) | undefined} fix
		 */
		function check (node, value, nodeIndex, fix) {
			styleSearch(
				{
					source: value,
					target: `)`,
					functionArguments: `only`,
				},
				(match) => {
					checkClosingParen(value, match.startIndex + 1, node, nodeIndex, fix)
				},
			)
		}

		/**
		 * @param {string} source
		 * @param {number} index
		 * @param {import('postcss').Node} node
		 * @param {number} nodeIndex
		 * @param {((index: number) => void) | undefined} fix
		 */
		function checkClosingParen (source, index, node, nodeIndex, fix) {
			let nextChar = source.charAt(index)

			if (!nextChar) { return }

			const problemIndex = nodeIndex + index

			if (primary === `always`) {
				// Allow for the next character to be a single empty space,
				// another closing parenthesis, a comma, or the end of the value
				if (nextChar === ` `) {
					return
				}

				if (nextChar === `\n`) {
					return
				}

				if (source.slice(index, index + 2) === `\r\n`) {
					return
				}

				if (ACCEPTABLE_AFTER_CLOSING_PAREN.has(nextChar)) {
					return
				}

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
			} else if (primary === `never` && isWhitespace(nextChar)) {
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
		 * @param {string} value
		 */
		function createFixer (value) {
			let fixed = ``
			let lastIndex = 0

			/** @type {(index: number) => void} */
			let applyFix

			if (primary === `always`) {
				applyFix = (index) => {
					fixed += `${value.slice(lastIndex, index)} `
					lastIndex = index
				}
			} else if (primary === `never`) {
				applyFix = (index) => {
					let whitespaceEndIndex = index + 1

					while (whitespaceEndIndex < value.length && isWhitespace(value.charAt(whitespaceEndIndex))) {
						whitespaceEndIndex++
					}

					fixed += value.slice(lastIndex, index)
					lastIndex = whitespaceEndIndex
				}
			} else {
				throw new Error(`Unexpected option: "${primary}"`)
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

		root.walkAtRules(/^import$/i, (atRule) => {
			let param = (atRule.raws.params && atRule.raws.params.raw) || atRule.params
			let fixer = createFixer(param)

			check(atRule, param, atRuleParamIndex(atRule), fixer ? fixer.applyFix : undefined)

			if (fixer && fixer.hasFixed) {
				if (atRule.raws.params) {
					atRule.raws.params.raw = fixer.fixed
				} else {
					atRule.params = fixer.fixed
				}
			}
		})
		root.walkDecls((decl) => {
			let value = getDeclarationValue(decl)
			let fixer = createFixer(value)

			check(decl, value, declarationValueIndex(decl), fixer ? fixer.applyFix : undefined)

			if (fixer && fixer.hasFixed) {
				setDeclarationValue(decl, fixer.fixed)
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
