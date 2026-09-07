import valueParser, { type Node } from "postcss-value-parser"
import stylelint from "stylelint"

import { CONTAINS_HEX_COLOR, HEX_COLOR } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `color-hex-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The case, `lower` or `upper`. */
export type PrimaryOption = `lower` | `upper`

/**
 * Enforces lowercase or uppercase hex colors.
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
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!CONTAINS_HEX_COLOR.test(decl.value)) return

			let declValue = syntax.read(decl)
			// Both kinds: the value parser returns a `//` comment's text as nodes and closes `/*/` on its own star (#378)
			let comments = syntax.commentSpans(declValue, decl, result)
			// Masked so the parser pairs quotation marks as the file does (#508)
			let parsedValue = valueParser(hideQuotesInComments(declValue, comments))
			// Edited by position rather than printed from the tree, which gives `/*/` back as `/**/`
			let edits: Edit[] = []

			parsedValue.walk((node, at, siblings) => {
				let { value } = node

				// An address is passed over whole; its name is read, not matched, so `u\rl(` and `URL(` are `url(` here as to the comment scan and Sass
				if (opensAnAddress(node, at, siblings)) return false

				// Not the value's, but its children are walked: a call opened in a comment reaches past its end into code. The address check comes first since the scan steps over one only where it is code
				if (findCommentSpanHolding(node, comments)) return

				if (!isHexColor(node)) return

				let expected = primary === `lower` ? value.toLowerCase() : value.toUpperCase()

				if (value === expected) return

				let problemIndex = declarationValueIndex(decl) + node.sourceIndex

				report({
					message: messages.expected,
					messageArgs: [value, expected],
					node: decl,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix () {
						// A word node's span is its value's length
						edits.push({ start: node.sourceIndex, end: node.sourceIndex + value.length, text: expected })
					},
				})
			})

			if (edits.length > 0) syntax.write(decl, applyEditsFromEnd(declValue, edits))
		})
	}
}

/**
 * Asks whether a node is a hex color.
 * @param node - The value parser node.
 * @returns True for a hex color word.
 */
function isHexColor (node: Node): boolean {
	let { type, value } = node

	return type === `word` && HEX_COLOR.test(value)
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
