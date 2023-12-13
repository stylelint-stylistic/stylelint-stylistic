import stylelint from "stylelint"

import declarationBangSpaceChecker from "../../utils/declarationBangSpaceChecker.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

export const ruleName = `declaration-bang-space-after`

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after "!"`,
	rejectedAfter: () => `Unexpected whitespace after "!"`,
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

		declarationBangSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: context.fix ? (decl, index) => {
				let bangIndex = index - declarationValueIndex(decl)
				const declValue = getDeclarationValue(decl)
				let target
				/** @type {(value: string) => void} */
				let setFixed

				if (bangIndex < declValue.length) {
					target = declValue
					setFixed = (value) => {
						setDeclarationValue(decl, value)
					}
				} else if (decl.important) {
					target = decl.raws.important || ` !important`
					bangIndex -= declValue.length
					setFixed = (value) => {
						decl.raws.important = value
					}
				} else {
					return false // not standard
				}

				const targetBefore = target.slice(0, bangIndex + 1)
				const targetAfter = target.slice(bangIndex + 1)

				if (primary === `always`) {
					setFixed(targetBefore + targetAfter.replace(/^\s*/, ` `))

					return true
				}

				if (primary === `never`) {
					setFixed(targetBefore + targetAfter.replace(/^\s*/, ``))

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
