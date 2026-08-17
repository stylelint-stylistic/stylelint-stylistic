import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.js"
import { findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `media-feature-parentheses-space-inside`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedOpening: `Expected single space after "("`,
	rejectedOpening: `Unexpected whitespace after "("`,
	expectedClosing: `Expected single space before ")"`,
	rejectedClosing: `Unexpected whitespace before ")"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkAtRules(/^media$/iu, (atRule) => {
			let params = (atRule.raws.params && atRule.raws.params.raw) || atRule.params
			let indexBoost = atRuleParamIndex(atRule)
			// A double slash opens a comment that runs to the end of its line, and `postcss-value-parser`
			// knows nothing of the kind: a parenthesis standing in the text of one opens a media feature
			// as far as that parser is concerned, and the fix then writes inside the comment
			let inlineComments = findInlineCommentSpans(params)

			/** @type {Array<{ message: string, index: number, fix: () => void }>} */
			let problems = []

			let parsedParams = valueParser(params).walk((node) => {
				// The parentheses of a comment are the comment's own. Everything they hold is still
				// walked, since a comment left open by one of them takes the rest of the query into
				// itself as far as the parser is concerned, features and all.
				if (inlineComments.some(({ start, end }) => node.sourceIndex >= start && node.sourceIndex < end)) return

				if (node.type === `function`) {
					let len = valueParser.stringify(node).length

					if (primary === `never`) {
						if ((/[ \t]/u).test(node.before)) {
							problems.push({
								message: messages.rejectedOpening,
								index: node.sourceIndex + 1 + indexBoost,
								fix () { node.before = `` },
							})
						}

						if ((/[ \t]/u).test(node.after)) {
							problems.push({
								message: messages.rejectedClosing,
								index: node.sourceIndex - 2 + len + indexBoost,
								fix () { node.after = `` },
							})
						}
					}
					else if (primary === `always`) {
						if (node.before === ``) {
							problems.push({
								message: messages.expectedOpening,
								index: node.sourceIndex + 1 + indexBoost,
								fix () { node.before = ` ` },
							})
						}

						if (node.after === ``) {
							problems.push({
								message: messages.expectedClosing,
								index: node.sourceIndex - 2 + len + indexBoost,
								fix () { node.after = ` ` },
							})
						}
					}
				}
			})

			if (problems.length > 0) {
				for (let err of problems) {
					report({
						message: err.message,
						node: atRule,
						index: err.index,
						endIndex: err.index,
						result,
						ruleName,
						fix: err.fix,
					})
				}

				if (problems.some((problem) => problem.fix)) atRule.params = parsedParams.toString()
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
