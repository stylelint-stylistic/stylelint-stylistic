import stylelint from "stylelint"

import selectorAttributeOperatorSpaceChecker from "../../utils/selectorAttributeOperatorSpaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

export const ruleName = `selector-attribute-operator-space-before`

export const messages = ruleMessages(ruleName, {
	expectedBefore: (operator) => `Expected single space before "${operator}"`,
	rejectedBefore: (operator) => `Unexpected whitespace before "${operator}"`,
})

export const meta = {
	url: `https://github.com/firefoxic/stylelint-codeguide/blob/main/lib/rules/${ruleName}/README.md`,
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) {
			return
		}

		selectorAttributeOperatorSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			checkBeforeOperator: true,
			fix: context.fix ? (attributeNode) => {
				const rawAttr = attributeNode.raws.spaces && attributeNode.raws.spaces.attribute
				const rawAttrAfter = rawAttr && rawAttr.after

				/** @type {{ attrAfter: string, setAttrAfter: (fixed: string) => void }} */
				const { attrAfter, setAttrAfter } = rawAttrAfter ? {
					attrAfter: rawAttrAfter,
					setAttrAfter (fixed) {
						rawAttr.after = fixed
					},
				} : {
					attrAfter:
								(attributeNode.spaces.attribute && attributeNode.spaces.attribute.after) || ``,
					setAttrAfter (fixed) {
						if (!attributeNode.spaces.attribute) {attributeNode.spaces.attribute = {}}

						attributeNode.spaces.attribute.after = fixed
					},
				}

				if (primary === `always`) {
					setAttrAfter(attrAfter.replace(/\s*$/, ` `))

					return true
				}

				if (primary === `never`) {
					setAttrAfter(attrAfter.replace(/\s*$/, ``))

					return true
				}

				return false
			} : null,
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
