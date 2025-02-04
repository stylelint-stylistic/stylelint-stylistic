import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import beforeBlockString from "../../utils/beforeBlockString.js"
import blockString from "../../utils/blockString.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import hasBlock from "../../utils/hasBlock.js"
import hasEmptyBlock from "../../utils/hasEmptyBlock.js"
import optionsMatches from "../../utils/optionsMatches.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-opening-brace-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after "{"`,
	rejectedAfter: () => `Unexpected whitespace after "{"`,
	expectedAfterSingleLine: () => `Expected single space after "{" of a single-line block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "{" of a single-line block`,
	expectedAfterMultiLine: () => `Expected single space after "{" of a multi-line block`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "{" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary, secondaryOptions) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [
					`always`,
					`never`,
					`always-single-line`,
					`never-single-line`,
					`always-multi-line`,
					`never-multi-line`,
				],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignore: [`at-rules`],
				},
				optional: true,
			},
		)

		if (!validOptions) {
			return
		}

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check)

		if (!optionsMatches(secondaryOptions, `ignore`, `at-rules`)) {
			root.walkAtRules(check)
		}

		/**
		 * @param {import('postcss').Rule | import('postcss').AtRule} statement
		 */
		function check (statement) {
			// Return early if blockless or has an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) {
				return
			}

			const problemIndex = beforeBlockString(statement, { noRawBefore: true }).length + 1

			checker.after({
				source: blockString(statement),
				index: 0,
				err: (m) => {
					report({
						message: m,
						node: statement,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix () {
							let statementFirst = statement.first

							if (statementFirst === null) return

							if (primary.startsWith(`always`)) {
								statementFirst.raws.before = ` `
							} else if (primary.startsWith(`never`)) {
								statementFirst.raws.before = ``
							}
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
