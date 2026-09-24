import styleSearch from "style-search"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runBehind } from "../../utils/runBehind/index.ts"
import { runInFront } from "../../utils/runInFront/index.ts"
import { selectorSearchCopy } from "../../utils/selectorSearchCopy/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-attribute-brackets-space-inside`

const MESSAGES = defineMessages({
	expectedOpening: `Expected single space after "["`,
	rejectedOpening: `Unexpected whitespace after "["`,
	expectedClosing: `Expected single space before "]"`,
	rejectedClosing: `Unexpected whitespace before "]"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space inside the brackets, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires a single space or disallows whitespace inside attribute selector brackets.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let written = primary === `always` ? ` ` : ``

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!syntax.isStandardRule(ruleNode)) return

			let copies = syntax.selectorCopies(ruleNode)

			let { selector } = copies

			if (!selector.includes(`[`)) return

			let edits: Edit[] = []
			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

			selectorTree.walkAttributes((attributeNode) => {
				let attributeSelectorString = attributeNode.toString()
				// The print opens on the whitespace the node carries, which stands in front of the index the parser gives it
				let attributeStart = attributeNode.sourceIndex - attributeSelectorString.indexOf(`[`)

				// The parser reads a backslash in front of a tab as no escape and files what follows into parts it prints back in another order, so `[a=\⇥\⇥b]` comes back as `[a=\⇥b⇥]`: an attribute whose parts do not spell the source is passed over, since every edit here is measured in them
				if (!selector.startsWith(attributeSelectorString, attributeStart)) return

				// The brackets are sought over the copy with the strings and escapes masked, since the search reads neither: it closes no string at a quotation mark with a backslash in front, so the `]` behind `"b\\"` passed for the string's text, and takes an escaped `\[` or `\]` for a bracket. The run beside the bracket is read over the copy with the escapes masked, where an escaped space is a character of the attribute and no run at all, and written into the selector at the index it was read at: the parser files an escaped tab in the spaces of a part and prints it back with the whitespace of the source
				let { searchString, runString } = selectorSearchCopy(attributeSelectorString)

				styleSearch({ source: searchString, target: `[` }, (match) => {
					let nextCharIsSpace = attributeSelectorString[match.startIndex + 1] === ` `
					let index = attributeNode.sourceIndex + match.startIndex + 1
					let openIndex = attributeStart + match.startIndex + 1
					// No escape reaches over the bracket, so the run behind it opens on the backslash of one and never covers a character of the attribute
					let run = runBehind(runString, match.startIndex)
					let edit = { start: openIndex, end: openIndex + run.length, text: written }

					if (nextCharIsSpace && primary === `never`) complain(messages.rejectedOpening, index, edit)

					if (!nextCharIsSpace && primary === `always`) complain(messages.expectedOpening, index, edit)
				})

				styleSearch({ source: searchString, target: `]` }, (match) => {
					let prevCharIsSpace = runString[match.startIndex - 1] === ` `
					let index = attributeNode.sourceIndex + match.startIndex - 1
					let closeIndex = attributeStart + match.startIndex
					let run = runInFront(runString, match.startIndex)
					let edit = { start: closeIndex - run.length, end: closeIndex, text: written }
					// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `[a=b\⏎]` would come out as `[a=b\ ]`, an escaped space, so the warning stands with no fix
					let keepsTheEscape = editKeepsEscapedCharacter(selector, edit)

					if (prevCharIsSpace && primary === `never`) complain(messages.rejectedClosing, index, keepsTheEscape ? edit : undefined)

					if (!prevCharIsSpace && primary === `always`) complain(messages.expectedClosing, index, keepsTheEscape ? edit : undefined)
				})
			})

			if (edits.length > 0) copies.write(applyEditsFromEnd(selector, edits))

			/**
			 * Reports a problem.
			 * @param message - The warning text to report.
			 * @param index - The index in the selector copy.
			 * @param edit - The edit fixing it, indexed in the same copy; nothing where the fix is refused.
			 */
			function complain (message: string, index: number, edit?: Edit): void {
				let sourceIndex = copies.toSourceIndex(index)

				report({
					message,
					index: sourceIndex,
					endIndex: sourceIndex,
					result,
					ruleName,
					node: ruleNode,
					...(edit && {
						fix: (): void => {
							edits.push(edit)
						},
					}),
				})
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
