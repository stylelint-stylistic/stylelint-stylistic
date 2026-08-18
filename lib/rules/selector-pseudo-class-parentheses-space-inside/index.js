import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.js"
import { parseSelector } from "../../utils/parseSelector/index.js"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.js"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.js"

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
			let selectorRaws = ruleNode.raws.selector

			let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

			// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw parsed here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw and reported in the file's own coordinates, and a fix is written to both copies.
			let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)
			let fixedSelector = parseSelector(selector, result, ruleNode, (selectorTree) => {
				// Everything below is measured against the tree and written back from it, so the tree has to stand for the file: a fix made in one pseudo-class is written back with the whole selector list, and would carry off whatever the parser has moved anywhere else in it.
				if (!standsForSource(selectorTree, selector)) return

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

					// An inline comment ends with the line break standing behind it, and where that break is the whitespace this end is about, it is what an option would write over. A space there would put the closing parenthesis inside the comment, and taking the break away would do the same, so the end is passed over: neither option can be satisfied, and neither can be asked for.
					if (inlineComments.some((inlineComment) => inlineComment.startIndex < openIndex + paramString.trimEnd().length && openIndex + paramString.trimEnd().length <= inlineComment.endIndex)) lastNode = undefined

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
				if (selectorRaws) {
					selectorRaws.raw = fixedSelector

					// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
					if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, inlineComments)
				}
				else ruleNode.selector = fixedSelector
			}

			/**
			 * Reports a pseudo-class parentheses space violation.
			 * @param {string} message - The error message to report.
			 * @param {number} rawIndex - The index of the violation in the selector as it is parsed.
			 */
			function complain (message, rawIndex) {
				let index = toSelectorSourceIndex(rawIndex, inlineComments)

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
 * Tells whether a parsed selector stands for the source it was parsed from, giving it back what the parser moved on the way where that can be done.
 *
 * `postcss-selector-parser` keeps no whitespace between a comment and the end of the argument it closes: an argument whose last node is a comment has no node to fold the run into, and the parser holds it nowhere else. Where the argument is the last one, the run is handed to whatever stands behind the closing parenthesis, so that `a:not( /*c*\/ ):is(b)` comes back out as `a:not( /*c*\/) :is(b)` — a compound selector turned into a descendant one. Both are put back the way the source spells them: the run goes on the comment, and whatever follows the pseudo-class is given the whitespace the source has in front of it.
 *
 * An argument holding no node at all keeps no whitespace either, and nothing in the tree can hold that one: an empty container prints nothing, whatever its spaces are set to. A selector carrying one is what this answers no for.
 * @param {import('postcss-selector-parser').Root} selectorTree - The parsed selector.
 * @param {string} selector - The selector the tree was parsed from.
 * @returns {boolean} True if the tree gives the selector back the way the source spells it.
 */
function standsForSource (selectorTree, selector) {
	if (String(selectorTree) === selector) return true

	selectorTree.walk((node) => {
		if (node.type !== `selector`) return

		let comment = node.last

		if (!comment || comment.type !== `comment` || comment.spaces.after) return

		let dropped = leadingWhitespace(selector, comment.sourceIndex + comment.value.length)

		if (!dropped) return

		comment.spaces.after = dropped

		// A run standing in front of a comma is only dropped, and the argument behind the comma keeps the whitespace the source gives it. One standing in front of the closing parenthesis is handed on instead, to whatever comes next in the selector — the node behind the pseudo-class, the combinator standing there, or the one that opens the next selector of the list, since the run reaches out of as many parentheses as it has to.
		let following = nodeAfter(node.parent)

		if (following) restoreSpaceBefore(following, selector)
	})

	return String(selectorTree) === selector
}

/**
 * Gets the node that comes after another one in the selector, climbing out of the containers it closes.
 * @param {import('postcss-selector-parser').Node} node - The node to look ahead from.
 * @returns {import('postcss-selector-parser').Node | undefined} The node, or nothing where it closes the selector.
 */
function nodeAfter (node) {
	let current = node

	while (current && current.parent) {
		let next = current.next()

		while (next) {
			if (next.type !== `selector`) return next

			// A selector of a list is a container of its own, and the node standing at its head is what comes next in the text. One holding nothing has no such node, and what comes next stands in the selector after it.
			next = next.first || next.next()
		}

		current = current.parent
	}
}

/**
 * Gives a node the whitespace the source has in front of it, writing it where the node prints that whitespace from.
 *
 * A descendant combinator is the whitespace itself, and the parser folds a comment standing in it into the raws beside it, so the whole run — comment and all — is written as the text the combinator prints. Anything else keeps its whitespace in `spaces.before`, and a raw already holding it is left alone, since nothing here could put back what such a raw carries.
 * @param {import('postcss-selector-parser').Node} node - The node to give the whitespace to.
 * @param {string} selector - The selector the tree was parsed from.
 * @returns {void}
 */
function restoreSpaceBefore (node, selector) {
	if (node.type === `combinator` && (/\s/u).test(node.value)) {
		node.spaces.before = ``
		node.spaces.after = ``
		node.raws = { ...node.raws, spaces: { before: ``, after: `` }, value: whitespaceAndComments(selector, node.sourceIndex) }

		return
	}

	if (node.raws?.spaces?.before === undefined) node.spaces.before = trailingWhitespace(selector, node.sourceIndex)
}

/**
 * Gets the run of whitespace a string has at an index.
 * @param {string} text - The text to read.
 * @param {number} index - The index to read from.
 * @returns {string} The whitespace standing there, empty where none does.
 */
function leadingWhitespace (text, index) {
	let match = (/^\s+/u).exec(text.slice(index))

	return match ? match[0] : ``
}

/**
 * Gets the run of whitespace and comments a string has at an index.
 *
 * A node's own index is where its text begins, and for a namespaced one that is the local name rather than the prefix in front of it, so the run is read for what it is made of rather than measured up to the node behind it.
 * @param {string} text - The text to read.
 * @param {number} index - The index to read from.
 * @returns {string} The whitespace and comments standing there, empty where neither does.
 */
function whitespaceAndComments (text, index) {
	let end = index

	for (;;) {
		let match = (/^(?:\s+|\/\*.*?\*\/)/su).exec(text.slice(end))

		if (!match) return text.slice(index, end)

		end += match[0].length
	}
}

/**
 * Gets the run of whitespace a string has in front of an index.
 * @param {string} text - The text to read.
 * @param {number} index - The index to read up to.
 * @returns {string} The whitespace standing there, empty where none does.
 */
function trailingWhitespace (text, index) {
	let match = (/\s+$/u).exec(text.slice(0, index))

	return match ? match[0] : ``
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
