import type { Declaration } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findInlineCommentSpanHolding } from "../../utils/findInlineCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { assertString, isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `function-max-empty-lines`

const MESSAGES = defineMessages({
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? `line` : `lines`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Gets the index of the start of a declaration's value.
 * @param decl - The CSS declaration node.
 * @returns The index of the start of the declaration's value.
 */
function placeIndexOnValueStart (decl: Declaration): number {
	assertString(decl.raws.between)

	return decl.prop.length + decl.raws.between.length - 1
}

/**
 * Limits the number of adjacent empty lines within functions.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, a number.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: number): RuleCheck {
	let maxAdjacentNewlines = primary + 1

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: isNumber,
		})

		if (!validOptions) return

		let violatedCRLFNewLinesRegex = new RegExp(`(?:\r\n){${maxAdjacentNewlines + 1},}`, `u`)
		let violatedLFNewLinesRegex = new RegExp(`\n{${maxAdjacentNewlines + 1},}`, `u`)
		let allowedLFNewLinesString = `\n`.repeat(maxAdjacentNewlines)
		let allowedCRLFNewLinesString = `\r\n`.repeat(maxAdjacentNewlines)

		root.walkDecls((decl) => {
			if (!decl.value.includes(`(`)) return

			let stringValue = syntax.read(decl)

			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary words and calls
			let inlineComments = syntax.inlineCommentSpans(stringValue, decl, result)

			let splittedValue: Array<[string, string]> = []
			let sourceIndexStart = 0

			valueParser(stringValue).walk((node) => {
				// A call whose name opens in the text of an inline comment is a call of that text however far the parser reached to close it, so the empty lines it holds are neither counted nor collapsed. What it holds is still walked, and every node of it asked the same question, since such a call reaches past the break that closes the comment and gathers the code standing below it.
				if (findInlineCommentSpanHolding(node, inlineComments)) return

				// ignore non functions or sass lists
				if (node.type !== `function` || node.value.length === 0) return

				// The call is taken from the value rather than printed anew, since printing does not always give back the text it was handed: a comment opening `/*/` closes on the star it opened with, so the parser reads it three characters wide and prints it back as four, and every call holding one inherits that character. The parser marks where each node ends, and the text between its two marks is the node as the file spells it, for every node type.
				let nodeString = stringValue.slice(node.sourceIndex, node.sourceEndIndex)

				if (!violatedLFNewLinesRegex.test(nodeString) && !violatedCRLFNewLinesRegex.test(nodeString)) return

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
						let newNodeString = nodeString
							.replaceAll(new RegExp(violatedLFNewLinesRegex, `gmu`), allowedLFNewLinesString)
							.replaceAll(new RegExp(violatedCRLFNewLinesRegex, `gmu`), allowedCRLFNewLinesString)

						splittedValue.push([
							stringValue.slice(sourceIndexStart, node.sourceIndex),
							newNodeString,
						])
						sourceIndexStart = node.sourceEndIndex
						isFixed = true
					},
				})

				// The parser walks a call before what it holds, and the text just written is the whole of that call, every call nested in it rewritten along with the rest. So there is nothing left to write inside it: descending would write each nested call a second time, over the code standing behind the outer one. Where the fix did not run — no `--fix` asked for, or a `stylelint-disable` covering the call — the outer call is untouched and what it holds is walked as before.
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
