import stylelint from "stylelint"

import { OPENS_WITH_LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import type { EmbeddedSource } from "../../utils/typeGuards/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `no-empty-first-line`

const MESSAGES = defineMessages({
	rejected: `Unexpected empty line`,
})

let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Disallows empty first lines.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param primary - The primary option, which is `true`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages }: RuleScope<typeof MESSAGES>, primary: true): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		let source: EmbeddedSource | undefined = root.source

		if (!validOptions || source?.inline || source?.lang === `object-literal`) return

		let rootString = (root.source && root.source.input.css) || ``

		if (!rootString.trim()) return

		if (OPENS_WITH_LINE_BREAK.test(rootString)) {
			report({
				message: messages.rejected,
				node: root,
				result,
				ruleName,
				fix () {
					let { first } = root

					// A root holding no node keeps the whole of the file in its trailing raw, and the break the file opens with at the head of that raw. A file of free semicolons and whitespace alone is that shape, since one of whitespace alone is passed over above; the break used to be asked of the first node, which such a root does not have, and the lint ended in an error rather than in a warning (#602)
					if (first === undefined) {
						if (root.raws.after === undefined) throw new Error(`The root node must keep the file in its trailing raw.`)

						root.raws.after = root.raws.after.replace(OPENS_WITH_LINE_BREAK, ``)

						return
					}

					if (first.raws.before === undefined) throw new Error(`The first node must have spaces before.`)

					first.raws.before = first.raws.before.replace(OPENS_WITH_LINE_BREAK, ``)
				},
			})
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
