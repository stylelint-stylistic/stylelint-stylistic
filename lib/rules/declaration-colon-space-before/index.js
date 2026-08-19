import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationColonSpaceChecker } from "../../utils/declarationColonSpaceChecker/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-colon-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ":"`,
	rejectedBefore: () => `Unexpected whitespace before ":"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Gets everything the declaration's `between` holds in front of the colon.
 * @param {import('postcss').Declaration} decl - The declaration to look at.
 * @param {number} index - The index of the colon within the checked string.
 * @returns {string} The part of `between` in front of the colon.
 */
function beforeColonString (decl, index) {
	let between = decl.raws.between

	if (between === null) throw new Error(`\`between\` must be present`)

	return between.slice(0, index - declarationValueIndex(decl))
}

/**
 * Requires a single space or disallows whitespace before the colon of declarations.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		declarationColonSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The colon stands right after this part, so an inline comment ending it would swallow the colon
			isFixable: (decl, index) => !endsWithInlineComment(beforeColonString(decl, index), readsInlineComments(decl, result)),
			fix: (decl, index) => {
				let beforeColon = beforeColonString(decl, index)
				let fromColon = decl.raws.between.slice(beforeColon.length)

				if (primary === `always`) {
					decl.raws.between = beforeColon.replace(/\s*$/u, ` `) + fromColon

					return true
				}

				if (primary === `never`) {
					decl.raws.between = beforeColon.replace(/\s*$/u, ``) + fromColon

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
