import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import { isNumber } from "../../utils/validateTypes.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `function-max-empty-lines`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? `line` : `lines`}`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * @param {import('postcss').Declaration} decl
 */
function placeIndexOnValueStart (decl) {
	if (decl.raws.between === null) { throw new Error(`\`between\` must be present`) }

	return decl.prop.length + decl.raws.between.length - 1
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	const maxAdjacentNewlines = primary + 1

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: isNumber,
		})

		if (!validOptions) {
			return
		}

		const violatedCRLFNewLinesRegex = new RegExp(`(?:\r\n){${maxAdjacentNewlines + 1},}`)
		const violatedLFNewLinesRegex = new RegExp(`\n{${maxAdjacentNewlines + 1},}`)
		const allowedLFNewLinesString = `\n`.repeat(maxAdjacentNewlines)
		const allowedCRLFNewLinesString = `\r\n`.repeat(maxAdjacentNewlines)

		root.walkDecls((decl) => {
			if (!decl.value.includes(`(`)) {
				return
			}

			const stringValue = getDeclarationValue(decl)

			/** @type {Array<[string, string]>} */
			const splittedValue = []
			let sourceIndexStart = 0

			valueParser(stringValue).walk((node) => {
				if (node.type !== `function` /* ignore non functions */ || node.value.length === 0 /* ignore sass lists */) {
					return
				}

				const stringifiedNode = valueParser.stringify(node)

				if (!violatedLFNewLinesRegex.test(stringifiedNode) && !violatedCRLFNewLinesRegex.test(stringifiedNode)) {
					return
				}

				report({
					message: messages.expected(primary),
					node: decl,
					index: placeIndexOnValueStart(decl) + node.sourceIndex,
					result,
					ruleName,
					fix () {
						const newNodeString = stringifiedNode
							.replace(new RegExp(violatedLFNewLinesRegex, `gm`), allowedLFNewLinesString)
							.replace(new RegExp(violatedCRLFNewLinesRegex, `gm`), allowedCRLFNewLinesString)

						splittedValue.push([
							stringValue.slice(sourceIndexStart, node.sourceIndex),
							newNodeString,
						])
						sourceIndexStart = node.sourceIndex + stringifiedNode.length
					},
				})
			})

			if (splittedValue.length > 0) {
				const updatedValue = splittedValue.reduce((acc, curr) => acc + curr[0] + curr[1], ``) + stringValue.slice(sourceIndexStart)

				setDeclarationValue(decl, updatedValue)
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
