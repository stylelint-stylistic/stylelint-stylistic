import type { Attribute } from "postcss-selector-parser"
import styleSearch from "style-search"
import stylelint, { type FixCallback } from "stylelint"

import { LEADING_WHITESPACE, TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorSearchCopy } from "../../utils/selectorSearchCopy/index.ts"

let { utils: { report, validateOptions } } = stylelint

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

/**
 * The whitespace standing in front of `]` and the way to write over it: the raw where the parser filed the spaces, else the node's own, under the key the attribute's last part carries.
 * @param attributeNode - The parsed attribute selector.
 * @returns The whitespace and its writer.
 */
function closingSpaces (attributeNode: Attribute): {
	after: string,
	setAfter: (fixed: string) => void,
} {
	let key: `insensitive` | `value` | `attribute` = attributeNode.operator ? (attributeNode.insensitive ? `insensitive` : `value`) : `attribute`

	let rawSpaces = attributeNode.raws.spaces && attributeNode.raws.spaces[key]
	let rawAfter = rawSpaces && rawSpaces.after

	let spaces = attributeNode.spaces[key]

	if (rawSpaces && rawAfter) {
		return {
			after: rawAfter,
			setAfter (fixed) {
				rawSpaces.after = fixed
			},
		}
	}

	return {
		after: (spaces && spaces.after) || ``,
		setAfter (fixed) {
			let written = attributeNode.spaces[key] ?? {}

			written.after = fixed
			attributeNode.spaces[key] = written
		},
	}
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

			let fix: FixCallback | undefined
			let hasFixed
			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

			selectorTree.walkAttributes((attributeNode) => {
				let attributeSelectorString = attributeNode.toString()
				// The run in front of the `]` is read over the copy with the escapes masked, where an escaped space is a character of the attribute and no run at all (1789661964); the run behind the `[` opens on the backslash of an escape, so it is read over the text
				let { runString } = selectorSearchCopy(attributeSelectorString)

				styleSearch({ source: attributeSelectorString, target: `[` }, (match) => {
					let nextCharIsSpace = attributeSelectorString[match.startIndex + 1] === ` `
					let index = attributeNode.sourceIndex + match.startIndex + 1

					if (nextCharIsSpace && primary === `never`) {
						fix = (): void => {
							hasFixed = true
							fixBefore(attributeNode)
						}

						complain(messages.rejectedOpening, index)
					}

					if (!nextCharIsSpace && primary === `always`) {
						fix = (): void => {
							hasFixed = true
							fixBefore(attributeNode)
						}

						complain(messages.expectedOpening, index)
					}
				})

				styleSearch({ source: attributeSelectorString, target: `]` }, (match) => {
					let prevCharIsSpace = runString[match.startIndex - 1] === ` `
					let index = attributeNode.sourceIndex + match.startIndex - 1
					// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `[a=b\⏎]` would come out as `[a=b\ ]`, an escaped space, so the warning stands. The question is asked about the whitespace the fix writes over, which is the node's own and never the escaped space in front of it (1789664271)
					let run = (closingSpaces(attributeNode).after.match(TRAILING_WHITESPACE) as RegExpMatchArray)[0]
					let keepsTheEscape = editKeepsEscapedCharacter(attributeSelectorString, { start: match.startIndex - run.length, end: match.startIndex, text: primary === `always` ? ` ` : `` })

					fix = keepsTheEscape
						? (): void => {
							hasFixed = true
							fixAfter(attributeNode)
						}
						: undefined

					if (prevCharIsSpace && primary === `never`) complain(messages.rejectedClosing, index)

					if (!prevCharIsSpace && primary === `always`) complain(messages.expectedClosing, index)
				})
			})

			if (hasFixed) {
				let fixedSelector = String(selectorTree)

				copies.write(fixedSelector)
			}

			/**
			 * Reports a problem.
			 * @param message - The warning text to report.
			 * @param index - The index in the selector copy.
			 */
			function complain (message: string, index: number): void {
				let sourceIndex = copies.toSourceIndex(index)

				report({
					message,
					index: sourceIndex,
					endIndex: sourceIndex,
					result,
					ruleName,
					node: ruleNode,
					...(fix && { fix }),
				})
			}
		})
	}

	/**
	 * Rewrites the whitespace behind `[`.
	 * @param attributeNode - The parsed attribute selector whose opening whitespace is rewritten.
	 */
	function fixBefore (attributeNode: Attribute): void {
		let spacesAttribute = attributeNode.raws.spaces && attributeNode.raws.spaces.attribute
		let rawAttrBefore = spacesAttribute && spacesAttribute.before

		let { attrBefore, setAttrBefore }: {
			attrBefore: string,
			setAttrBefore: (fixed: string) => void,
		} = spacesAttribute && rawAttrBefore
			? {
				attrBefore: rawAttrBefore,
				setAttrBefore (fixed) {
					spacesAttribute.before = fixed
				},
			}
			: {
				attrBefore: (attributeNode.spaces.attribute && attributeNode.spaces.attribute.before) || ``,
				setAttrBefore (fixed) {
					if (!attributeNode.spaces.attribute) attributeNode.spaces.attribute = {}

					attributeNode.spaces.attribute.before = fixed
				},
			}

		if (primary === `always`) setAttrBefore(attrBefore.replace(LEADING_WHITESPACE, ` `))
		else if (primary === `never`) setAttrBefore(attrBefore.replace(LEADING_WHITESPACE, ``))
	}

	/**
	 * Rewrites the whitespace in front of `]`.
	 * @param attributeNode - The parsed attribute selector whose closing whitespace is rewritten.
	 */
	function fixAfter (attributeNode: Attribute): void {
		let { after, setAfter } = closingSpaces(attributeNode)

		if (primary === `always`) setAfter(after.replace(TRAILING_WHITESPACE, ` `))
		else if (primary === `never`) setAfter(after.replace(TRAILING_WHITESPACE, ``))
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
