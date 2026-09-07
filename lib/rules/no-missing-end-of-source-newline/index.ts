import stylelint from "stylelint"

import { TRAILING_LINE_BREAK, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import type { EmbeddedSource } from "../../utils/typeGuards/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `no-missing-end-of-source-newline`

const MESSAGES = defineMessages({
	rejected: `Unexpected missing end-of-source newline`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/**
 * Disallows missing end-of-source newlines.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param _secondaryOptions - Unused.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, _secondaryOptions: unknown): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) return

		if (root.source === undefined) throw new Error(`The root node must have a source property`)

		let source: EmbeddedSource = root.source

		if (source.inline || source.lang === `object-literal`) return

		let rootString = root.source.input.css

		if (!rootString.trim() || TRAILING_LINE_BREAK.test(rootString)) return

		let problemIndex = rootString.length - 1

		report({
			message: messages.rejected,
			node: root,
			index: problemIndex,
			endIndex: problemIndex,
			result,
			ruleName,
			fix () {
				// The break goes behind the raw, not in place of it: a free semicolon PostCSS parks there is `no-extra-semicolons`' to take, and the empty lines a file ends on are `max-empty-lines`'.
				//
				// A run of spaces and tabs alone behind the file's last break comes off instead: the check reports it although the break is there, and a second break would leave an empty line, setting this rule against `no-eol-whitespace` in one order. Behind anything else the run stays, since it is `no-eol-whitespace`'s.
				//
				// The run comes off only where the raw and the file agree it ends the file. The raw is the only place to write: behind a `//` comment a bare carriage return or form feed is the comment's text and the raw is empty. The file is what the warning was about: `no-extra-semicolons` listed ahead has already taken the semicolon out of the raw, which then ends on a break while the file ends on the semicolon. Asked of both, the fix ends the same way on either side of those rules; beside `linebreaks` the order still decides (#352).
				let after = typeof root.raws.after === `string` ? root.raws.after : ``
				let ended = after.replace(TRAILING_SPACES_AND_TABS, ``)
				let endedInFile = rootString.replace(TRAILING_SPACES_AND_TABS, ``)
				let endsTheLine = TRAILING_LINE_BREAK.test(ended) && TRAILING_LINE_BREAK.test(endedInFile)

				// The break is the one `linebreaks` asks for, or the file's own
				root.raws.after = endsTheLine ? ended : after + getLineBreak(syntax, root, result)
			},
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
