import stylelint from "stylelint"

import blockString from "../../utils/blockString.js"
import hasBlock from "../../utils/hasBlock.js"
import optionsMatches from "../../utils/optionsMatches.js"
import rawNodeString from "../../utils/rawNodeString.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { isString } from "../../utils/validateTypes.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `block-closing-brace-newline-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after "}"`,
	expectedAfterSingleLine: () => `Expected newline after "}" of a single-line block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "}" of a single-line block`,
	expectedAfterMultiLine: () => `Expected newline after "}" of a multi-line block`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "}" of a multi-line block`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, secondaryOptions, context) => {
	const checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(
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

		if (!validOptions) {
			return
		}

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * @param {import('postcss').Rule | import('postcss').AtRule} statement
		 */
		function check (statement) {
			if (!hasBlock(statement)) {
				return
			}

			if (
				statement.type === `atrule` && optionsMatches(secondaryOptions, `ignoreAtRules`, statement.name)
			) {
				return
			}

			const nextNode = statement.next()

			if (!nextNode) {
				return
			}

			// Allow an end-of-line comment x spaces after the brace
			const nextNodeIsSingleLineComment = nextNode.type === `comment` && !/[^ ]/.test(nextNode.raws.before || ``) && !nextNode.toString().includes(`\n`)

			const nodeToCheck = nextNodeIsSingleLineComment ? nextNode.next() : nextNode

			if (!nodeToCheck) {
				return
			}

			let reportIndex = statement.toString().length
			let source = rawNodeString(nodeToCheck)

			// Skip a semicolon at the beginning, if any
			if (source && source.startsWith(`;`)) {
				source = source.slice(1)
				reportIndex++
			}

			// Only check one after, because there might be other
			// spaces handled by the indentation rule
			checker.afterOneOnly({
				source,
				index: -1,
				lineCheckStr: blockString(statement),
				err: (msg) => {
					if (context.fix) {
						const nodeToCheckRaws = nodeToCheck.raws

						if (typeof nodeToCheckRaws.before !== `string`) {return}

						if (primary.startsWith(`always`)) {
							const index = nodeToCheckRaws.before.search(/\r?\n/)

							nodeToCheckRaws.before = index >= 0 ? nodeToCheckRaws.before.slice(index) : context.newline + nodeToCheckRaws.before

							return
						}

						if (primary.startsWith(`never`)) {
							nodeToCheckRaws.before = ``

							return
						}
					}

					report({
						message: msg,
						node: statement,
						index: reportIndex,
						result,
						ruleName,
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
