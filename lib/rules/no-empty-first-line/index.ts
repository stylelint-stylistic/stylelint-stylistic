import stylelint from "stylelint"

import { EVERY_LINE_BREAK, OPENS_WITH_LINE_BREAK } from "../../regexps.ts"
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
 * Takes the empty lines a file opens with off the raw the head of that file stands in.
 * @param raw - The raw as it stands at the fix's turn, which a rule listed ahead may already have written into.
 * @param lines - How many line breaks the run the file opens with holds.
 * @returns The raw with that many of its leading breaks, and the whitespace between them, gone.
 */
function takeOpeningLines (raw: string, lines: number): string {
	// The warning is about the run the file opens with, so that run is what comes off — never everything the raw opens with, which `no-extra-semicolons`, listed ahead, has already joined the break behind the semicolon to (#632). Where the raw opens with fewer breaks than the file, all of them come off, and where it opens with none nothing does: whatever whitespace stands there is the first line's indentation rather than an empty line.
	let opening = OPENS_WITH_LINE_BREAK.exec(raw)?.[0] ?? ``
	let breaks = [...opening.matchAll(EVERY_LINE_BREAK)]
	let last = breaks[lines - 1]

	return raw.slice(last ? last.index + last[0].length : opening.length)
}

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/**
 * Disallows empty first lines.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		let source: EmbeddedSource | undefined = root.source

		if (!validOptions || source?.inline || source?.lang === `object-literal`) return

		let rootString = (root.source && root.source.input.css) || ``

		if (!rootString.trim()) return

		let opening = OPENS_WITH_LINE_BREAK.exec(rootString)

		if (opening) {
			let lines = [...opening[0].matchAll(EVERY_LINE_BREAK)].length

			report({
				message: messages.rejected,
				node: root,
				result,
				ruleName,
				fix () {
					let { first } = root

					// A root with no node keeps the file in `raws.after`; asking the first node for the break ended the lint in an error (#602)
					if (first === undefined) {
						if (root.raws.after === undefined) throw new Error(`The root node must keep the file in its trailing raw.`)

						root.raws.after = takeOpeningLines(root.raws.after, lines)

						return
					}

					if (first.raws.before === undefined) throw new Error(`The first node must have spaces before.`)

					first.raws.before = takeOpeningLines(first.raws.before, lines)
				},
			})
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
