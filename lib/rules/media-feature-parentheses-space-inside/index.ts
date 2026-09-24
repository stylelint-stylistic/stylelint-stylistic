import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint from "stylelint"

import { MEDIA_AT_RULE, SPACE_OR_TAB } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findCommentSpanAt, findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideParenthesesInUrlStrings } from "../../utils/hideParenthesesInUrlStrings/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import { quotesItsAddress } from "../../utils/quotesItsAddress/index.ts"
import { report } from "../../utils/report/index.ts"
import { editsRereadAnAddress } from "../../utils/rereadsAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { splitSpaceNodesAtWords } from "../../utils/splitSpaceNodesAtWords/index.ts"

let { utils: { validateOptions } } = stylelint

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
 * Where a media feature's `)` stands in the params; the fix writes in front of it, the warning a character in front. From the node's end, not its printed length, since `/*\/` prints as `/**\/`; an unclosed feature, whose end is no `)`, never gets here.
 * @param node - The media feature.
 * @returns The index of the `)`.
 */
function closingParenthesisIndex (node: FunctionNode): number {
	return node.sourceEndIndex - 1
}

/**
 * The edit writing the whitespace in front of a media feature's `)`.
 * @param node - The media feature.
 * @param text - The whitespace.
 * @returns The edit.
 */
function closingEdit (node: FunctionNode, text: string): Edit {
	let end = closingParenthesisIndex(node)

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
			// The value parser would open a feature on a `(` in a `//` comment or behind `/*/`
			let comments = syntax.commentSpans(params, atRule, result)

			let problems: Array<{
				message: string,
				index: number,
				fix?: () => void,
			}> = []

			// Edits at positions, since the value parser prints `/*/` as `/**/`; no two name one span, since a pair holding nothing has an empty `after` and an unclosed feature is passed over
			let edits: Edit[] = []

			// Quotes in comments are masked
			let parsedParams = valueParser(hideParenthesesInUrlStrings(hideQuotesInComments(params, comments), comments))

			// The value parser calls a control character such as a vertical tab whitespace where the tokenizer calls it a word, and both fixes rewrite a whole side
			splitSpaceNodesAtWords(parsedParams.nodes)

			parsedParams.walk((node, at, siblings) => {
				// A comment's `(` is its own; an unclosed comment holds the rest of the query, so the walk goes on inside
				if (findCommentSpanHolding(node, comments)) return

				// The parentheses of a call opening an address are no parentheses of the query, and the whitespace behind its `(` is what parts the parenthesis from the address, which is what a tokenizer reads one token by: taking it away hands a string's `)` the end of the address and makes text of a comment. Passed over, and the walk goes no further in where the address is bare, as it does in both `function-parentheses-*-inside` rules; the calls among a quoted address's arguments are walked.
				if (opensAnAddress(node, at, siblings)) return quotesItsAddress(node) ? undefined : false

				if (node.type === `function`) {
					// A feature the file never closes holds the rest of the params, since PostCSS reads an at-rule's params past every brace while a `(` is open, and its `after` is empty whatever stands there; a fix at its end wrote a space at the end of the file every run. The whole feature goes, as it does in both `function-parentheses-*-inside` rules, and the walk goes on inside, where a closed call ends on a `)` of its own.
					if (node.unclosed) return

					// The `)` the parser closed the feature on may be one the file writes inside a comment: it knows nothing of a `//` comment and closes a `/*\/` one on its own star, so either kind can hand it a parenthesis of a comment's text and the fixes then write inside that text. The whole feature goes, the parenthesis the file does spell being one the parser never returned.
					if (findCommentSpanAt(node.sourceEndIndex - 1, comments)) return

					let closingIndex = closingParenthesisIndex(node) - 1
					// A pair holding no node encloses one run of the tokenizer's whitespace, `splitSpaceNodesAtWords` having carried any other control character into a node, and the value parser hands that run back whole as `before` and never as `after`: the closing question is the opening one, and asking it again reported a half the opening fix had settled and wrote another space every run. Under `never` no guard is wanted, since an empty `after` is whitespace to nobody.
					let enclosesOneRun = node.nodes.length === 0
					// The walk reads every call of the params, and a name the compilers read as no address is one the tokenizer can still take a url token by: the run behind the `(` holds the character deciding that, so a write switching the reading is refused and the warning stands. The run in front of the `)` moves no such character.
					let openParenthesisIndex = node.sourceIndex + node.value.length

					if (primary === `never`) {
						if (SPACE_OR_TAB.test(node.before)) {
							let isFixable = !editsRereadAnAddress(params, openParenthesisIndex, [openingEdit(node, ``)], reading)

							problems.push({
								message: messages.rejectedOpening,
								index: node.sourceIndex + 1 + indexBoost,
								...(isFixable && { fix: (): void => { edits.push(openingEdit(node, ``)) } }),
							})
						}

						if (SPACE_OR_TAB.test(node.after)) {
							// The fix would take the `)` into a `//` comment
							let isFixable = !syntax.endsWithInlineComment(params.slice(0, node.sourceEndIndex - 1 - node.after.length), reading)

							problems.push({
								message: messages.rejectedClosing,
								index: closingIndex + indexBoost,
								...(isFixable && { fix: (): void => { edits.push(closingEdit(node, ``)) } }),
							})
						}
					}
					else if (primary === `always`) {
						if (node.before === ``) {
							let isFixable = !editsRereadAnAddress(params, openParenthesisIndex, [openingEdit(node, ` `)], reading)

							problems.push({
								message: messages.expectedOpening,
								index: node.sourceIndex + 1 + indexBoost,
								...(isFixable && { fix: (): void => { edits.push(openingEdit(node, ` `)) } }),
							})
						}

						if (node.after === `` && !enclosesOneRun) {
							problems.push({
								message: messages.expectedClosing,
								index: closingIndex + indexBoost,
								fix () { edits.push(closingEdit(node, ` `)) },
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
