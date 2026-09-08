import type { AtRule, ChildNode, Rule } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { LEADING_WHITESPACE, LINE_BREAK, TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import type { NeighbourRule } from "../../utils/neighbourSettings/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"
import { type Whitespace, whitespaceAsked } from "../../utils/whitespaceAsked/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `declaration-block-single-line-max-declarations`

const MESSAGES = defineMessages({
	expected: (max) => `Too many declarations, maximum ${max}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The two rules about a run the fix writes, by the whitespace each writes, with every option each takes; the lineness-conditioned ones speak of the block as the fix leaves it, save the pair behind a nested block, which speaks of that block. */
type RunRules = Record<Whitespace, NeighbourRule>

/** The run behind the opening brace: the newline rule reads the first node that is no comment, the space rule the first node whatever it is. */
const OPENING_BRACE: RunRules = {
	newline: { name: `block-opening-brace-newline-after`, options: [`always`, `always-multi-line`, `never-multi-line`] },
	space: { name: `block-opening-brace-space-after`, options: [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`] },
}

/** The run behind a declaration's semicolon: the newline rule reads past the comments behind it, the space rule the very next node. */
const SEMICOLON: RunRules = {
	newline: { name: `declaration-block-semicolon-newline-after`, options: [`always`, `always-multi-line`, `never-multi-line`] },
	space: { name: `declaration-block-semicolon-space-after`, options: [`always`, `never`, `always-single-line`, `never-single-line`] },
}

/** The run behind a nested block's closing brace: the newline rule reads past one end-of-line comment, the space rule the very next node. */
const CLOSING_BRACE_AFTER: RunRules = {
	newline: { name: `block-closing-brace-newline-after`, options: [`always`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`] },
	space: { name: `block-closing-brace-space-after`, options: [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`] },
}

/** The run in front of the closing brace. */
const CLOSING_BRACE_BEFORE: RunRules = {
	newline: { name: `block-closing-brace-newline-before`, options: [`always`, `always-multi-line`, `never-multi-line`] },
	space: { name: `block-closing-brace-space-before`, options: [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`] },
}

/**
 * Answers for the block as the fix leaves it, which is what the options conditioned on its lineness are asked about.
 * @returns False: the block is multi-line then.
 */
function isSingleLineAfterTheFix (): boolean {
	return false
}

/** The rules speaking of one run, and the lineness their conditioned options ask about. */
type Run = {
	rules: Partial<RunRules>,
	isSingleLine: () => boolean,
}

/**
 * Names the pair of rules about the run behind a node.
 * @param previous - The node in front of the run, comments stepped over; none behind the brace.
 * @param nested - That node where it carries a block.
 * @returns The pair; none behind a bodiless at-rule.
 */
function rulesBehind (previous: ChildNode | undefined, nested: ChildNode | undefined): RunRules | undefined {
	if (previous === undefined) return OPENING_BRACE
	if (isDeclaration(previous)) return SEMICOLON

	return nested ? CLOSING_BRACE_AFTER : undefined
}

/**
 * Finds the rules speaking of the run in front of a node, by what stands in front of it: the brace, a declaration's semicolon or a nested block's brace. Each space rule reads the very next node, a comment too; each newline rule reads past the comments, one at most behind a nested block. The two rules behind a nested block ask about that block's lineness, the rest about the one the fix leaves.
 * @param node - A node of the block.
 * @param result - The Stylelint result.
 * @returns The run's readers; none behind a bodiless at-rule.
 */
function runOf (node: ChildNode, result: PostcssResult): Run {
	let previous = node.prev()
	let comments = 0

	while (previous && isComment(previous)) {
		comments += 1
		previous = previous.prev()
	}

	let nested = previous !== undefined && (isRule(previous) || isAtRule(previous)) && hasBlock(previous) ? previous : undefined
	let rules = rulesBehind(previous, nested)
	let isSingleLine = nested ? (): boolean => isSingleLineString(blockString(nested, result)) : isSingleLineAfterTheFix

	if (!rules) return { rules: {}, isSingleLine }
	if (isComment(node)) return { rules: comments === 0 ? { space: rules.space } : {}, isSingleLine }
	if (comments === 0) return { rules, isSingleLine }

	return { rules: nested && comments > 1 ? {} : { newline: rules.newline }, isSingleLine }
}

/** The most declarations a single-line block may hold. */
export type PrimaryOption = number

/**
 * Limits the number of declarations within a single-line declaration block.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The maximum.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [isNumber],
		})

		if (!validOptions) return

		// A block of declarations is what is counted, whichever keyword opens it, so an at-rule's block is read as a rule's (#640); one walk in document order, since a nested block broken first would make the block around it multi-line before it is read (#641)
		root.walk((node) => {
			if (isRule(node) || isAtRule(node)) check(node)
		})

		/**
		 * Counts the declarations of one statement's block.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			// A bodiless at-rule, a Less variable or a mixin call among them, has nothing to count
			if (!hasBlock(statement)) return

			// Printed by the file's syntax, since PostCSS prints a Less mixin call and an inline comment unlike the file
			let block = blockString(statement, result)

			if (!isSingleLineString(block)) return

			// What the parser filed as a declaration, as Stylelint's own rule counted: a nested rule, an at-rule and a comment are none
			let declarations = statement.nodes.filter(isDeclaration)

			if (declarations.length <= primary) return

			// Counted from the statement's own start, as `report` reads an index
			let index = beforeBlockString(statement, result, { noRawBefore: true }).length

			// The fix breaks the block over lines: the run in front of every node and the one in front of the closing brace, each spelled as the rules about it ask (#641), a break where none speaks. A comment keeps its run unless a space rule reads it, so it stays on the line of what it follows, as every newline rule allows. Where no run gets a break the block would stay on one line, so the warning stands unfixed
			let lineBreak = getLineBreak(syntax, statement, result)
			let runs = statement.nodes.map((node) => {
				let { rules, isSingleLine } = runOf(node, result)
				let standing = (node.raws.before ?? ``).match(LEADING_WHITESPACE)?.[0] ?? ``

				return { node, whitespace: whitespaceAsked(syntax, node, result, rules, isSingleLine, isComment(node) ? standing : lineBreak) }
			})
			let closing = whitespaceAsked(syntax, statement, result, CLOSING_BRACE_BEFORE, isSingleLineAfterTheFix, lineBreak)
			let isFixable = LINE_BREAK.test(closing) || runs.some(({ whitespace }) => LINE_BREAK.test(whitespace))

			report({
				message: messages.expected,
				messageArgs: [primary],
				node: statement,
				index,
				endIndex: index + block.length,
				result,
				ruleName,
				...(isFixable && {
					fix: (): void => {
						// A free semicolon in a raw keeps its place, behind the run in front of a node and in front of the run before the brace, which is the side each raw's readers read from; the closing run is read and written wherever the parser filed it
						for (let { node, whitespace } of runs) node.raws.before = whitespace + (node.raws.before ?? ``).replace(LEADING_WHITESPACE, ``)

						setBlockAfter(statement, (getBlockAfter(statement) ?? ``).replace(TRAILING_WHITESPACE, ``) + closing)
					},
				}),
			})
		}
	}
}

// Reads a lineness the run's writers change, so it checks behind them; what it writes, `indentation` indents behind it in the same run, and a neighbour about a run it leaves alone reads the broken block on the run after (#641)
export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule, defersToRunEnd: true })

export let { ruleName, messages } = createRule(css)
