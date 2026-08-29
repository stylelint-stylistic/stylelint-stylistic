import stylelint from "stylelint"

import { LEADING_WHITESPACE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationBangSpaceChecker } from "../../utils/declarationBangSpaceChecker/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-bang-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after "!"`,
	rejectedAfter: () => `Unexpected whitespace after "!"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace after the bang of declarations.
 * @type {import('stylelint').RuleBase<'always' | 'never'>}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		declarationBangSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: (target) => {
				let start = target.index + 1
				// Where the whitespace run behind the bang ends, which is where the print picks up again: a bang the declaration ends on has no run behind it, and the write is an insertion
				let end = target.text.length - target.text.slice(start).replace(LEADING_WHITESPACE, ``).length

				if (primary === `always`) return [{ start, end, text: ` ` }]

				if (primary === `never`) return [{ start, end, text: `` }]

				return []
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
