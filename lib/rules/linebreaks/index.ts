import { Input, rule as _rule, type RuleProps } from "postcss"
import stylelint from "stylelint"

import { CRLF, EVERY_LINE_BREAK, EVERY_LINE_WITH_BREAK, LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `linebreaks`

const MESSAGES = defineMessages({
	expected: (linebreak) => `Expected linebreak to be ${linebreak}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies unix or windows linebreaks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `unix` or `windows`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `unix` | `windows`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`unix`, `windows`],
		})

		if (!validOptions) return

		let shouldHaveCR = primary === `windows`

		/**
		 * Rewrites the breaks of every text a node holds: selector, value or params, comment text, whitespace raws.
		 *
		 * A selector, value or params is written through the syntax, not as a bare property, since writing the property throws away the comment copy in `raws.selector.raw` and `raws.value.raw` and the printed `postcss-scss` copy in `raws.selector.scss` and `raws.value.scss`. A comment's text is written too; a `//` comment under `postcss-scss` prints `raws.text` instead and holds no break.
		 *
		 * The raws are written where the node holds them: `raws.afterName`, `raws.important`, `raws.left`, `raws.right`, `raws.between` ([#283](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/283)) and `raws.ownSemicolon` ([#372](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/372)); the code in them beside the whitespace is left alone. `raws.ownSemicolon` is written for a rule alone since `freeSemicolon` hands it to a rule alone; elsewhere the semicolon lands in the parent's `raws.after`, which the walk reads already.
		 */
		function fix (): void {
			root.walk((node) => {
				if (isRule(node)) {
					syntax.write(node, fixData(syntax.read(node)))

					if (node.raws.ownSemicolon) node.raws.ownSemicolon = fixData(node.raws.ownSemicolon)
				}

				if (isAtRule(node)) {
					syntax.write(node, fixData(syntax.read(node)))

					if (node.raws.afterName) node.raws.afterName = fixData(node.raws.afterName)
				}

				if (isDeclaration(node)) {
					syntax.write(node, fixData(syntax.read(node)))

					if (node.raws.important) node.raws.important = fixData(node.raws.important)
				}

				if (isComment(node)) {
					// A `//` comment's text is respelled too: `postcss-less` keeps a carriage return behind one as text, but Less normalises line endings first, so the printed file then says what Less reads.
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

		// Each line comes with its break; the last line has none and is skipped
		let lines = root.source.input.css.match(EVERY_LINE_WITH_BREAK) ?? []

		for (let [i, line] of lines.entries()) {
			if (hasError(line)) {
				let lineNum = i + 1
				// The warning stands on the first character of the break
				let colNum = shouldHaveCR ? line.length : line.length - 1

				reportNewlineError(lineNum, colNum)
			}
		}

		/**
		 * Checks whether a string's line breaks are not the option's.
		 * @param dataToCheck - The string.
		 * @returns True if a break is wrong.
		 */
		function hasError (dataToCheck: string): boolean {
			let hasNewlineToVerify = LINE_BREAK.test(dataToCheck)
			let hasCR = hasNewlineToVerify ? CRLF.test(dataToCheck) : false

			return hasNewlineToVerify && hasCR !== shouldHaveCR
		}

		/**
		 * Respells every break whole, so nothing lands inside a Windows pair; a bare carriage return is no break and stays.
		 * @param data - The text.
		 * @returns The text with the breaks respelled.
		 */
		function fixData (data: string): string {
			if (data) return data.replaceAll(EVERY_LINE_BREAK, shouldHaveCR ? `\r\n` : `\n`)

			return data
		}

		/**
		 * Reports a line break error.
		 * @param line - The line the break stands on.
		 * @param column - The column the break stands at.
		 */
		function reportNewlineError (line: number, column: number): void {
			// A hand-made node lets a warning point at an empty line
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

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
