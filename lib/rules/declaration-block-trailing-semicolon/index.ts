import type { AtRule, ChildNode, Container, Declaration, Node } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.ts"
import { lastNonCommentNode } from "../../utils/lastNonCommentNode/index.ts"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule, isDeclaration, isRoot } from "../../utils/typeGuards/index.ts"
import { whitespaceBeforeSemicolon, writeWhitespaceBeforeSemicolon } from "../../utils/whitespaceBeforeSemicolon/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `declaration-block-trailing-semicolon`

const MESSAGES = defineMessages({
	expected: `Expected a trailing semicolon`,
	rejected: `Unexpected trailing semicolon`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Asks whether the node stands in a declaration block, the trailing semicolon of which is what this rule is named for. Whether the node is the one closing that block is asked separately, by each walk.
 *
 * A stylesheet is no declaration block. The semicolon behind the last of its own nodes is every bit as optional as a block's — dart-sass compiles a file ending in `$var: pink`, and `lightningcss` parses one ending in `@import "a"` and prints the semicolon back itself — so what leaves it alone here is not the syntax but this rule's own scope: the semicolon it is named for is the one a declaration block ends on, and the top level of a file ends no block. The walk over at-rules has said so since the rule was written, and the walk over declarations says it now too.
 *
 * The root of an inline `style` attribute is the one exception, since the value of such an attribute is a declaration block and nothing else, and `declaration-block-semicolon-*` read such a root the same way. An at-rule is left outside that exception all the same: an attribute holds declarations, so an at-rule the parser puts on such a root is nothing it has a place for, and the semicolon behind it is not this rule's to move.
 *
 * A Sass map is no declaration block either: a container of declarations with no block of its own, so no semicolon closes it and nothing is asked of its last node, comments or none.
 * @param node - The node the semicolon would stand behind.
 * @returns True where the node stands in a declaration block.
 */
function standsInADeclarationBlock (node: Node): boolean {
	let container = node.parent

	// The two walks throw on a node with no parent before they ask, so this stands for whoever asks next rather than for them
	if (!container || container.type === `object`) return false
	if (!isRoot(container)) return true

	return isDeclaration(node) && isInlineStyleAttribute(container)
}

/**
 * Asks whether the semicolon behind a node is written whatever the block's `raws.semicolon` says.
 *
 * PostCSS writes one behind a childless at-rule and behind a custom property wherever any sibling stands behind that node, and a comment closing the block is such a sibling. Without it the comment would be folded into the at-rule's parameters or into the custom property's value on the next parse and would stop being a node of the block at all. So `never` has nothing it can take away there, and the warning stands over code the fix leaves alone.
 *
 * That is what `pushBody` of PostCSS's stringifier does, and this restates it rather than asking the stringifier itself, which would mean printing the whole block twice for one warning. The at-rule half of it arrived in PostCSS 8.5.21 and the custom property half in 8.5.22, and the copy that prints the file is neither this package's nor Stylelint's but the one the custom syntax resolves, its stringifier being a subclass of that copy's; where an install resolves an older copy than those, the fix is declined on a node it would have got right, which costs a warning its fix and no more.
 * @param node - The node the semicolon stands behind.
 * @returns True where clearing the block's flag would leave the semicolon where it is.
 */
function semicolonOutlivesTheFlag (node: Node): boolean {
	if (!node.next()) return false

	return (isAtRule(node) && !hasBlock(node)) || (isDeclaration(node) && isCustomProperty(node.prop))
}

/** A raw standing behind the node closing a block: the node holding it, the key it is held under, where it opens in the file and what it holds. */
type HeldRaw = {
	owner: Node,
	key: string,
	start: number,
	text: string,
}

/**
 * Reads where a node opens and closes in the file, which every node the parser built says of itself.
 * @param node - The node.
 * @returns The two offsets.
 */
function offsetsOf (node: Node): {
	start: number,
	end: number,
} {
	let { source } = node

	if (!source?.start || !source.end) throw new Error(`The node must carry a source with both of its ends`)

	return { start: source.start.offset, end: source.end.offset }
}

/**
 * Names the offset the block ends at.
 *
 * A container carrying a block of its own ends on its closing brace, and `raws.after` is the text standing in front of that brace. A free semicolon written behind that brace moves the end of the container past it, so the brace is not simply one character back: PostCSS parks such a semicolon in `raws.ownSemicolon`, along with the whitespace in front of it, and sets the container's end to the semicolon's own offset plus the length of that raw. So the semicolon stands the raw's length back from the end, the raw runs back from the semicolon, and the brace stands the raw's length behind the semicolon in turn. `no-extra-semicolons` reads the same raw from its other side.
 *
 * The root of an inline `style` attribute carries no brace at all, so the block of such a root ends where the root itself does. No other root is asked: the two walks turn away every node standing on one, an at-rule of such an attribute included.
 * @param container - The container the block belongs to.
 * @returns The offset in the file the block ends at.
 */
function blockEnd (container: Container): number {
	let { end } = offsetsOf(container)

	if (isRoot(container)) return end

	let ownSemicolon = container.raws.ownSemicolon

	return ownSemicolon ? end - (2 * ownSemicolon.length) : end - 1
}

/**
 * Enumerates the raws standing between the node closing the block and the end of that block, in the order the file spells them, each anchored to the offset it begins at.
 *
 * Only comments can stand behind that node, and between them stand whitespace and semicolons alone, so a semicolon found in one of these raws is code rather than the inside of a comment. That last is the walks' doing rather than the parser's: a comment lands in a `raws.after` wherever an at-rule closes a stylesheet with no semicolon of its own, which is how `postcss-html` hands over the root of an inline `style` attribute whose `@import` a block comment stands behind, and what keeps such a raw away from here is `standsInADeclarationBlock` turning away every at-rule that stands on a root.
 *
 * A comment's `raws.before` is anchored to that comment's own start rather than to the end of whatever stands in front of it, since `postcss-less` ends an inline comment one character short of the text it occupies and a chain of ends would carry that character into every anchor behind it. A raw a node carries none of is left out: PostCSS computes one of its own where a raw is missing, and an empty string written in its place would take that default away.
 * @param node - The node closing the block.
 * @returns The raws, each named by the node holding it and the key it is held under.
 */
function rawsBehind (node: ChildNode): HeldRaw[] {
	let container = node.parent

	if (!container?.nodes) throw new Error(`The node must stand in a block`)

	let raws: HeldRaw[] = []

	for (let sibling of container.nodes.slice(container.index(node) + 1)) {
		let text = sibling.raws.before

		if (typeof text === `string`) raws.push({ owner: sibling, key: `before`, start: offsetsOf(sibling).start - text.length, text })
	}

	let after = container.raws.after

	if (typeof after === `string`) raws.push({ owner: container, key: `after`, start: blockEnd(container) - after.length, text: after })

	return raws
}

/**
 * Finds the semicolon the block ends on — the last one standing behind the node that closes it.
 *
 * The block's `raws.semicolon` speaks of one semicolon alone, the one written straight behind that node's text, and PostCSS parks every further one in a raw: in the `raws.before` of a comment standing behind the node, or in the block's own `raws.after`. So the flag answers whether a semicolon is there and never which one the block ends on, and a rule that takes the last one away has to ask where it stands.
 *
 * The index is counted in the file rather than in the printed copy of the node, and `report` reads it the same way: `positionInside` walks the text of the input, so an index reaching past the end of the node lands on the character the file has there, across a line break as readily as along a line.
 *
 * What the raws are anchored to is the file as it was parsed, so a raw that another rule rewrote earlier in the same `--fix` pass carries this position along by whatever it changed in length. That is #356 seen from the side of the warning rather than of the write: every position this plugin reports is measured against whatever the tree holds at the moment the rule runs, be that a raw, the printed copy of a node or an offset counted in the file, and a neighbour listed ahead has already written.
 * @param node - The node closing the block.
 * @returns The index, counted from the node's own start, or undefined where the block ends on no semicolon.
 */
function trailingSemicolonIndex (node: ChildNode): number | undefined {
	let { start, end } = offsetsOf(node)
	let holder = rawsBehind(node).findLast((raw) => raw.text.includes(`;`))

	if (holder) return holder.start + holder.text.lastIndexOf(`;`) - start

	// The flag is answered last, and only where no raw holds a semicolon, since the one it speaks of is the first standing behind the node rather than the last. Its position is the end of the node's own span: PostCSS carries that span up to the semicolon closing the node, wherever that semicolon stands — behind a comment the value swallowed as readily as behind the value itself
	return node.parent?.raws.semicolon ? end - 1 - start : undefined
}

/**
 * Takes every semicolon standing behind the node away, the one the flag speaks of and the ones the raws hold alike, and takes the whitespace in front of the flag's own along with it.
 *
 * Taking one of them alone away would leave the block ending on a semicolon still, and that is what used to happen: the flag's own semicolon went, the raws kept theirs, and the next parse read the first of those as the flag's in its turn. So one run of `--fix` ended clean over a file the rule still had something to say about, and the work needed a second.
 *
 * The whitespace in front of the flag's own semicolon is the end of the node's value, of the raw of its flag or of a bodiless at-rule's `raws.between` — the three texts `writeWhitespaceBeforeSemicolon` writes into — and once the semicolon is gone nothing reads it back, so it goes with the semicolon it stood in front of (#479): the run a `declaration-block-semicolon-*-before` rule wrote there, or the author's own, used to outlive the semicolon whenever that rule was listed first, and the file went with the order. A semicolon parked in a raw behind the node is another matter: what stands in front of it is a comment's layout, and it stays as it is. And where the node's text ends with an inline comment, the whitespace opens with the line break that closes it, so nothing is trimmed there — the rules about that whitespace decline the same node for the same reason, and no order can put a run there for this fix to meet.
 * @param syntax - The syntax the rule is built over.
 * @param node - The node closing the block.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 */
function takeTheTrailingSemicolonsAway (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult): void {
	let { parent } = node

	if (!parent) throw new Error(`The node must stand in a block`)

	if (parent.raws.semicolon && !syntax.writesIntoInlineComment(node, result)) writeWhitespaceBeforeSemicolon(syntax, node, ``)

	parent.raws.semicolon = false

	for (let raw of rawsBehind(node)) raw.owner.raws[raw.key] = raw.text.replaceAll(`;`, ``)
}

/**
 * Asks whether the problem reported over a node can be handed a fix at all.
 *
 * Under `always` an inline comment ending the node would swallow the semicolon along with the code it was to close. Whichever of the node's texts ends that way is the guard's to know, so the node is handed over whole; which run the write follows is the caller's to say, and it says so with `spelledBetween`.
 *
 * A node carrying a block of its own stands in the way of `always` before that guard is reached at all, since the flag never reaches such a node: the stringifier of `postcss-scss` prints a Sass nested property as its head and its block and drops the semicolon it was handed, exactly as PostCSS drops it for an at-rule carrying a block — which the at-rule walk turns away for that very reason. That syntax is the only one that reads such a declaration; every other reads `font: 12px { … }` as a rule.
 *
 * Under `never` nothing is written, and two other things stand in the way instead. The first is the one semicolon PostCSS keeps writing whatever the flag is set to. The second is the one the language will not part with: Less reads an at-rule carrying no block of its own as running to its semicolon, so taking that semicolon away leaves a file its compiler refuses, whatever the parser makes of the output.
 *
 * Where any of them holds, the option cannot be satisfied over that node at all, and the warning stands over code the fix leaves alone rather than being called fixed over a write that never lands or one that breaks the file.
 * @param syntax - The syntax the rule is built over.
 * @param node - The node the semicolon stands behind.
 * @param primary - The primary option.
 * @param spelledBetween - The run that will stand between the node and an `always` write once the fix has run, where that write does not land on the whitespace the node ends with.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns True where the fix may be written.
 */
function isFixable (syntax: Syntax, node: ChildNode, primary: `always` | `never`, spelledBetween: string | undefined, result: PostcssResult): boolean {
	if (primary === `never`) return !semicolonOutlivesTheFlag(node) && !syntax.requiresTrailingSemicolon(node, result)

	return !hasBlock(node) && !syntax.writesIntoInlineComment(node, result, spelledBetween)
}

/**
 * Requires or disallows a trailing semicolon within declaration blocks.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `never`.
 * @param secondaryOptions - The secondary options: `ignore`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`, secondaryOptions: { ignore?: `single-declaration` | `single-declaration`[] }): RuleCheck {
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
			if (!standsInADeclarationBlock(atRule) || atRule !== lastNonCommentNode(atRule.parent) || hasBlock(atRule)) return
			checkLastNode(atRule)
		})

		root.walkDecls((decl) => {
			if (!decl.parent) throw new Error(`A parent node must be present`)
			if (!standsInADeclarationBlock(decl) || decl !== lastNonCommentNode(decl.parent)) return
			checkLastNode(decl)
		})

		/**
		 * Checks the last node for trailing semicolon violations.
		 * @param node - The node to check.
		 */
		function checkLastNode (node: AtRule | Declaration): void {
			let { parent } = node

			if (!parent) throw new Error(`A parent node must be present`)

			let hasSemicolon = parent.raws.semicolon
			// `never` asks where the block's trailing semicolon stands rather than whether the flag is set, since the flag speaks of one semicolon and the block can end on another. `always` asks the flag, and rightly: what it wants is a semicolon closing the last node, and one standing further behind answers nothing about that
			let trailingSemicolon = primary === `never` ? trailingSemicolonIndex(node) : undefined
			let ignoreSingleDeclaration = optionsMatches(
				secondaryOptions,
				`ignore`,
				`single-declaration`,
			)

			// A comment is a node of the block and nothing the block is about, so it is walked past from the front here exactly as the two walks above walk past it from the back. Each of those has already said that this node is the last node of the block that is not a comment, so asking whether it is the first such node as well asks whether the block holds any other. Everything else the block holds is counted, a nested rule among the rest
			if (ignoreSingleDeclaration && nextNonCommentNode(parent.first) === node) return

			let message

			if (primary === `always` && !hasSemicolon) message = messages.expected
			else if (primary === `never` && trailingSemicolon !== undefined) message = messages.rejected

			// Under `never` the warning stands on the semicolon the rule is named for, counted in the file. Under `always` the flag says no semicolon closes the node, so the warning stands at the end of that node, where one is to be written — and that end is measured in the node as the syntax prints it back, which is the copy the file spells rather than the one PostCSS's own stringifier hands over
			let problemIndex = trailingSemicolon ?? nodeString(node, result).trim().length - 1

			if (message) {
				// The whitespace is handed over to the block's own final raw, which only the node closing the block stands in front of. Nothing else can stand there today — an unterminated bodiless at-rule swallows whatever follows it into `raws.between`, so it has no sibling to speak of — but that used to be guaranteed by the walk asking for `parent.last`, and the walk now looks past the comments instead
				let bodilessAtRule = isAtRule(node) && !node.next() ? node : undefined
				// The whitespace before the closing brace is parsed into the at-rule, not into the block
				let between = typeof bodilessAtRule?.raws.between === `string` ? bodilessAtRule.raws.between : ``
				let beforeWhitespace = between.replace(TRAILING_WHITESPACE, ``)
				// The semicolon `always` writes is written finished, with whatever the rules about the whitespace in front of a semicolon ask to stand there, wherever the configuration lists one: Stylelint runs each rule once and in the order the configuration spells them, so a bare semicolon written behind one of those rules is one it never sees, and the block ends up spelling its last semicolon unlike the others until the next run of `--fix` (#354) — or, behind an at-rule, one `at-rule-semicolon-space-before` reports on every run after and has no fixer to put right (#477)
				let whitespace = message === messages.expected && (isDeclaration(node) || isAtRule(node)) ? whitespaceBeforeSemicolon(syntax, node, result) : ``
				// Where the semicolon lands is this rule's to say, and there are two places it lands. Behind an at-rule the fix rewrites the raws of, it lands on the trailing whitespace that fix hands over to the block, which is the write the guard reads when it is told nothing at all; the space the fix may put in front of it closes no comment, so the guard's answer is the same with it or without. Behind every other node it lands past the whole printed text: PostCSS writes a declaration as its property, its `between`, its value and the raw of its flag and only then the semicolon, and a bodiless at-rule as its name, its `afterName`, its parameters, its `between` and only then the semicolon. So nothing stands between the node and the write but the whitespace the fix itself puts there, and a line break — the node's own text's, or the fix's — closes the comment ahead of the semicolon instead of swallowing it, while a space does not
				//
				// The at-rule half of that second place cannot be reached under `always`: an at-rule keeps its sibling only where a semicolon of its own already stands between the two, which sets the flag this message is missing
				let spelledBetween = bodilessAtRule ? undefined : whitespace
				report({
					message,
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					...(isFixable(syntax, node, primary, spelledBetween, result) && {
						fix: (): void => {
							if (primary === `always` && !hasSemicolon) {
								parent.raws.semicolon = true

								if (bodilessAtRule) {
									// Hand the trailing whitespace over to the block, so that the comment and the layout survive, and only then put the space in front of the semicolon, so that it stands between the parameters and the semicolon rather than behind the whitespace handed over
									bodilessAtRule.raws.between = beforeWhitespace
									parent.raws.after = between.slice(beforeWhitespace.length)

									if (whitespace) writeWhitespaceBeforeSemicolon(syntax, bodilessAtRule, whitespace)
								}
								else if (isDeclaration(node) && whitespace) writeWhitespaceBeforeSemicolon(syntax, node, whitespace)
							}
							else if (primary === `never`) takeTheTrailingSemicolonsAway(syntax, node, result)
						},
					}),
				})
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
