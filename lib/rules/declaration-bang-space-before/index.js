import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { declarationBangSpaceChecker } from "../../utils/declarationBangSpaceChecker/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { inlineCommentReading } from "../../utils/readsInlineComments/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-bang-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before "!"`,
	rejectedBefore: () => `Unexpected whitespace before "!"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace before the bang of declarations.
 * @type {import('stylelint').RuleBase<'always' | 'never'>}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		declarationBangSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The bang goes right after this text, and the whitespace run the fix cuts into ends it. Where an inline comment stands there, the line break that run begins with is what closes the comment, so either option would take the bang, and the semicolon behind it, into the comment's text: neither can be satisfied, so leave the code alone and let the warning stand
			isFixable: (decl, index) => !endsWithInlineComment(declarationString(decl).slice(0, index), inlineCommentReading(decl, result)),
			fix: (target) => {
				// The whitespace run in front of the bang is what either option writes over, and it is a run of the declaration as the file prints it rather than of the one text the bang stands in: where the bang opens that print, the run is empty and the write is an insertion
				let start = target.text.slice(0, target.index).replace(TRAILING_WHITESPACE, ``).length

				if (primary === `always`) return [{ start, end: target.index, text: ` ` }]

				if (primary === `never`) return [{ start, end: target.index, text: `` }]

				return []
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
