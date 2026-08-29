import stylelint from "stylelint"

import { IMPORT_AT_RULE, LEADING_SPACED_SIGN, LEADING_SPACED_SUM_OPERATOR } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { findFunctionArgumentSpans } from "../../utils/findFunctionArgumentSpans/index.js"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isWhitespace } from "../../utils/isWhitespace/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
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
 * @type {import('stylelint').RuleBase<'always' | 'never'>}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		/**
		 * Asks whether the syntax that spelled a node reads arithmetic of its own, in which the whitespace in front of every sign is what makes the sign an operator.
		 *
		 * Nothing in the tree can answer this: `foo($a) -2px`, which Sass reads as a list of two values, and `foo($a)-2px`, which it reads as a subtraction, are one declaration node either way, and the difference lives in the compiler of the language rather than in what PostCSS hands over. What can be asked is whether a double slash opens a comment in that syntax — the very question {@link searchCopy} puts for itself in each of the walks below — and the two answers coincide: Sass and Less spell arithmetic of their own and comments of their own both, and plain CSS spells neither. A syntax the probe learns nothing about is answered yes here as it is there, which leaves the whitespace standing and costs a warning rather than a file.
		 *
		 * What this question cannot do is tell Sass from Less, and one place where those two differ is the plus: Less reads the whitespace in front of it as it reads the whitespace in front of a minus, and Sass reads a plus as an operator whatever whitespace stands beside it. So one reading answers for both syntaxes, and a plus behind a call is left alone under Sass as well, where closing it up would have been safe. That is a warning left unsaid, which is the side of the answer this whole question is decided on. A probe telling those two apart is there to be written — `postcss-less` reads `@a: 1;` as an at-rule it marks a variable and `postcss-scss` reads a plain one — so this is one reading chosen for two languages rather than a wall, and what it buys is a second question the plugin does not have to keep answering.
		 *
		 * The question is put to the node rather than to the file, since a page may hold a plain `<style>` beside a `<style lang="scss">` and each block carries the syntax that spelled it.
		 * @param {import('postcss').Node} node - The node whose text is being read.
		 * @returns {boolean} True where the syntax that spelled that node spells arithmetic of its own.
		 */
		function readsOwnArithmetic (node) {
			return readsInlineComments(node, result)
		}

		/**
		 * Checks a node for function whitespace after violations.
		 * @param {import('postcss').Node} node - The node to check.
		 * @param {string} value - The value to check.
		 * @param {string} searchString - The copy of that value {@link searchCopy} builds, which is as long as it and spells it character for character outside its comments.
		 * @param {number} nodeIndex - The index of the node.
		 * @param {(index: number) => void} fix - The fix function.
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
		 * @param {(index: number) => void} fix - The fix function.
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
				// The whitespace in front of a `+` or a `-` that stands as an operator belongs to the sum rather than to the call: it is what makes the sign one, so `a { b: calc(var(--x) + 1px); }` closed up is a calculation no browser reads and a declaration it drops. Which signs stand as operators is what the syntax says: CSS reads `-1px` as a single number token, so a sign opening a number is part of that number and the whitespace in front of it is the call's, while a syntax spelling arithmetic of its own reads that whitespace as the whole of what tells a list of two values from a subtraction
				if ((readsOwnArithmetic(node) ? LEADING_SPACED_SIGN : LEADING_SPACED_SUM_OPERATOR).test(searchString.slice(index))) return

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

			check(atRule, param, searchString, atRuleParamIndex(atRule), fixer.applyFix)

			if (fixer.hasFixed) setAtRuleParams(atRule, fixer.fixed)
		})
		root.walkDecls((decl) => {
			let value = getDeclarationValue(decl)
			let { searchString } = searchCopy(value, decl, result)
			let fixer = createFixer(value)

			check(decl, value, searchString, declarationValueIndex(decl), fixer.applyFix)

			if (fixer.hasFixed) setDeclarationValue(decl, fixer.fixed)
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
