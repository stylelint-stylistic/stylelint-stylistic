import stylelint from "stylelint"

import declarationColonSpaceChecker from "../../utils/declarationColonSpaceChecker.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `declaration-colon-space-before`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ":"`,
	rejectedBefore: () => `Unexpected whitespace before ":"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
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
