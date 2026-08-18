import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.js"
import { parseSelector } from "../../utils/parseSelector/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `selector-pseudo-class-parentheses-space-inside`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedOpening: `Expected single space after "("`,
	rejectedOpening: `Unexpected whitespace after "("`,
	expectedClosing: `Expected single space before ")"`,
	rejectedClosing: `Unexpected whitespace before ")"`,
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
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) return

			if (!ruleNode.selector.includes(`(`)) return

			let fix = null
			let hasFixed = false
			let selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector
			let fixedSelector = parseSelector(selector, result, ruleNode, (selectorTree) => {
				// An argument with no node in it keeps no whitespace: the parser drops whatever
				// stood at that end of the parentheses, and where such an argument opens the list it
				// hands the run to the node behind the comma instead, so that `a:not( ,b)` comes back
				// out as `a:not(, b)`. Every fix of this rule is written back from the tree, whichever
				// pseudo-class of the selector it was made in, and would carry that off with it. So
				// nothing is reported anywhere in a selector list holding a pseudo-class the parser
				// does not give back as it took it, for as long as an argument of that one is
				// missing. What moved the text does not matter, since no write can be trusted
				// either way: a comment standing in front of a closing parenthesis or of a comma
				// moves it as readily, which is #161, and is left where it stands wherever no
				// argument is missing.
				if (hasMangledEmptyArgument(selectorTree, selector)) return

				selectorTree.walkPseudos((pseudoNode) => {
					if (pseudoNode.length === 0) return

					let paramString = pseudoNode.map((node) => node.toString()).join(`,`)
					let isParamStringMultiline = paramString.includes(`\n`)
					let openIndex = pseudoNode.sourceIndex + pseudoNode.value.length + 1

					// The whitespace this rule has an opinion about is kept on the node standing at
					// that end of the arguments, and an argument with no node in it has none to keep
					// it. So an end with nothing at it has neither a space to report nor anywhere to
					// write one, and each side is asked about on its own, the other going on as before.
					let firstNode = firstNodeInside(pseudoNode)
					let lastNode = lastNodeInside(pseudoNode)

					if (firstNode) {
						let nextCharIsSpace = paramString.startsWith(` `)

						if (nextCharIsSpace && primary === `never`) {
							fix = () => {
								hasFixed = true
								setSpaceBefore(firstNode, ``)
							}
							complain(messages.rejectedOpening, openIndex)
						}

						if (!nextCharIsSpace && primary === `always`) {
							fix = () => {
								hasFixed = true
								setSpaceBefore(firstNode, ` `)
							}
							complain(messages.expectedOpening, openIndex)
						}
					}

					if (lastNode) {
						let prevCharIsSpace = paramString.endsWith(` `)
						let closeIndex = openIndex + paramString.length - 1

						if (prevCharIsSpace && primary === `never` && !isParamStringMultiline) {
							fix = () => {
								hasFixed = true
								setSpaceAfter(lastNode, ``)
							}
							complain(messages.rejectedClosing, closeIndex)
						}

						if (!prevCharIsSpace && primary === `always`) {
							fix = () => {
								hasFixed = true
								setSpaceAfter(lastNode, ` `)
							}
							complain(messages.expectedClosing, closeIndex)
						}
					}
				})
			})

			if (hasFixed && fixedSelector) {
				if (ruleNode.raws.selector) ruleNode.raws.selector.raw = fixedSelector
				else ruleNode.selector = fixedSelector
			}

			/**
			 * Reports a pseudo-class parentheses space violation.
			 * @param {string} message - The error message to report.
			 * @param {number} index - The index of the violation.
			 */
			function complain (message, index) {
				report({
					message,
					index,
					endIndex: index,
					result,
					ruleName,
					node: ruleNode,
					fix,
				})
			}
		})
	}
}

/**
 * Tells whether a selector holds a pseudo-class that was given an argument with no node in it,
 * `a:not()` and the empty half of `a:not(,b)` alike, and that the parser does not give back the
 * way the source spells it.
 *
 * The whitespace of such an argument is what the two readings differ in: the parser keeps none
 * of it, and hands a run standing in front of a comma to the node behind it. A pseudo-class
 * whose text comes back where the source has it, `a:not()` and `a:not(,b)` alike, is nothing
 * a fix could damage.
 * @param {import('postcss-selector-parser').Root} selectorTree - The parsed selector.
 * @param {string} selector - The selector the tree was parsed from.
 * @returns {boolean} True if such a pseudo-class stands in the selector.
 */
function hasMangledEmptyArgument (selectorTree, selector) {
	let found = false

	selectorTree.walkPseudos((pseudoNode) => {
		if (!pseudoNode.some((argument) => !firstNodeInside(argument))) return

		let paramString = pseudoNode.map((node) => node.toString()).join(`,`)

		if (!selector.startsWith(`${pseudoNode.value}(${paramString})`, pseudoNode.sourceIndex)) found = true
	})

	return found
}

/**
 * Gets the node standing at the beginning of a container's contents, walking down through
 * the selectors it is nested in.
 * @param {import('postcss-selector-parser').Container} node - The container node.
 * @returns {import('postcss-selector-parser').Node | undefined} The node, or nothing where the container holds none.
 */
function firstNodeInside (node) {
	let target = node.first

	while (target && target.type === `selector`) target = target.first

	return target
}

/**
 * Gets the node standing at the end of a container's contents, walking down through the
 * selectors it is nested in.
 * @param {import('postcss-selector-parser').Container} node - The container node.
 * @returns {import('postcss-selector-parser').Node | undefined} The node, or nothing where the container holds none.
 */
function lastNodeInside (node) {
	let target = node.last

	while (target && target.type === `selector`) target = target.last

	return target
}

/**
 * Sets the space before a node.
 *
 * A comment beside a node moves the whole run around it — the space, the comment,
 * the space — into `raws.spaces`, and `toString()` prints the raw one whenever it
 * is there. A write to `spaces` alone would land on a field nothing reads, so the
 * raw is trimmed alongside it, keeping the comment where the author put it.
 * @param {import('postcss-selector-parser').Node} target - The node to set the space of.
 * @param {string} value - The space value to set.
 * @returns {void}
 */
function setSpaceBefore (target, value) {
	target.spaces.before = value

	let raw = target.raws?.spaces?.before

	if (raw !== undefined) target.raws.spaces.before = value + raw.replace(/^\s+/u, ``)
}

/**
 * Sets the space after a node.
 *
 * The mirror of `setSpaceBefore`, and the side a comment actually reaches: a trailing
 * comment is folded into the raws of the node in front of it whenever whitespace
 * separates the two, which is what makes the raw the printed one here. With nothing
 * between them it is a node of its own instead, and no raw appears. Nothing ever folds
 * into the raws of a pseudo-class's first node — the parser does write `raws.spaces.before`,
 * but on a combinator with a comment in front of it, never here — so the mirror has no
 * reproducer of its own.
 * @param {import('postcss-selector-parser').Node} target - The node to set the space of.
 * @param {string} value - The space value to set.
 * @returns {void}
 */
function setSpaceAfter (target, value) {
	target.spaces.after = value

	let raw = target.raws?.spaces?.after

	if (raw !== undefined) target.raws.spaces.after = raw.replace(/\s+$/u, ``) + value
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
