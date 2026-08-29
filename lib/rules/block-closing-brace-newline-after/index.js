import stylelint from "stylelint"

import { LINE_BREAK, NON_SPACE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { blockString } from "../../utils/blockString/index.js"
import { getLineBreak } from "../../utils/getLineBreak/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { hasBlock } from "../../utils/hasBlock/index.js"
import { nodeString } from "../../utils/nodeString/index.js"
import { optionsMatches } from "../../utils/optionsMatches/index.js"
import { rawNodeString } from "../../utils/rawNodeString/index.js"
import { isString } from "../../utils/validateTypes/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-closing-brace-newline-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after "}"`,
	expectedAfterSingleLine: () => `Expected newline after "}" of a single-line block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "}" of a single-line block`,
	expectedAfterMultiLine: () => `Expected newline after "}" of a multi-line block`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "}" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace after the closing brace of blocks.
 * @type {import('stylelint').Rule}
 */
function rule (primary, secondaryOptions) {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [
					`always`,
					`always-single-line`,
					`never-single-line`,
					`always-multi-line`,
					`never-multi-line`,
				],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignoreAtRules: [isString],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement for closing brace newline after violations.
		 * @param {import('postcss').Rule | import('postcss').AtRule} statement - The rule or at-rule to check.
		 */
		function check (statement) {
			if (!hasBlock(statement)) return

			if (statement.type === `atrule` && optionsMatches(secondaryOptions, `ignoreAtRules`, statement.name)) return

			let nextNode = statement.next()

			if (!nextNode) return

			// Allow an end-of-line comment x spaces after the brace
			// A line break is what PostCSS reads as one: a line feed, with or without the carriage return of a Windows pair in front of it
			let nextNodeIsSingleLineComment = nextNode.type === `comment` && !NON_SPACE.test(nextNode.raws.before || ``) && !LINE_BREAK.test(nextNode.toString())

			let nodeToCheck = nextNodeIsSingleLineComment ? nextNode.next() : nextNode

			if (!nodeToCheck) return

			let reportIndex = nodeString(statement, result).length
			let source = rawNodeString(nodeToCheck, result)

			// Skip a semicolon at the beginning, if any
			if (source && source.startsWith(`;`)) {
				source = source.slice(1)
				reportIndex += 1
			}

			// Only check one after, because there might be other spaces handled by the indentation rule
			checker.afterOneOnly({
				source,
				index: -1,
				lineCheckStr: blockString(statement, result),
				err: (msg) => {
					report({
						message: msg,
						node: statement,
						index: reportIndex,
						endIndex: reportIndex,
						result,
						ruleName,
						fix () {
							let nodeToCheckRaws = nodeToCheck.raws

							if (typeof nodeToCheckRaws.before !== `string`) return

							if (primary.startsWith(`always`)) {
								// Trim up to the break that already stands there, whichever character it is, and add one only where none does
								let index = nodeToCheckRaws.before.search(LINE_BREAK)

								nodeToCheckRaws.before = index >= 0 ? nodeToCheckRaws.before.slice(index) : getLineBreak(root, result) + nodeToCheckRaws.before
							}
							else if (primary.startsWith(`never`)) nodeToCheckRaws.before = ``
						},
					})
				},
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
