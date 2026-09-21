import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../../utils/isLastNodeWithoutSemicolon/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFrontOf } from "../../utils/runInFrontOf/index.ts"
import { semicolonClosedDeclarations } from "../../utils/semicolonClosedDeclarations/index.ts"
import { isAtRule, isComment, isRule } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { runBehind, writesTwinRun } from "../../utils/writesTwinRun/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-space-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected single space after ";"`,
	rejectedAfter: () => `Unexpected whitespace after ";"`,
	expectedAfterSingleLine: () => `Expected single space after ";" in a single-line declaration block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after ";" in a single-line declaration block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space after the semicolon, `never` no whitespace; the `-single-line` forms in a single-line declaration block only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/**
 * Requires a single space or disallows whitespace after the semicolons of declaration blocks.
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
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			let parentRule = decl.parent

			if (!parentRule) throw new Error(`A parent node must be present`)

			if (!isAtRule(parentRule) && !isRule(parentRule) && !isInlineStyleAttribute(parentRule)) return

			if (isLastNodeWithoutSemicolon(decl)) return

			let nextDecl = decl.next()

			if (!nextDecl) return

			// The narrowing does not reach into the function below
			let [block, next] = [parentRule, nextDecl]
			let problemIndex = nodeString(decl, result).length + 1

			/**
			 * Asks whether this rule writes the run, which the break twin reads and writes too (1789508663): the whitespace opening the next node's raw, which a stray semicolon in that raw ends.
			 * @returns True where it does.
			 */
			function writesTheRun (): boolean {
				return writesTwinRun(shortName, ruleName, decl, result, {
					side: `after`,
					run: runBehind(runInFrontOf(next), -1),
					lineText: blockString(block, result),
					// The fix writes over the whole raw, a stray semicolon and the breaks behind one included, so the block's lines are counted without it
					runs: () => semicolonClosedDeclarations(block).flatMap((each) => {
						let node = each.next()

						return node ? [runInFrontOf(node)] : []
					}),
					line: decl.rangeBy({ index: problemIndex }).start.line,
					// The twin reads past a comment, and its `never-multi-line` takes no break that closes a `//` comment
					twinWrites: (twinOption) => !isComment(next) && (twinOption.startsWith(`always`) || !syntax.writesIntoInlineComment(decl, result, `;`)),
				})
			}

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
						...(writesTheRun() && {
							fix: (): void => {
								if (primary.startsWith(`always`)) {
									nextDecl.raws.before = ` `

									return
								}

								if (primary.startsWith(`never`)) nextDecl.raws.before = ``
							},
						}),
					})
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
