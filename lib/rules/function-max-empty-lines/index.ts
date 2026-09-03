import type { Declaration } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
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
 * Replaces every run of line breaks a pattern finds, in a text and in the copy of it the runs are looked for in.
 *
 * The copy is the text with every comment blanked, so no run of it is ever one a comment holds: {@link blankComments} writes a space over every character of a comment, the line breaks of its text among them. Every run found therefore stands outside every comment, where the copy spells the text character for character, so the same slice is cut at the same position out of both, and the two are as long as each other again for the pass that follows.
 * @param blanked - The copy of the text with every comment blanked.
 * @param text - The text as the file spells it.
 * @param pattern - What a run of line breaks the option forbids is spelled with.
 * @param replacement - The run of line breaks it allows, written in place of each one found.
 * @returns The copy and the text, each with every run replaced.
 */
function replaceRuns (blanked: string, text: string, pattern: RegExp, replacement: string): [string, string] {
	let blankedPieces = []
	let pieces = []
	let index = 0

	for (let run of blanked.matchAll(new RegExp(pattern, `gmu`))) {
		blankedPieces.push(blanked.slice(index, run.index), replacement)
		pieces.push(text.slice(index, run.index), replacement)
		index = run.index + run[0].length
	}

	blankedPieces.push(blanked.slice(index))
	pieces.push(text.slice(index))

	return [blankedPieces.join(``), pieces.join(``)]
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

			// Every comment the value holds, both kinds. A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind, so what such a comment holds comes back as ordinary words and calls; a block comment reaches the walk as a node of its own — except one opening `/*/`, which the parser closes on the star it opened with, handing the rest of its text back the same way (#378)
			let comments = syntax.commentSpans(stringValue, decl, result)

			// The value is walked in a copy of itself with every comment blanked, so that a comment is whitespace to the parser whatever it is spelled with and whatever it holds. The empty lines of its text are then no lines of the call it stands in — they are counted against no call and collapsed by no fix (#503) — and the parentheses the parser pairs are the ones the file writes as code: a parenthesis a comment holds closes nothing, and neither does a name written there open a call. The copy is as long as the value and spells it character for character outside the comments, so every position of the parse counts in the value itself, which is what the checks below slice at those positions.
			let blankedValue = blankComments(stringValue, comments)

			let splittedValue: Array<[string, string]> = []
			let sourceIndexStart = 0

			valueParser(blankedValue).walk((node) => {
				// ignore non functions or sass lists
				if (node.type !== `function` || node.value.length === 0) return

				// The call is taken from the value rather than printed anew, since the node comes from the copy and printing it would write that copy — a run of spaces wherever the file spells a comment. The parser marks where each node opens and where it ends, and the copy is as long as the value and spells it character for character outside the comments, so the text of the value between those two marks is the node as the file spells it, comments and all.
				let nodeString = stringValue.slice(node.sourceIndex, node.sourceEndIndex)
				let blankedNodeString = blankedValue.slice(node.sourceIndex, node.sourceEndIndex)

				if (!violatedLFNewLinesRegex.test(blankedNodeString) && !violatedCRLFNewLinesRegex.test(blankedNodeString)) return

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
						// The two passes run one after the other, as they did when the whole of the call was rewritten at once: what the first writes is what the second reads. So the copy is carried through the first pass beside the text, and it is the copy the second looks for its runs in.
						let [blankedWithoutLFRuns, withoutLFRuns] = replaceRuns(blankedNodeString, nodeString, violatedLFNewLinesRegex, allowedLFNewLinesString)
						let [, newNodeString] = replaceRuns(blankedWithoutLFRuns, withoutLFRuns, violatedCRLFNewLinesRegex, allowedCRLFNewLinesString)

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
