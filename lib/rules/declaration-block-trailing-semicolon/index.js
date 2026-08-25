import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { hasBlock } from "../../utils/hasBlock/index.js"
import { isCustomProperty } from "../../utils/isCustomProperty/index.js"
import { lastNonCommentNode } from "../../utils/lastNonCommentNode/index.js"
import { optionsMatches } from "../../utils/optionsMatches/index.js"
import { isAtRule, isDeclaration } from "../../utils/typeGuards/index.js"
import { writesIntoInlineComment } from "../../utils/writesIntoInlineComment/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-block-trailing-semicolon`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: `Expected a trailing semicolon`,
	rejected: `Unexpected trailing semicolon`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Asks whether the semicolon behind a node is written whatever the block's `raws.semicolon` says.
 *
 * PostCSS writes one behind a childless at-rule and behind a custom property wherever any sibling stands behind that node, and a comment closing the block is such a sibling. Without it the comment would be folded into the at-rule's parameters or into the custom property's value on the next parse and would stop being a node of the block at all. So `never` has nothing it can take away there, and the warning stands over code the fix leaves alone.
 *
 * That is what `pushBody` of PostCSS's stringifier does, and this restates it rather than asking the stringifier itself, which would mean printing the whole block twice for one warning. The at-rule half of it arrived in PostCSS 8.5.21 and the custom property half in 8.5.22, and the copy that prints the file is neither this package's nor Stylelint's but the one the custom syntax resolves, its stringifier being a subclass of that copy's; where an install resolves an older copy than those, the fix is declined on a node it would have got right, which costs a warning its fix and no more.
 * @param {import('postcss').Node} node - The node the semicolon stands behind.
 * @returns {boolean} True where clearing the block's flag would leave the semicolon where it is.
 */
function semicolonOutlivesTheFlag (node) {
	if (!node.next()) return false

	return (isAtRule(node) && !hasBlock(node)) || (isDeclaration(node) && isCustomProperty(node.prop))
}

/**
 * Requires or disallows a trailing semicolon within declaration blocks.
 * @type {import('stylelint').Rule}
 */
function rule (primary, secondaryOptions) {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`always`, `never`],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignore: [`single-declaration`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		root.walkAtRules((atRule) => {
			if (!atRule.parent) throw new Error(`A parent node must be present`)
			if (atRule.parent === root || atRule !== lastNonCommentNode(atRule.parent) || hasBlock(atRule)) return
			checkLastNode(atRule)
		})

		root.walkDecls((decl) => {
			if (!decl.parent) throw new Error(`A parent node must be present`)
			// A Sass map is a container of declarations with no block of its own, so no semicolon closes it and nothing is asked of its last node — comments or none. The question is left in front of the walk rather than inside it, exactly where it stood
			if (decl.parent.type === `object` || decl !== lastNonCommentNode(decl.parent)) return
			checkLastNode(decl)
		})

		/**
		 * Checks the last node for trailing semicolon violations.
		 * @param {import('postcss').Node} node - The node to check.
		 */
		function checkLastNode (node) {
			if (!node.parent) throw new Error(`A parent node must be present`)

			let hasSemicolon = node.parent.raws.semicolon
			let ignoreSingleDeclaration = optionsMatches(
				secondaryOptions,
				`ignore`,
				`single-declaration`,
			)

			// The option counts declarations, and a comment is not one, so `a { /* c */ color: pink }` holds a single declaration where this line says otherwise: `parent.first` is the comment. That is the option's own reading of what it counts, and it is left as it stands — the block is answered that way whether or not a comment closes it as well, so nothing of the reachability #217 is about turns on it. It is #327
			if (ignoreSingleDeclaration && node.parent.first === node) return
			if (primary === `always` && primary === `never`) throw new Error(`Unexpected primary option: "${primary}"`)

			let message

			if (primary === `always` && !hasSemicolon) message = messages.expected
			else if (primary === `never` && hasSemicolon) message = messages.rejected

			let problemIndex = node.toString().trim().length - 1

			if (message) {
				// The whitespace is handed over to the block's own final raw, which only the node closing the block stands in front of. Nothing else can stand there today — an unterminated bodiless at-rule swallows whatever follows it into `raws.between`, so it has no sibling to speak of — but that used to be guaranteed by the walk asking for `parent.last`, and the walk now looks past the comments instead
				let isBodilessAtRule = isAtRule(node) && !node.next()
				// The whitespace before the closing brace is parsed into the at-rule, not into the block
				let between = isBodilessAtRule ? node.raws.between ?? `` : ``
				let beforeWhitespace = between.replace(TRAILING_WHITESPACE, ``)
				// Where the semicolon lands is this rule's to say, and there are two places it lands. Behind an at-rule the fix rewrites the raws of, it lands on the trailing whitespace that fix hands over to the block, which is the write the guard reads when it is told nothing at all. Behind every other node it lands past the whole printed text: PostCSS writes a declaration as its property, its `between`, its value and the raw of its flag and only then the semicolon, and a bodiless at-rule as its name, its `afterName`, its parameters, its `between` and only then the semicolon. So nothing stands between the node and the write, and a line break the node's own text ends with closes the comment ahead of the semicolon instead of swallowing it
				//
				// The at-rule half of that second place cannot be reached under `always`: an at-rule keeps its sibling only where a semicolon of its own already stands between the two, which sets the flag this message is missing
				let spelledBetween = isBodilessAtRule ? undefined : ``
				// An inline comment ending the node would swallow the semicolon along with the code it was to close. Whichever of the node's texts ends that way is the guard's to know, so the node is handed over whole. That is `always` alone: `never` writes nothing, and what stands in its way instead is the one semicolon PostCSS keeps writing whatever the flag is set to
				//
				// A node carrying a block of its own stands in the way of `always` before the guard is reached at all, since the flag never reaches such a node: the stringifier of `postcss-scss` prints a Sass nested property as its head and its block and drops the semicolon it was handed, exactly as PostCSS drops it for an at-rule carrying a block — which the at-rule walk above turns away for that very reason. That syntax is the only one that reads such a declaration; every other reads `font: 12px { … }` as a rule. So the warning stands over code the fix leaves alone, rather than being called fixed over a write that never lands
				let isFixable = primary === `always`
					? !hasBlock(node) && !writesIntoInlineComment(node, result, spelledBetween)
					: !semicolonOutlivesTheFlag(node)

				report({
					message,
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix: isFixable
						? () => {
							if (primary === `always` && !hasSemicolon) {
								node.parent.raws.semicolon = true

								if (isBodilessAtRule) {
									// Hand the trailing whitespace over to the block, so that the comment and the layout survive
									node.raws.between = beforeWhitespace
									node.parent.raws.after = between.slice(beforeWhitespace.length)
								}
							}
							else if (primary === `never` && hasSemicolon) node.parent.raws.semicolon = false
						}
						: undefined,
				})
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
