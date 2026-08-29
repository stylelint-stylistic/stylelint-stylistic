import { Input, rule as _rule, type RuleProps } from "postcss"
import stylelint from "stylelint"

import { CRLF, EVERY_LINE_BREAK, EVERY_LINE_WITH_BREAK, LINE_BREAK } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { getRuleSelector } from "../../utils/getRuleSelector/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { setRuleSelector } from "../../utils/setRuleSelector/index.ts"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.ts"

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
 * @param primary - The primary option, one of `unix` and `windows`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `unix` | `windows`): RuleCheck {
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
		function fix (): void {
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

				if (typeof node.raws.between === `string` && node.raws.between) node.raws.between = fixData(node.raws.between)

				if (node.raws.before) node.raws.before = fixData(node.raws.before)

				if (typeof node.raws.after === `string`) node.raws.after = fixData(node.raws.after)
			})

			if (typeof root.raws.after === `string`) root.raws.after = fixData(root.raws.after)
		}

		if (root.source === undefined) throw new Error(`The root node must have a source`)

		// Every line is read with the break that ends it, since the break is what the question is about; the last line ends in none, and is asked nothing
		let lines = root.source.input.css.match(EVERY_LINE_WITH_BREAK) ?? []

		for (let [i, line] of lines.entries()) {
			if (hasError(line)) {
				let lineNum = i + 1
				// The warning stands on the first character of the break: the carriage return of a pair the option refuses, or the line feed the option wanted a pair in front of
				let colNum = shouldHaveCR ? line.length : line.length - 1

				reportNewlineError(lineNum, colNum)
			}
		}

		/**
		 * Checks if a string has incorrect linebreak characters.
		 * @param dataToCheck - The string to check for linebreak errors.
		 * @returns True if the string has incorrect linebreaks, false otherwise.
		 */
		function hasError (dataToCheck: string): boolean {
			let hasNewlineToVerify = LINE_BREAK.test(dataToCheck)
			let hasCR = hasNewlineToVerify ? CRLF.test(dataToCheck) : false

			return hasNewlineToVerify && hasCR !== shouldHaveCR
		}

		/**
		 * Writes every line break of a text as the option asks for it.
		 *
		 * A break is respelled rather than taken apart and put back, so that a replacement never lands between the two characters of a Windows pair. A bare carriage return is no break to PostCSS and is left where it stands, as every other rule leaves it.
		 * @param data - The text to write the breaks of.
		 * @returns The text, with every break spelled as the option asks for it.
		 */
		function fixData (data: string): string {
			if (data) return data.replaceAll(EVERY_LINE_BREAK, shouldHaveCR ? `\r\n` : `\n`)

			return data
		}

		/**
		 * Reports a newline character error.
		 * @param line - The line number of the error.
		 * @param column - The column number of the error.
		 */
		function reportNewlineError (line: number, column: number): void {
			// A node made by hand is what lets a warning point at an empty line.
			let node = _rule({
				source: {
					start: { line, column, offset: 0 },
					input: new Input(``),
				},
			} as RuleProps)

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
