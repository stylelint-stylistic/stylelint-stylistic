import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint from "stylelint"

import { MEDIA_AT_RULE, SPACE_OR_TAB } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { addEdit, applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.ts"
import { findInlineCommentSpanHolding, findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { inlineCommentReading } from "../../utils/readsInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `media-feature-parentheses-space-inside`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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
 * Names the span the whitespace behind a media feature's opening parenthesis stands in, and what goes there.
 *
 * The span is counted in the parameters the file spells, so that the fix is written where the whitespace stands rather than printed back as the whole query.
 * @param node - The media feature being fixed.
 * @param text - The whitespace to put there.
 * @returns The edit that writes it.
 */
function openingEdit (node: FunctionNode, text: string): Edit {
	let start = node.sourceIndex + node.value.length + 1

	return { start, end: start + node.before.length, text }
}

/**
 * Names the span the whitespace in front of a media feature's closing parenthesis stands in, and what goes there.
 *
 * A feature the file leaves unclosed carries no parenthesis to stand in front of: the parser hands out no whitespace of its own for one, and the stringifier prints what a fix puts there on the very end of the parameters. The span is named that end here, so that such a write stays where it has always been written — a query the parser has read this way is #131's, not this rule's.
 *
 * The end is the length of the parameters rather than the position the node reports. An unclosed feature reaches the end of the parameters by definition, so the two say the same thing — except where an unclosed `url()` stands inside one, which the parser ends a character past the text it was handed: `valueParser("g(url( abc")` gives the outer node `[0, 11)` for ten characters. An index outside the text is one no edit may carry, whatever the write it names would come to.
 * @param node - The media feature being fixed.
 * @param text - The whitespace to put there.
 * @param params - The parameters the node's positions are counted in.
 * @returns The edit that writes it.
 */
function closingEdit (node: FunctionNode, text: string, params: string): Edit {
	let end = node.unclosed ? params.length : node.sourceEndIndex - 1

	return { start: end - node.after.length, end, text }
}

/**
 * Requires a single space or disallows whitespace on the inside of the parentheses within media features.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
			let params = getAtRuleParams(atRule)
			let indexBoost = atRuleParamIndex(atRule)
			// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence every feature standing behind it on the line
			let reading = inlineCommentReading(atRule, result)
			// A double slash opens a comment that runs to the end of its line, and `postcss-value-parser` knows nothing of the kind: a parenthesis standing in the text of one opens a media feature as far as that parser is concerned, and the fix then writes inside the comment
			let inlineComments = findInlineCommentSpans(params, reading.spells)

			let problems: Array<{ message: string, index: number, fix?: () => void }> = []

			// What a fix changed, and nothing else: the parameters are edited at the positions the fixes name rather than printed anew from the parsed tree, since `postcss-value-parser` does not always give back the text it was handed — a comment opening `/*/` comes back as `/**/` — and a fix made anywhere in such a query would rewrite a comment standing elsewhere in it
			//
			// A feature holding no node at all encloses one span and not two — everything the parser finds between such parentheses it hands back as `before`, leaving `after` empty — so under `always` both halves of the option write at one index, and `applyEditsFromEnd` takes no two edits opening at one index. `addEdit` folds them into the one edit that place means. Both halves put the same single space there, so the text is the same either way and no case can fail without the fold; what it buys is that the list handed over is one the name may be handed.
			let edits: Edit[] = []

			valueParser(params).walk((node) => {
				// The parentheses of a comment are the comment's own. Everything they hold is still walked, since a comment left open by one of them takes the rest of the query into itself as far as the parser is concerned, features and all.
				if (findInlineCommentSpanHolding(node, inlineComments)) return

				if (node.type === `function`) {
					let len = valueParser.stringify(node).length

					if (primary === `never`) {
						if (SPACE_OR_TAB.test(node.before)) {
							problems.push({
								message: messages.rejectedOpening,
								index: node.sourceIndex + 1 + indexBoost,
								fix () { addEdit(edits, openingEdit(node, ``)) },
							})
						}

						if (SPACE_OR_TAB.test(node.after)) {
							// The parenthesis goes right after this text, and the whitespace the fix empties ends it. Where an inline comment stands there, the line break that whitespace holds is what closes the comment, so the option cannot be satisfied without taking the parenthesis, and the whole query behind it, into the comment's text: leave the parameters alone and let the warning stand.
							let isFixable = !endsWithInlineComment(params.slice(0, node.sourceEndIndex - 1 - node.after.length), reading)

							problems.push({
								message: messages.rejectedClosing,
								index: node.sourceIndex - 2 + len + indexBoost,
								fix: isFixable ? (): void => { addEdit(edits, closingEdit(node, ``, params)) } : undefined,
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

						if (node.after === ``) {
							problems.push({
								message: messages.expectedClosing,
								index: node.sourceIndex - 2 + len + indexBoost,
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
						fix: err.fix,
					})
				}

				if (edits.length > 0) setAtRuleParams(atRule, applyEditsFromEnd(params, edits))
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
