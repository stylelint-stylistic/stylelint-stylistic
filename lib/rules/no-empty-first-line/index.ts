import stylelint from "stylelint"

import { OPENS_WITH_LINE_BREAK } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import type { EmbeddedSource } from "../../utils/typeGuards/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `no-empty-first-line`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	rejected: `Unexpected empty line`,
})

let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Disallows empty first lines.
 * @param primary - The primary option, which is `true`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: true): RuleCheck {
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
					if (root.first === undefined) throw new Error(`The root node must have the first node.`)

					if (root.first.raws.before === undefined) throw new Error(`The first node must have spaces before.`)

					root.first.raws.before = root.first.raws.before.replace(OPENS_WITH_LINE_BREAK, ``)
				},
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
