import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorAttributeOperatorSpaceChecker } from "../../utils/selectorAttributeOperatorSpaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `selector-attribute-operator-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: (operator) => `Expected single space before "${operator}"`,
	rejectedBefore: (operator) => `Unexpected whitespace before "${operator}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace before operators within attribute selectors.
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

		selectorAttributeOperatorSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			checkBeforeOperator: true,
			fix: (attributeNode) => {
				let rawAttr = attributeNode.raws.spaces && attributeNode.raws.spaces.attribute
				let rawAttrAfter = rawAttr && rawAttr.after

				let { attrAfter, setAttrAfter }: {
					attrAfter: string,
					setAttrAfter: (fixed: string) => void,
				} = rawAttr && rawAttrAfter
					? {
						attrAfter: rawAttrAfter,
						setAttrAfter (fixed) {
							rawAttr.after = fixed
						},
					}
					: {
						attrAfter: (attributeNode.spaces.attribute && attributeNode.spaces.attribute.after) || ``,
						setAttrAfter (fixed) {
							if (!attributeNode.spaces.attribute) attributeNode.spaces.attribute = {}

							attributeNode.spaces.attribute.after = fixed
						},
					}

				if (primary === `always`) {
					setAttrAfter(attrAfter.replace(TRAILING_WHITESPACE, ` `))

					return true
				}

				if (primary === `never`) {
					setAttrAfter(attrAfter.replace(TRAILING_WHITESPACE, ``))

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
