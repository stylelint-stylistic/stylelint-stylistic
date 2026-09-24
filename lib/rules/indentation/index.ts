import type { ChildNode } from "postcss"
import stylelint from "stylelint"

import { TRAILING_LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { carriesABlock } from "../../utils/carriesABlock/index.ts"
import { defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { fixIndentation, lastLineIndentation, lastLineStart, writeIndentationBefore } from "../../utils/lineIndentation/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFrontOf } from "../../utils/runInFrontOf/index.ts"
import { freeSemicolonLineChecker, ownSemicolonLineChecker, semicolonLineChecker } from "../../utils/semicolonLineChecker/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { statementString } from "../../utils/statementString/index.ts"
import { isAtRule, isDeclaration, isRoot, isRule } from "../../utils/typeGuards/index.ts"
import { isBoolean, isNumber } from "../../utils/validateTypes/index.ts"

import { checkAtRuleParams, checkSelector, checkValue } from "./lines.ts"
import { MESSAGES, type PrimaryOption, type SecondaryOptions } from "./options.ts"
import { getDocument } from "./rootLevel.ts"
import { createScope, embeddingLevel, indentationLevel, type IndentationScope, statementIn } from "./scope.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `indentation`

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

export type { PrimaryOption, SecondaryOptions } from "./options.ts"

/**
 * Checks the line a node opens, and the line a node behind a free semicolon behind a rule's brace opens in that rule's raw.
 * @param scope - The run.
 * @param node - The node.
 * @param nodeLevel - The level it stands at.
 */
function checkNodeLine (scope: IndentationScope, node: ChildNode, nodeLevel: number): void {
	let { syntax, result, ruleName, messages, indentChar, legibleExpectation } = scope
	let { hostLevel, embeddedLevel } = embeddingLevel(syntax, node, indentChar)

	// The raw where the parser filed one, and otherwise the run PostCSS prints in front of a node a rule of another plugin built without one, which is what the file will hold ([#694](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/694))
	let before = runInFrontOf(node)
	let parent = node.parent

	if (!parent) throw new Error(`A parent node must be present`)

	// Only the root's first node, or one behind a break, has indentation to check
	let isFirstChild = parent.type === `root` && parent.first === node
	// The indentation is the whitespace opening the last line of `before`, a form feed or bare carriage return as much as a space; the writers below read the same run (#452). What stands behind it is on the line, not in front of it: a `*` or `_` hack, a stray semicolon, or a styled template's interpolation (#516), whose own breaks end no line of the stylesheet
	let beforeSpans = syntax.hostCodeSpans(before, node)
	let beforeBreaks = lastLineStart(before, beforeSpans) >= 0

	// A first node with no break in front stands on the stylesheet's opening line and is asked to be empty, not for the host line's tabs (#453). A bare carriage return ends a JavaScript line and none of the stylesheet's, so a node behind one still stands there
	let opensTheStylesheetsLine = isFirstChild && !beforeBreaks
	let expectedOpeningBraceLevel = opensTheStylesheetsLine ? nodeLevel - embeddedLevel : nodeLevel
	let expectedOpeningBraceIndentation = indentChar.repeat(expectedOpeningBraceLevel)

	// A node built with no source is passed over, as it was when its missing raw read as no run and before `report` could place a problem on one (1790090148)
	if (node.source && (beforeBreaks || (isFirstChild && (!getDocument(parent) || (parent.raws.codeBefore && TRAILING_LINE_BREAK.test(parent.raws.codeBefore))))) && lastLineIndentation(before, beforeSpans) !== expectedOpeningBraceIndentation) {
		report({
			message: messages.expected,
			messageArgs: [legibleExpectation(expectedOpeningBraceLevel - (opensTheStylesheetsLine ? 0 : hostLevel))],
			node,
			result,
			ruleName,
			fix () {
				// Written into the raw whichever way the run was read, so a missing raw stops being a run nobody wrote
				node.raws.before = writeIndentationBefore(before, expectedOpeningBraceIndentation, beforeSpans, isFirstChild)
			},
		})
	}

	// A node behind a free semicolon behind a rule's brace, whose line opens in the rule's raw
	ownSemicolonLineChecker({ node, syntax, result, checkedRuleName: ruleName, message: messages.expected, expectedIndentation: expectedOpeningBraceIndentation, expectation: legibleExpectation(expectedOpeningBraceLevel - hostLevel) })
}

/**
 * Checks the line a block's closing brace stands on.
 * @param scope - The run.
 * @param node - The node.
 * @param nodeLevel - The level it stands at.
 */
function checkClosingBrace (scope: IndentationScope, node: ChildNode, nodeLevel: number): void {
	let { syntax, result, ruleName, messages, indentChar, legibleExpectation, secondaryOptions } = scope
	let { hostLevel } = embeddingLevel(syntax, node, indentChar)

	// `indentClosingBrace` puts the brace a level deeper
	let closingBraceLevel = secondaryOptions.indentClosingBrace ? nodeLevel + 1 : nodeLevel
	let expectedClosingBraceIndentation = indentChar.repeat(closingBraceLevel)
	// Read wherever the parser filed the run: behind an at-rule with neither block nor semicolon it is in `raws.between`, trimmed by `checkAtRuleParams`, so nobody measured the brace's line (#509)
	let blockAfter = carriesABlock(node) ? getBlockAfter(syntax, node) ?? `` : ``
	let blockAfterSpans = syntax.hostCodeSpans(blockAfter, node)

	// The brace's indentation is the whitespace opening the last line of that run, as a node's is the whitespace opening the last line of `raws.before` (#452, #516). What stands behind it is on the brace's line: a styled template's interpolation, or a free semicolon wherever the run reaches the brace at all — behind a block the parser takes such a semicolon into the last node's `raws.ownSemicolon` instead
	if (carriesABlock(node) && lastLineStart(blockAfter, blockAfterSpans) >= 0 && lastLineIndentation(blockAfter, blockAfterSpans) !== expectedClosingBraceIndentation) {
		// The statement's own text ends on the brace, where the printed copy ends on a stray `raws.ownSemicolon` (#568)
		let problemIndex = statementString(node, result).length - 1

		report({
			message: messages.expected,
			messageArgs: [legibleExpectation(closingBraceLevel - hostLevel)],
			node,
			index: problemIndex,
			endIndex: problemIndex,
			result,
			ruleName,
			fix () {
				setBlockAfter(syntax, node, fixIndentation(blockAfter, expectedClosingBraceIndentation, blockAfterSpans))
			},
		})
	}
}

/**
 * Specifies indentation.
 * @param ruleScope - What the namespace hands the rule.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule (ruleScope: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions = {}): RuleCheck {
	let { ruleName, messages, syntax } = ruleScope

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [isNumber, `tab`],
			},
			{
				actual: secondaryOptions,
				possible: {
					baseIndentLevel: [isNumber, `auto`],
					except: [`block`, `value`, `param`],
					ignore: [`value`, `param`, `inside-parens`],
					indentInsideParens: [`twice`, `once-at-root-twice-in-block`],
					indentClosingBrace: [isBoolean],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let scope = createScope(ruleScope, primary, secondaryOptions, result)
		let { indentChar, legibleExpectation } = scope

		root.walk((node) => {
			// A nested root of a CSS-in-JS template
			if (isRoot(node)) return

			let nodeLevel = indentationLevel(scope, node)
			let { hostLevel } = embeddingLevel(syntax, node, indentChar)

			checkNodeLine(scope, node, nodeLevel)
			checkClosingBrace(scope, node, nodeLevel)

			if (isDeclaration(node)) checkValue(scope, node, nodeLevel)

			if (isRule(node)) checkSelector(scope, node, nodeLevel)

			if (isAtRule(node)) checkAtRuleParams(scope, node, nodeLevel)

			// The line a statement's semicolon opens closes the statement, so it stands at the statement's own level, as a closing brace stands at its block's (#569)
			semicolonLineChecker({ node, syntax, result, checkedRuleName: ruleName, message: messages.expected, expectedIndentation: indentChar.repeat(nodeLevel), expectation: legibleExpectation(nodeLevel - hostLevel) })

			// A line a free semicolon opens with nothing behind it is an empty statement of its container; last, since the node's and the brace's fixes write such a line at their own level (1790234713)
			freeSemicolonLineChecker({ node, syntax, result, checkedRuleName: ruleName, message: messages.expected, statementIn: (container) => statementIn(scope, container) })
		})
	}
}

// Reads every line a run's writers touch, so it takes the run's last turn (#353)
export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule, defersToRunEnd: true })

export let { ruleName, messages } = createRule(css)
