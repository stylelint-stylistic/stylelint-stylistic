import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { isOnlyWhitespace } from "../../utils/isOnlyWhitespace/index.ts"
import { openingBraceTwinReadings } from "../../utils/openingBraceTwinReadings/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFrontOf } from "../../utils/runInFrontOf/index.ts"
import { isRule } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesTwinRun } from "../../utils/writesTwinRun/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-opening-brace-space-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected single space after "{"`,
	rejectedAfter: () => `Unexpected whitespace after "{"`,
	expectedAfterSingleLine: () => `Expected single space after "{" of a single-line block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "{" of a single-line block`,
	expectedAfterMultiLine: () => `Expected single space after "{" of a multi-line block`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "{" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space after the opening brace, `never` no whitespace; the `-single-line` and `-multi-line` forms in a block of that shape only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`

/** The secondary options. */
export type SecondaryOptions = {

	/** `at-rules` passes the opening brace of an at-rule over. */
	ignore?: `at-rules` | `at-rules`[],
}

/**
 * Requires or disallows whitespace after the opening brace of blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [
					`always`,
					`never`,
					`always-single-line`,
					`never-single-line`,
					`always-multi-line`,
					`never-multi-line`,
				],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignore: [`at-rules`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let readings = openingBraceTwinReadings(() => getLineBreak(root, result))

		root.walkRules(check)

		if (!optionsMatches(secondaryOptions, `ignore`, `at-rules`)) root.walkAtRules(check)

		/**
		 * Checks one statement.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let statementFirst = statement.first

			if (statementFirst === undefined) return

			let problemIndex = beforeBlockString(statement, result, { noRawBefore: true }).length + 1
			let run = runInFrontOf(statementFirst)
			// The break twin spells the run behind the brace, save where a comment opens the block: it then checks the run in front of the first node that is not one, and of this run its `never-multi-line` takes the breaks alone, which leaves the space or the nothing written here standing (#704)
			let isFixable = writesTwinRun(shortName, ruleName, statement, result, {
				side: `after`,
				run,
				lineText: blockString(statement, result),
				runs: () => [run],
				line: statement.rangeBy({ index: problemIndex }).start.line,
				twinWrites: (_twinOption, secondary) => !(isRule(statement) && optionsMatches(secondary, `ignore`, `rules`)) && statementFirst.type !== `comment`,
				// The twins spell one run between them, which a run holding a stray semicolon is not: each writes the whitespace in front of it and keeps the rest, so a write is judged by the run it leaves (1790006583)
				...(!isOnlyWhitespace(run) && { readings }),
			})

			checker.after({
				source: blockString(statement, result),
				index: 0,
				err: (m) => {
					report({
						message: m,
						node: statement,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						...(isFixable && {
							// The rule reads the characters right behind the brace, so the write spells the whitespace the run opens with and keeps what stands behind it: the parser files a stray semicolon standing in front of the first node in this run, and no option speaks of it (1790006582)
							fix: (): void => {
								statementFirst.raws.before = readings.space.writes(primary, runInFrontOf(statementFirst))
							},
						}),
					})
				},
			})
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
