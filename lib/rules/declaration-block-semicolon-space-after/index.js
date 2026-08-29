import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { blockString } from "../../utils/blockString/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.js"
import { isLastDeclarationWithoutSemicolon } from "../../utils/isLastDeclarationWithoutSemicolon/index.js"
import { nodeString } from "../../utils/nodeString/index.js"
import { rawNodeString } from "../../utils/rawNodeString/index.js"
import { isAtRule, isRule } from "../../utils/typeGuards/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ";"`,
	rejectedAfter: () => `Unexpected whitespace after ";"`,
	expectedAfterSingleLine: () => `Expected single space after ";" in a single-line declaration block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after ";" in a single-line declaration block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace after the semicolons of declaration blocks.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			let parentRule = decl.parent

			if (!parentRule) throw new Error(`A parent node must be present`)

			if (!isAtRule(parentRule) && !isRule(parentRule) && !isInlineStyleAttribute(parentRule)) return

			if (isLastDeclarationWithoutSemicolon(decl)) return

			let nextDecl = decl.next()

			if (!nextDecl) return

			let problemIndex = nodeString(decl, result).length + 1

			checker.after({
				source: rawNodeString(nextDecl, result),
				index: -1,
				lineCheckStr: blockString(parentRule, result),
				err: (m) => {
					report({
						message: m,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix () {
							if (primary.startsWith(`always`)) {
								nextDecl.raws.before = ` `

								return
							}

							if (primary.startsWith(`never`)) nextDecl.raws.before = ``
						},
					})
				},
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
