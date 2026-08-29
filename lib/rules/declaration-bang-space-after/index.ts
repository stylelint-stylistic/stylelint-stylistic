import stylelint from "stylelint"

import { LEADING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { declarationBangSpaceChecker } from "../../utils/declarationBangSpaceChecker/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

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
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never`): RuleCheck {
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
