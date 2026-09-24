import type { Declaration } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { collapseBreakRuns, holdsLongerBreakRun } from "../../utils/collapseBreakRuns/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { assertString, isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `function-max-empty-lines`

const MESSAGES = defineMessages({
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? `line` : `lines`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * The index of the start of a declaration's value.
 * @param decl - The declaration.
 * @returns The index.
 */
function placeIndexOnValueStart (decl: Declaration): number {
	assertString(decl.raws.between)

	return decl.prop.length + decl.raws.between.length - 1
}

/** The most empty lines allowed in a row inside a function. */
export type PrimaryOption = number

/**
 * Limits the number of adjacent empty lines within functions.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let maxAdjacentNewlines = primary + 1

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: isNumber,
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!decl.value.includes(`(`)) return

			let stringValue = syntax.read(decl)

			// Both kinds: a `//` comment's text comes back as words and calls, a `/*/` comment closes on its own star
			let comments = syntax.commentSpans(stringValue, decl, result)

			// Walked in a copy of the same length with every comment blanked, so a comment's empty lines are counted against no call and collapsed by no fix, and the parser pairs only parentheses written as code
			let blankedValue = blankComments(stringValue, comments)

			let splittedValue: Array<[string, string]> = []
			let sourceIndexStart = 0

			valueParser(blankedValue).walk((node) => {
				// ignore non functions or sass lists
				if (node.type !== `function` || node.value.length === 0) return

				// Sliced from the value, since the node prints spaces where the file has a comment
				let nodeString = stringValue.slice(node.sourceIndex, node.sourceEndIndex)
				let blankedNodeString = blankedValue.slice(node.sourceIndex, node.sourceEndIndex)

				if (!holdsLongerBreakRun(blankedNodeString, maxAdjacentNewlines)) return

				let problemIndex = placeIndexOnValueStart(decl) + node.sourceIndex
				let isFixed = false

				report({
					message: messages.expected,
					messageArgs: [primary],
					node: decl,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix () {
						splittedValue.push([
							stringValue.slice(sourceIndexStart, node.sourceIndex),
							collapseBreakRuns(nodeString, blankedNodeString, maxAdjacentNewlines),
						])
						sourceIndexStart = node.sourceEndIndex
						isFixed = true
					},
				})

				// The written text is the whole call, nested calls included, so they are not descended into and written again
				if (isFixed) return false
			})

			if (splittedValue.length > 0) {
				let updatedValue = splittedValue.reduce((acc, curr) => acc + curr[0] + curr[1], ``) + stringValue.slice(sourceIndexStart)

				syntax.write(decl, updatedValue)
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
