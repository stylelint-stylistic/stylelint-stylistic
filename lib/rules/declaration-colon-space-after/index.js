import stylelint from "stylelint"

import { LEADING_COLON_AND_WHITESPACE, LEADING_WHITESPACE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationColonSpaceChecker } from "../../utils/declarationColonSpaceChecker/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { moveDeclarationValueHeadIntoBetween } from "../../utils/moveDeclarationValueHeadIntoBetween/index.js"
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
				let between = decl.raws.between

				// Where the colon stands inside `between`, rather than how far its end is from there: the move that may follow writes onto the end of `between`, and only a count from the start of it survives that
				let colonIndex = between.length + index - declarationValueIndex(decl)
				let space = primary === `never` ? `` : ` `

				// Where `between` ends at the colon, whatever run stands behind it stands at the head of the value instead, and there is no writing over it in place
				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/109
				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
				if (colonIndex === between.length - 1) moveDeclarationValueHeadIntoBetween(decl, getDeclarationValue(decl).match(LEADING_WHITESPACE)[0].length)

				let { raws } = decl

				raws.between = raws.between.slice(0, colonIndex) + raws.between.slice(colonIndex).replace(LEADING_COLON_AND_WHITESPACE, `:${space}`)

				return true
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
