import type { ChildNode, Container } from "postcss"
import stylelint from "stylelint"

import { SEMICOLON_RUN } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { addEmptyLineAfter } from "../../utils/addEmptyLineAfter/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { carriesABlock } from "../../utils/carriesABlock/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { hasEmptyLine } from "../../utils/hasEmptyLine/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { removeEmptyLinesAfter } from "../../utils/removeEmptyLinesAfter/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { statementString } from "../../utils/statementString/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `block-closing-brace-empty-line-before`

const MESSAGES = defineMessages({
	expected: `Expected empty line before closing brace`,
	rejected: `Unexpected empty line before closing brace`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always-multi-line` an empty line before the closing brace of a multi-line block, `never` none. */
export type PrimaryOption = `always-multi-line` | `never`

/** The secondary options. */
export type SecondaryOptions = {

	/** `after-closing-brace` reverses the primary option for the closing brace of a nested rule. */
	except?: `after-closing-brace` | `after-closing-brace`[],
}

/**
 * Requires or disallows an empty line before the closing brace of blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`always-multi-line`, `never`],
			},
			{
				actual: secondaryOptions,
				possible: {
					except: [`after-closing-brace`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		// Every node carrying a block, a Sass nested property written with a value among them
		root.walk((node) => {
			if (carriesABlock(node)) check(node)
		})

		/**
		 * Checks one statement.
		 * @param statement - The node carrying the block.
		 */
		function check (statement: ChildNode & Container): void {
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			// Minus a stray semicolon
			let before = (getBlockAfter(syntax, statement) || ``).replace(SEMICOLON_RUN, ``)

			// Counted from the text through the brace: the printed copy ends on a stray `raws.ownSemicolon`, and the index landed inside that raw
			let text = statementString(statement, result)
			let index = text.length - 1

			if (text[index - 1] === `\r`) index -= 1

			let expectEmptyLineBefore = ((): boolean => {
				let childNodeTypes = statement.nodes.map((item) => item.type)

				// `after-closing-brace` reverses the option for a block with no declaration
				if (optionsMatches(secondaryOptions, `except`, `after-closing-brace`) && !childNodeTypes.includes(`decl`)) return primary === `never`

				return primary === `always-multi-line` && !isSingleLineString(blockString(statement, result))
			})()

			let hasEmptyLineBefore = hasEmptyLine(before)

			if (expectEmptyLineBefore === hasEmptyLineBefore) return

			let message = expectEmptyLineBefore ? messages.expected : messages.rejected

			report({
				message,
				result,
				ruleName,
				node: statement,
				index,
				endIndex: index,
				fix () {
					if (!expectEmptyLineBefore) {
						removeEmptyLinesAfter(syntax, statement)

						return
					}

					addEmptyLineAfter(syntax, statement, result)
				},
			})
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
