import { Input, rule as _rule } from "postcss"
import stylelint from "stylelint"

import { CARRIAGE_RETURN, CR_OR_LF, EVERY_CR_OR_LF_BREAK } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { getRuleSelector } from "../../utils/getRuleSelector/index.js"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { setRuleSelector } from "../../utils/setRuleSelector/index.js"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `linebreaks`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (linebreak) => `Expected linebreak to be ${linebreak}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies unix or windows linebreaks.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`unix`, `windows`],
		})

		if (!validOptions) return

		let shouldHaveCR = primary === `windows`

		/**
		 * Rewrites the line breaks of the texts a node holds: its selector, its value, its at-rule parameters, the text of a comment, and every raw the node writes the whitespace of the file into save one. The one left standing is `raws.ownSemicolon`, the whitespace in front of a stray semicolon behind a nested block, and it is #372.
		 *
		 * A selector and a value alike are read and written through their pair rather than as a bare property, since PostCSS keeps the comments of one in `raws.selector.raw` and `raws.value.raw`, `postcss-scss` keeps the copy it prints in `raws.selector.scss` and `raws.value.scss`, and writing the property throws both away. The breaks a comment itself holds are rewritten along with the rest: a break inside a comment is a break of the file like any other. The text of a comment standing as a node of its own is written the same way, and reaches the file for a block comment under every syntax. For an end-of-line comment under `postcss-scss` it reaches nothing, that syntax keeping a `raws.text` beside the text and printing the raw; nothing is lost by it, since that syntax ends such a comment on a carriage return as readily as on a line feed and no break can stand in its text at all.
		 *
		 * A set of at-rule parameters is read and written through its own pair for the same reason, and for every at-rule rather than for the Less at-variable alone: the variable is the one at-rule that carries a third copy of its text, and `setAtRuleParams` keeps that one in step as well.
		 *
		 * The raws are written bare, since none of the four the walk reads past `raws.before` and `raws.after` is kept in a second copy by any syntax. Each is written only where the node holds it: `raws.afterName` belongs to an at-rule and `raws.important` to a declaration, and either is as often absent as not; `raws.left` and `raws.right` belong to a comment; `raws.between` is held by the three nodes that have two halves to part, and stands empty where the file writes nothing between them. Two of the four hold a character of code beside the whitespace — the colon of a declaration, and of a Less at-variable the colon lands in `raws.afterName` — which the respelling passes over untouched, reading breaks and nothing else. That was #283.
		 */
		function fix () {
			root.walk((node) => {
				if (isRule(node)) setRuleSelector(node, fixData(getRuleSelector(node)))

				if (isAtRule(node)) {
					setAtRuleParams(node, fixData(getAtRuleParams(node)))

					if (node.raws.afterName) node.raws.afterName = fixData(node.raws.afterName)
				}

				if (isDeclaration(node)) {
					setDeclarationValue(node, fixData(getDeclarationValue(node)))

					if (node.raws.important) node.raws.important = fixData(node.raws.important)
				}

				if (isComment(node)) {
					// The text of an end-of-line comment is written like any other, carriage return and all. `postcss-less` ends such a comment on a line feed alone and hands one the carriage returns behind it as text, but Less normalises the line endings of a file before parsing it, so that break closed the comment before the parser ever saw it; respelling it is what makes the printed file say what Less reads.
					node.text = fixData(node.text)

					if (node.raws.left) node.raws.left = fixData(node.raws.left)

					if (node.raws.right) node.raws.right = fixData(node.raws.right)
				}

				if (node.raws.between) node.raws.between = fixData(node.raws.between)

				if (node.raws.before) node.raws.before = fixData(node.raws.before)

				if (typeof node.raws.after === `string`) node.raws.after = fixData(node.raws.after)
			})

			if (typeof root.raws.after === `string`) root.raws.after = fixData(root.raws.after)
		}

		if (root.source === null) throw new Error(`The root node must have a source`)

		let lines = root.source.input.css.split(`\n`)

		for (let [i, line] of lines.entries()) {
			if (i < lines.length - 1 && !line.includes(`\r`)) line += `\n`

			if (hasError(line)) {
				let lineNum = i + 1
				let colNum = line.length

				reportNewlineError(lineNum, colNum)
			}
		}

		/**
		 * Checks if a string has incorrect linebreak characters.
		 * @param {string} dataToCheck - The string to check for linebreak errors.
		 * @returns {boolean} True if the string has incorrect linebreaks, false otherwise.
		 */
		function hasError (dataToCheck) {
			let hasNewlineToVerify = CR_OR_LF.test(dataToCheck)
			let hasCR = hasNewlineToVerify ? CARRIAGE_RETURN.test(dataToCheck) : false

			return hasNewlineToVerify && hasCR !== shouldHaveCR
		}

		/**
		 * Writes every line break of a text as the option asks for it.
		 *
		 * A break is respelled rather than taken apart and put back: deleting the carriage returns and then writing a pair in front of every line feed is right for a Windows pair, whose line feed carries the break through the first pass, and takes a bare carriage return away altogether, since there is no line feed behind it for the second pass to find. That is #293, and it left the fix joining two lines the rule had just reported as parted.
		 * @param {string} data - The text to write the breaks of.
		 * @returns {string} The text, with every break spelled as the option asks for it.
		 */
		function fixData (data) {
			if (data) return data.replaceAll(EVERY_CR_OR_LF_BREAK, shouldHaveCR ? `\r\n` : `\n`)

			return data
		}

		/**
		 * Reports a newline character error.
		 * @param {number} line - The line number of the error.
		 * @param {number} column - The column number of the error.
		 */
		function reportNewlineError (line, column) {
			// A node made by hand is what lets a warning point at an empty line.
			let node = _rule({
				source: {
					start: { line, column, offset: 0 },
					input: new Input(``),
				},
			})

			report({
				message: messages.expected,
				messageArgs: [primary],
				node,
				result,
				ruleName,
				fix,
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
