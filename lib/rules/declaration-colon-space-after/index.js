import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationColonSpaceChecker } from "../../utils/declarationColonSpaceChecker/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isCustomProperty } from "../../utils/isCustomProperty/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

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

/**
 * Requires a single space or disallows whitespace after the colon of declarations.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`],
		})

		if (!validOptions) return

		declarationColonSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: (decl, index) => {
				let colonIndex = index - declarationValueIndex(decl)
				let between = decl.raws.between

				if (between === null) throw new Error(`\`between\` must be present`)

				// For custom properties whose value holds a comment, PostCSS stores that value in `decl.raws.value`, and the whitespace after the colon goes there with it, leaving `between` to end at the colon.
				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/109
				let isSpaceInValue = isCustomProperty(decl.prop) && Boolean(decl.raws.value) && between.slice(colonIndex) === `:`
				let space = primary === `never` ? `` : ` `

				if (isSpaceInValue) {
					// PostCSS holds such a value twice: as the raw text, and as `decl.value`, the same text with its comments taken out. The raw one is stringified only while the two still stand for each other, so both lose the whitespace together.
					let rawValue = decl.raws.value

					setDeclarationValue(decl, `${space}${getDeclarationValue(decl).replace(/^\s*/u, ``)}`)
					rawValue.value = `${space}${rawValue.value.replace(/^\s*/u, ``)}`
					decl.value = rawValue.value
				}
				else {
					decl.raws.between = between.slice(0, colonIndex) + between.slice(colonIndex).replace(/^:\s*/u, `:${space}`)
				}

				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
				if (isCustomProperty(decl.prop) && (/^\s*$/u).test(getDeclarationValue(decl))) {
					setDeclarationValue(decl, ``)
				}

				return true
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
