import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.js"
import { parseSelector } from "../../utils/parseSelector/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `selector-descendant-combinator-no-non-space`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	rejected: (nonSpaceCharacter) => `Unexpected "${nonSpaceCharacter}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) return

			let hasFixed = false
			let selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector

			// Return early for selectors containing comments
			// TODO: re-enable when parser and stylelint are compatible
			if (selector.includes(`/*`)) return

			let fixedSelector = parseSelector(selector, result, ruleNode, (fullSelector) => {
				fullSelector.walkCombinators((combinatorNode) => {
					// Every combinator CSS defines keeps its whitespace beside `value` rather than
					// in it — `>`, `+`, `~` and `||`, and the legacy `>>>` and `/deep/` too. A
					// descendant combinator is `" "`, with any surplus in `spaces.before`, or in
					// `raws.value` where the run does not end in a literal space. So a `value` that
					// holds whitespace and yet is not a single space is one of the things CSS has
					// no combinator for, and saying so is what this rule is for.
					let isDescendant = combinatorNode.value === ` `

					if (!isDescendant && !(/\s/u).test(combinatorNode.value)) return

					let value = combinatorNode.toString()
					let hasSurplusWhitespace = value.includes(`  `) || value.includes(`\t`) || value.includes(`\n`) || value.includes(`\r`)

					// A descendant combinator is a problem only when it is more than a single space.
					// What CSS has no combinator for is a problem whatever it is made of.
					if (!isDescendant || hasSurplusWhitespace) {
						// Only a run of pure whitespace can be collapsed into a single space; anything
						// else is reported and left alone. Stylelint counts a fixer as applied whatever
						// it does, so that has to be decided here rather than from inside the fixer.
						let isFixable = (/^\s+$/u).test(value)

						report({
							result,
							ruleName,
							message: messages.rejected,
							messageArgs: [value],
							node: ruleNode,
							index: combinatorNode.sourceIndex,
							endIndex: combinatorNode.sourceIndex,
							fix: isFixable
								? () => {
									hasFixed = true

									if (!combinatorNode.raws) combinatorNode.raws = {}

									combinatorNode.raws.value = ` `
									combinatorNode.rawSpaceBefore = combinatorNode.rawSpaceBefore.replace(/^\s+/u, ``)
									combinatorNode.rawSpaceAfter = combinatorNode.rawSpaceAfter.replace(/\s+$/u, ``)
								}
								: undefined,
						})
					}
				})
			})

			if (hasFixed && fixedSelector) {
				if (ruleNode.raws.selector) ruleNode.raws.selector.raw = fixedSelector
				else ruleNode.selector = fixedSelector
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
