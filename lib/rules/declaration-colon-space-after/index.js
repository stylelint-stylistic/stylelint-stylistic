import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import declarationColonSpaceChecker from "../../utils/declarationColonSpaceChecker.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-colon-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ":"`,
	rejectedAfter: () => `Unexpected whitespace after ":"`,
	expectedAfterSingleLine: () => `Expected single space after ":" with a single-line declaration`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`],
		})

		if (!validOptions) {
			return
		}

		declarationColonSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: (decl, index) => {
				let colonIndex = index - declarationValueIndex(decl)
				let between = decl.raws.between

				if (between === null) { throw new Error(`\`between\` must be present`) }

				if (primary.startsWith(`always`)) {
					decl.raws.between = between.slice(0, colonIndex) + between.slice(colonIndex).replace(/^:\s*/, `: `)

					return true
				}

				if (primary === `never`) {
					decl.raws.between = between.slice(0, colonIndex) + between.slice(colonIndex).replace(/^:\s*/, `:`)

					return true
				}

				return false
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
