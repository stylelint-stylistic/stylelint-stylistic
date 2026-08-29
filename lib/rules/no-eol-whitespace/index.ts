import styleSearch from "style-search"
import stylelint from "stylelint"

import { EVERY_LINE_BREAK, LINE_BREAK, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { getRuleSelector } from "../../utils/getRuleSelector/index.ts"
import { isOnlyWhitespace } from "../../utils/isOnlyWhitespace/index.ts"
import { isStandardSyntaxComment } from "../../utils/isStandardSyntaxComment/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { setRuleSelector } from "../../utils/setRuleSelector/index.ts"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `no-eol-whitespace`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	rejected: `Unexpected whitespace at end of line`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

const WHITESPACES_TO_REJECT = new Set([` `, `\t`])

/** The character that ends a line, spelled out because the scanner below takes strings to look for and not a pattern — the one reading of a break in this file that {@link LINE_BREAK} cannot carry. The carriage return of a Windows pair stands in front of it, and is read as the break's by whoever looks back from the match. */
const LINE_BREAK_CHARACTERS = [`\n`]

/**
 * Fixes whitespace at the end of a string.
 * @param str - The string to fix.
 * @returns The fixed string.
 */
function fixString (str: string): string {
	return str.replace(TRAILING_SPACES_AND_TABS, ``)
}

/**
 * Finds where the line break nearest behind a place stands.
 * @param string - The text to look back through.
 * @param from - The index to look back from, that character included, the end of the text by default.
 * @returns The index of the break, or -1 where none stands in front of the place.
 */
function lastLineBreakIndex (string: string, from: number = string.length - 1): number {
	for (let index = Math.min(from, string.length - 1); index >= 0; index -= 1) if (LINE_BREAK.test(string.charAt(index))) return index

	return -1
}

/**
 * Finds the start index of EOL whitespace error.
 * @param lastEOLIndex - The last end-of-line index.
 * @param string - The source code string.
 * @param options - The options object.
 * @returns The error start index, or -1 if no error.
 */
function findErrorStartIndex (lastEOLIndex: number, string: string, options: { ignoreEmptyLines: boolean, isRootFirst: boolean }): number {
	let { ignoreEmptyLines, isRootFirst } = options

	let eolWhitespaceIndex = lastEOLIndex - 1

	// The carriage return of a Windows pair belongs to the break, so the line ends in front of it
	if (string.charAt(eolWhitespaceIndex) === `\r`) eolWhitespaceIndex -= 1

	// If the character before newline is not whitespace, ignore
	if (!WHITESPACES_TO_REJECT.has(string.charAt(eolWhitespaceIndex))) return -1

	if (ignoreEmptyLines) {
		// If there is only whitespace between the previous line break and this one, ignore
		let beforeNewlineIndex = lastLineBreakIndex(string, eolWhitespaceIndex)

		if (beforeNewlineIndex >= 0 || isRootFirst) {
			let line = string.slice(Math.max(0, beforeNewlineIndex), eolWhitespaceIndex)

			if (isOnlyWhitespace(line)) return -1
		}
	}

	return eolWhitespaceIndex
}

/**
 * Disallows end-of-line whitespace.
 * @param primary - The primary option, which is `true`.
 * @param secondaryOptions - The secondary options: `ignore`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: true, secondaryOptions: { ignore?: `empty-lines` | `empty-lines`[] }): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
			},
			{
				optional: true,
				actual: secondaryOptions,
				possible: {
					ignore: [`empty-lines`],
				},
			},
		)

		if (!validOptions) return

		let ignoreEmptyLines = optionsMatches(secondaryOptions, `ignore`, `empty-lines`)

		let rootString = (root.source && root.source.input.css) || ``

		/**
		 * Reports EOL whitespace violations from the specified index.
		 * @param index - The index to report from.
		 */
		function reportFromIndex (index: number): void {
			report({
				message: messages.rejected,
				node: root,
				index,
				endIndex: index,
				result,
				ruleName,
				fix,
			})
		}

		eachEolWhitespace(rootString, reportFromIndex, { isRootFirst: true })

		let errorIndex = findErrorStartIndex(rootString.length, rootString, {
			ignoreEmptyLines,
			isRootFirst: true,
		})

		if (errorIndex > -1) reportFromIndex(errorIndex)

		/**
		 * Iterate each whitespace at the end of each line of the given string.
		 * @param string - the source code string.
		 * @param callback - callback the whitespace index at the end of each line.
		 * @param options - `isRootFirst` marks the given string as the first token of the root, `isPlainText` marks it as text that is not CSS.
		 */
		function eachEolWhitespace (string: string, callback: (index: number) => void, options: { isRootFirst?: boolean, isPlainText?: boolean } = {}): void {
			let { isRootFirst = false, isPlainText = false } = options

			/**
			 * Reports the whitespace, if any, at the found line ending.
			 * @param startIndex - The index of the line ending.
			 */
			function handleEol (startIndex: number): void {
				let index = findErrorStartIndex(startIndex, string, {
					ignoreEmptyLines,
					isRootFirst,
				})

				if (index > -1) callback(index)
			}

			// A CSS-aware scanner must not be used on text that is not CSS.
			// Without the surrounding comment delimiters, an apostrophe in prose opens a string that is never closed, and every line ending after it is skipped.
			if (isPlainText) {
				for (let { index } of string.matchAll(EVERY_LINE_BREAK)) handleEol(index)

				return
			}

			styleSearch(
				{
					source: string,
					target: LINE_BREAK_CHARACTERS,
					comments: `check`,
				},
				(match) => {
					handleEol(match.startIndex)
				},
			)
		}

		/** Trims the end of every line of every text a node holds, taking each text where the syntax that spelled it keeps it. */
		function fix (): void {
			let isRootFirst = true

			root.walk((node) => {
				fixText(
					node.raws.before,
					(fixed) => {
						node.raws.before = fixed
					},
					{ isRootFirst },
				)
				isRootFirst = false

				if (isAtRule(node)) {
					fixText(node.raws.afterName, (fixed) => {
						node.raws.afterName = fixed
					})

					fixText(getAtRuleParams(node), (fixed) => {
						setAtRuleParams(node, fixed)
					})
				}

				// The whitespace this rule takes away may stand in the text of an inline comment the selector carries — `.a // c ` ends in a space the file holds and the raw hides two characters further along — so the selector is read and written through the pair, which works on the copy the file spells and refills the raw beside it.
				if (isRule(node)) {
					fixText(getRuleSelector(node), (fixed) => {
						setRuleSelector(node, fixed)
					})
				}

				if (isAtRule(node) || isRule(node) || isDeclaration(node)) {
					fixText(node.raws.between, (fixed) => {
						node.raws.between = fixed
					})
				}

				if (isDeclaration(node)) {
					fixText(getDeclarationValue(node), (fixed) => {
						setDeclarationValue(node, fixed)
					})
				}

				if (isComment(node)) {
					fixText(node.raws.left, (fixed) => {
						node.raws.left = fixed
					})

					if (isStandardSyntaxComment(node)) {
						fixText(node.raws.right, (fixed) => {
							node.raws.right = fixed
						})
					}
					else {
						// An inline comment ends on a line feed and on nothing else, so where a file ends on a bare carriage return or on a form feed that character stays in the raw behind the comment's text, with the whitespace this rule takes away in front of it. Trimming the end of that raw reaches the second, and only the walk over its lines reaches the first.
						fixText(node.raws.right, (fixed) => {
							node.raws.right = fixed
						})

						// The end of an inline comment is the end of whichever raw closes it. `raws.right` closes one that holds text, and a comment holding nothing but whitespace is filed as an empty text with every character of that whitespace in `raws.left` and nothing in the raw behind — by `postcss-scss` wherever such a comment stands, and by `postcss-less` where the file ends inside one — so there the end of the comment is the end of `raws.left`, and the trim has to land on it instead. The question is about the text and not about the raw: `// c` leaves `raws.right` empty too, and trimming `raws.left` there would close the comment up onto its own text.
						if (node.raws.right) node.raws.right = fixString(node.raws.right)
						else if (!node.text && node.raws.left) node.raws.left = fixString(node.raws.left)
					}

					// The comment body is prose, not CSS: postcss has already stripped its delimiters.
					fixText(
						node.text,
						(fixed) => {
							node.text = fixed
						},
						{ isPlainText: true },
					)
				}

				if (isAtRule(node) || isRule(node)) {
					fixText(node.raws.after, (fixed) => {
						node.raws.after = fixed
					})
				}
			})

			fixText(
				root.raws.after,
				(fixed) => {
					root.raws.after = fixed
				},
				{ isRootFirst },
			)

			if (typeof root.raws.after === `string`) {
				let lastEOL = lastLineBreakIndex(root.raws.after)

				if (lastEOL !== root.raws.after.length - 1) root.raws.after = root.raws.after.slice(0, lastEOL + 1) + fixString(root.raws.after.slice(lastEOL + 1))
			}
		}

		/**
		 * Fixes EOL whitespace in a text value.
		 * @param value - The value to fix.
		 * @param fixFn - The function to apply the fix.
		 * @param options - The scanning options, forwarded to `eachEolWhitespace`.
		 */
		function fixText (value: string | undefined, fixFn: (text: string) => void, options?: { isRootFirst?: boolean, isPlainText?: boolean }): void {
			if (!value) return

			let fixed = ``
			let lastIndex = 0

			eachEolWhitespace(
				value,
				(index) => {
					let newlineIndex = index + 1

					fixed += fixString(value.slice(lastIndex, newlineIndex))
					lastIndex = newlineIndex
				},
				options,
			)

			if (lastIndex) {
				fixed += value.slice(lastIndex)
				fixFn(fixed)
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
