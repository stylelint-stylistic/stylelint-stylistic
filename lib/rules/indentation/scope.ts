import type { Container, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import type { RuleScope } from "../../utils/defineRule/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { isRoot } from "../../utils/typeGuards/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"

import type { MESSAGES, PrimaryOption, SecondaryOptions } from "./options.ts"
import { getRootBaseIndentLevel } from "./rootLevel.ts"

/** What one run of the rule reads everywhere: what the namespace hands it, the options, the result, one level's indentation, and how a level is worded. */
export type IndentationScope = RuleScope<typeof MESSAGES> & {
	primary: PrimaryOption,
	secondaryOptions: SecondaryOptions,
	result: PostcssResult,
	indentChar: string,
	legibleExpectation: (level: number) => string,
}

/**
 * Builds the run's scope.
 * @param ruleScope - What the namespace hands the rule.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @param result - The Stylelint result.
 * @returns The scope.
 */
export function createScope (ruleScope: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions, result: PostcssResult): IndentationScope {
	let spaceCount = isNumber(primary) ? primary : null
	let indentChar = spaceCount === null ? `\t` : ` `.repeat(spaceCount)
	let warningWord = primary === `tab` ? `tab` : `space`

	/**
	 * Words a level as a count of tabs or spaces.
	 * @param level - The indent level to word, counted in units of the indent.
	 * @returns The text.
	 */
	function legibleExpectation (level: number): string {
		let count = spaceCount === null ? level : level * spaceCount
		let quantifiedWarningWord = count === 1 ? warningWord : `${warningWord}s`

		return `${count} ${quantifiedWarningWord}`
	}

	return { ...ruleScope, primary, secondaryOptions, result, indentChar, legibleExpectation }
}

/**
 * The levels a node's embedding adds: the host line's indentation, plus one where a template is broken over lines.
 * @param syntax - The syntax asked about the node's embedding.
 * @param node - The node whose host line is measured.
 * @param indentChar - One level's indentation.
 * @returns The host level, and the embedded level.
 */
export function embeddingLevel (syntax: Syntax, node: Node, indentChar: string): { hostLevel: number, embeddedLevel: number } {
	let { indent, multiline } = syntax.embedding(node)
	let hostLevel = Math.ceil(indent.length / indentChar.length)

	return { hostLevel, embeddedLevel: hostLevel + (multiline ? 1 : 0) }
}

/**
 * The level a node stands at.
 * @param scope - The run.
 * @param node - The node whose ancestors are counted.
 * @param level - The levels so far.
 * @returns The level.
 */
export function indentationLevel (scope: IndentationScope, node: Node, level: number = 0): number {
	if (!node.parent) throw new Error(`A parent node must be present`)

	let { syntax, primary, secondaryOptions, indentChar } = scope
	let calculatedLevel = level + embeddingLevel(syntax, node, indentChar).embeddedLevel

	if (isRoot(node.parent)) return calculatedLevel + getRootBaseIndentLevel(syntax, node.parent, secondaryOptions.baseIndentLevel, primary, secondaryOptions.indentClosingBrace)

	// One level per ancestor
	calculatedLevel = indentationLevel(scope, node.parent, calculatedLevel + 1)

	// Under `except: ["block"]` a block stands at its parent's level
	if (optionsMatches(secondaryOptions, `except`, `block`) && hasBlock(node)) calculatedLevel -= 1

	return calculatedLevel
}

/**
 * The indentation a statement with no block stands at in a container: one level into a block, and in a root the level of its nodes.
 * @param scope - The run.
 * @param container - The container.
 * @returns The indentation and its wording, or nothing in a root with no node to read the embedding off.
 */
export function statementIn (scope: IndentationScope, container: Container): { indentation: string, expectation: string } | undefined {
	let { syntax, indentChar, legibleExpectation } = scope
	let level = isRoot(container) ? container.first && indentationLevel(scope, container.first) : indentationLevel(scope, container, 1)
	let hostLevel = isRoot(container) && container.first ? embeddingLevel(syntax, container.first, indentChar).hostLevel : 0

	return level === undefined ? undefined : { indentation: indentChar.repeat(level), expectation: legibleExpectation(level - hostLevel) }
}
