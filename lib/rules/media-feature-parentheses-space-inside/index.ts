import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint from "stylelint"

import { MEDIA_AT_RULE, SPACE_OR_TAB } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { addEdit, applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findCommentSpanAt, findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `media-feature-parentheses-space-inside`

const MESSAGES = defineMessages({
	expectedOpening: `Expected single space after "("`,
	rejectedOpening: `Unexpected whitespace after "("`,
	expectedClosing: `Expected single space before ")"`,
	rejectedClosing: `Unexpected whitespace before ")"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * The edit writing the whitespace behind a media feature's `(`, counted in the params.
 * @param node - The media feature.
 * @param text - The whitespace.
 * @returns The edit.
 */
function openingEdit (node: FunctionNode, text: string): Edit {
	let start = node.sourceIndex + node.value.length + 1

	return { start, end: start + node.before.length, text }
}

/**
 * Where a media feature's `)` stands in the params; the fix writes in front of it, the warning a character in front.
 *
 * An unclosed feature ends on the params, where the stringifier prints a fix ([#131](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131)), by the params length since an unclosed `url()` inside overshoots the node's end by a character. A closed one ends on its `)`, not its printed length, since `/*\/` prints as `/**\/` ([#506](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/506)).
 * @param node - The media feature.
 * @param params - The at-rule's params the feature was parsed out of.
 * @returns The index of the `)`, or the end of the params.
 */
function closingParenthesisIndex (node: FunctionNode, params: string): number {
	return node.unclosed ? params.length : node.sourceEndIndex - 1
}

/**
 * The edit writing the whitespace in front of a media feature's `)`.
 * @param node - The media feature.
 * @param text - The whitespace.
 * @param params - The at-rule's params the edit is placed in.
 * @returns The edit.
 */
function closingEdit (node: FunctionNode, text: string, params: string): Edit {
	let end = closingParenthesisIndex(node, params)

	return { start: end - node.after.length, end, text }
}

/** `always` a single space inside the parentheses, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires a single space or disallows whitespace inside the parentheses of media features.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
			let params = syntax.read(atRule)
			let indexBoost = atRuleParamIndex(atRule)
			// In CSS `myurl(//a)` is code
			let reading = syntax.inlineComments(atRule, result)
			// The value parser would open a feature on a `(` in a `//` comment or behind `/*/` (#378)
			let comments = syntax.commentSpans(params, atRule, result)

			let problems: Array<{
				message: string,
				index: number,
				fix?: () => void,
			}> = []

			// Edits at positions, since the value parser prints `/*/` as `/**/`; an unclosed feature under `always` writes both halves at one index, which `addEdit` folds
			let edits: Edit[] = []

			// Quotes in comments are masked (#508)
			valueParser(hideQuotesInComments(params, comments)).walk((node) => {
				// A comment's `(` is its own; an unclosed comment holds the rest of the query, so the walk goes on inside
				if (findCommentSpanHolding(node, comments)) return

				if (node.type === `function`) {
					// The `)` the parser closed the feature on may be one the file writes inside a comment: it knows nothing of a `//` comment and closes a `/*\/` one on its own star, so either kind can hand it a parenthesis of a comment's text and the fixes then write inside that text ([#347](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/347)). The whole feature goes, as it does in both `function-parentheses-*-inside` rules, the parenthesis the file does spell being one the parser never returned. Behind `unclosed`, since such a node's end index is not its own `)` but a nested call's or one past the text, and what a fix writes at the end of its params is #575.
					if (!node.unclosed && findCommentSpanAt(node.sourceEndIndex - 1, comments)) return

					let closingIndex = closingParenthesisIndex(node, params) - 1
					// A closed pair holding no node encloses one run of what the value parser calls whitespace, every C0 control included, and it hands that run back whole as `before` and never as `after`: the closing question is the opening one, and asking it again reported a half the opening fix had settled and wrote another space every run ([#329](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/329)). An unclosed feature has no pair, and what a fix writes at the end of its params is [#575](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/575). Under `never` no guard is wanted, since an empty `after` is whitespace to nobody.
					let enclosesOneRun = !node.unclosed && node.nodes.length === 0

					if (primary === `never`) {
						if (SPACE_OR_TAB.test(node.before)) {
							problems.push({
								message: messages.rejectedOpening,
								index: node.sourceIndex + 1 + indexBoost,
								fix () { addEdit(edits, openingEdit(node, ``)) },
							})
						}

						if (SPACE_OR_TAB.test(node.after)) {
							// The fix would take the `)` into a `//` comment
							let isFixable = !syntax.endsWithInlineComment(params.slice(0, node.sourceEndIndex - 1 - node.after.length), reading)

							problems.push({
								message: messages.rejectedClosing,
								index: closingIndex + indexBoost,
								...(isFixable && { fix: (): void => { addEdit(edits, closingEdit(node, ``, params)) } }),
							})
						}
					}
					else if (primary === `always`) {
						if (node.before === ``) {
							problems.push({
								message: messages.expectedOpening,
								index: node.sourceIndex + 1 + indexBoost,
								fix () { addEdit(edits, openingEdit(node, ` `)) },
							})
						}

						if (node.after === `` && !enclosesOneRun) {
							problems.push({
								message: messages.expectedClosing,
								index: closingIndex + indexBoost,
								fix () { addEdit(edits, closingEdit(node, ` `, params)) },
							})
						}
					}
				}
			})

			if (problems.length > 0) {
				for (let err of problems) {
					report({
						message: err.message,
						node: atRule,
						index: err.index,
						endIndex: err.index,
						result,
						ruleName,
						...(err.fix && { fix: err.fix }),
					})
				}

				if (edits.length > 0) syntax.write(atRule, applyEditsFromEnd(params, edits))
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
