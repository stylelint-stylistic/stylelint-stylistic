import type { Node } from "postcss"
import stylelint, { type PostcssResult, type RuleMessage } from "stylelint"

import { EVERY_LINE_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { fixIndentation, lastLineIndentation } from "../lineIndentation/index.ts"
import { isAtRule, isDeclaration } from "../typeGuards/index.ts"
import { readWhitespaceBeforeSemicolon, writeWhitespaceBeforeSemicolon } from "../whitespaceBeforeSemicolon/index.ts"

let { utils: { report } } = stylelint

/**
 * Checks the line a statement's semicolon opens, for `indentation`.
 *
 * The run in front of the semicolon is read where `writeWhitespaceBeforeSemicolon` writes it. Nobody else reads its last line: `checkMultilineBit` passes over a line without content, and `checkAtRuleParams` trims the run off the params ([#569](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/569)). The line closes the statement, so it is asked for the statement's own level, as a closing brace stands at its block's; `except` and `ignore` speak of the lines of a value or of params, and this line holds neither. A whitespace-only line in front of it is `no-eol-whitespace`'s, and the fix writes the last line alone, since `fixIndentation` takes a break's indentation only in front of content or the end. Behind a Less mixin call's `!important` the run is read from the flag's raw, where the `less` namespace hands it wherever it finds the flag in the file ([#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374)).
 * @param options - The node, the syntax, the result, the rule's name and message, the indentation asked for and how the message words it.
 * @param options.node - The node walked; only a declaration or a bodiless at-rule a semicolon closes has such a line.
 * @param options.syntax - The syntax that reads and writes the run.
 * @param options.result - The Stylelint result.
 * @param options.checkedRuleName - The configured name.
 * @param options.message - The rule's message, which takes the worded expectation.
 * @param options.expectedIndentation - The indentation of the statement's level.
 * @param options.expectation - That level, worded for the message.
 */
export function semicolonLineChecker ({ node, syntax, result, checkedRuleName, message, expectedIndentation, expectation }: {
	node: Node,
	syntax: Syntax,
	result: PostcssResult,
	checkedRuleName: string,
	message: RuleMessage,
	expectedIndentation: string,
	expectation: string,
}): void {
	if (!isDeclaration(node) && !isAtRule(node)) return
	if (hasBlock(node) || isLastNodeWithoutSemicolon(node)) return

	let run = readWhitespaceBeforeSemicolon(syntax, node, result)
	let lines = run.split(EVERY_LINE_BREAK)

	if (lines.length < 2 || lastLineIndentation(run) === expectedIndentation) return

	// The semicolon stands behind the statement's text as the file spells it
	let problemIndex = isDeclaration(node) ? declarationString(syntax, node).length : `@${node.name}${node.raws.afterName || ``}${syntax.read(node)}${node.raws.between || ``}${typeof node.raws.important === `string` ? node.raws.important : ``}`.length

	report({
		message,
		messageArgs: [expectation],
		node,
		index: problemIndex,
		endIndex: problemIndex,
		result,
		ruleName: checkedRuleName,
		fix () {
			writeWhitespaceBeforeSemicolon(syntax, node, result, fixIndentation(run, expectedIndentation))
		},
	})
}
