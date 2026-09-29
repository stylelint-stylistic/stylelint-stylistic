import stylelint from "stylelint"

import { EVERY_LINE_BREAK, OPENS_WITH_LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { straySemicolonsTaken, straySemicolonsTakenBefore, writtenAsLeft } from "../../utils/straySemicolonsTaken/index.ts"
import { openingLineBreaks } from "../../utils/takesTheOpeningLines/index.ts"

let { utils: { validateOptions } } = stylelint

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
 * @param hostBreaks - How many breaks in front of them end a line of the host code, which stay: one where the text opens on such a line, none otherwise.
 * @returns The raw with that many of its leading breaks, and the whitespace between them, gone.
 */
function takeOpeningLines (raw: string, lines: number, hostBreaks: number): string {
	// The warning is about the run the file opens with, so that run is what comes off — never everything the raw opens with, which `no-extra-semicolons`, listed ahead, has already joined the break behind the semicolon to. Where the raw opens with fewer breaks than the file, all but the host's come off, and where it opens with none beyond the host's nothing does: whatever whitespace stands there is the first line's indentation rather than an empty line.
	let opening = OPENS_WITH_LINE_BREAK.exec(raw)?.[0] ?? ``
	let breaks = [...opening.matchAll(EVERY_LINE_BREAK)]
	let kept = breaks[hostBreaks - 1]
	let last = breaks[hostBreaks + lines - 1]

	return raw.slice(0, kept ? kept.index + kept[0].length : 0) + raw.slice(last ? last.index + last[0].length : opening.length)
}

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/**
 * Disallows empty first lines.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax, which says whether the text opens on a line of the host code.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) return

		let lines = openingLineBreaks(root, result, syntax)

		if (lines > 0) {
			// The break ending the host's line stays where the text opens on one
			let hostBreaks = syntax.hostLineEdges(root).opens ? 1 : 0

			report({
				message: messages.rejected,
				node: root,
				result,
				ruleName,
				fix () {
					let { first } = root

					// A root with no node keeps the file in `raws.after`; asking the first node for the break ended the lint in an error
					if (first === undefined) {
						if (root.raws.after === undefined) throw new Error(`The root node must keep the file in its trailing raw.`)

						root.raws.after = writtenAsLeft((run) => takeOpeningLines(run, lines, hostBreaks), root.raws.after, straySemicolonsTaken(root, result))

						return
					}

					if (first.raws.before === undefined) throw new Error(`The first node must have spaces before.`)

					// A stray semicolon a neighbor takes out stays for it to take
					first.raws.before = writtenAsLeft((run) => takeOpeningLines(run, lines, hostBreaks), first.raws.before, straySemicolonsTakenBefore(first, result))
				},
			})
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
