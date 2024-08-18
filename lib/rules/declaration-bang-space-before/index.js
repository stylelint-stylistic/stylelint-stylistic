import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import declarationBangSpaceChecker from "../../utils/declarationBangSpaceChecker.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `declaration-bang-space-before`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before "!"`,
	rejectedBefore: () => `Unexpected whitespace before "!"`,
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
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			fix: (decl, index) => {
				let bangIndex = index - declarationValueIndex(decl)
				const value = getDeclarationValue(decl)
				let target

				/** @type {(val: string) => void} */
				let setFixed

				if (bangIndex < value.length) {
					target = value
					setFixed = (val) => {
						setDeclarationValue(decl, val)
					}
				} else if (decl.important) {
					target = decl.raws.important || ` !important`
					bangIndex -= value.length
					setFixed = (val) => {
						decl.raws.important = val
					}
				} else {
					return false // not standard
				}

				const targetBefore = target.slice(0, bangIndex)
				const targetAfter = target.slice(bangIndex)

				if (primary === `always`) {
					setFixed(`${targetBefore.replace(/\s*$/, ``)} ${targetAfter}`)

					return true
				}

				if (primary === `never`) {
					setFixed(targetBefore.replace(/\s*$/, ``) + targetAfter)

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
