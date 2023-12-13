import stylelint from "stylelint"

import declarationColonSpaceChecker from "../../utils/declarationColonSpaceChecker.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

export const ruleName = `declaration-colon-space-before`

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ":"`,
	rejectedBefore: () => `Unexpected whitespace before ":"`,
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

		declarationColonSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			fix: context.fix ? (decl, index) => {
				const colonIndex = index - declarationValueIndex(decl)
				const between = decl.raws.between

				if (between === null) {throw new Error(`\`between\` must be present`)}

				if (primary === `always`) {
					decl.raws.between = between.slice(0, colonIndex).replace(/\s*$/, ` `) + between.slice(colonIndex)

					return true
				}

				if (primary === `never`) {
					decl.raws.between = between.slice(0, colonIndex).replace(/\s*$/, ``) + between.slice(colonIndex)

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
