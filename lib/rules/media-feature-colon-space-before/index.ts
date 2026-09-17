import type { AtRule } from "postcss"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { mediaFeatureColonSpaceChecker } from "../../utils/mediaFeatureColonSpaceChecker/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { runInFront } from "../../utils/writesTwinRun/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `media-feature-colon-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before ":"`,
	rejectedBefore: () => `Unexpected whitespace before ":"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space before the colon, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires a single space or disallows whitespace before the colon in media features.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		let fixData: Map<AtRule, [number, string][]> | undefined

		mediaFeatureColonSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The run is the check's, read over the copy with its escapes masked, so the space of `a\ :b` is not cut (1789657288)
			fix: (atRule, index, runString) => {
				let paramColonIndex = index - atRuleParamIndex(atRule)

				fixData = fixData || (new Map())

				let colons = fixData.get(atRule) || []

				colons.push([paramColonIndex, runInFront(runString, paramColonIndex)])
				fixData.set(atRule, colons)

				return true
			},
		})

		if (fixData) {
			for (let [atRule, colons] of fixData.entries()) {
				let params = syntax.read(atRule)

				for (let [index, run] of colons.toSorted(([a], [b]) => b - a)) {
					let beforeColon = params.slice(0, index - run.length)
					let afterColon = params.slice(index)

					params = beforeColon + (primary === `always` ? ` ` : ``) + afterColon
				}
				syntax.write(atRule, params)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
