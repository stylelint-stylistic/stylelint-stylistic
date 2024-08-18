import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import declarationBangSpaceChecker from "../../utils/declarationBangSpaceChecker.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `declaration-bang-space-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after "!"`,
	rejectedAfter: () => `Unexpected whitespace after "!"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
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
			fix: (decl, index) => {
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
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
