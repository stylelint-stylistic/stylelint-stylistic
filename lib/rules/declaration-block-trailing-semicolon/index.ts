import type { AtRule, ChildNode, Container, Declaration, Node } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { EVERY_SEMICOLON, INLINE_COMMENT_BREAK, TRAILING_CSS_WHITESPACE, WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { betweenTailAfterColon } from "../../utils/betweenTailAfterColon/index.ts"
import { closesADeclarationBlock, semicolonOutlivesTheFlag } from "../../utils/closedBySemicolon/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../../utils/lastNodeHoldsTheBlockAfter/index.ts"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { type TrailingCommentRun, trailingCommentRun } from "../../utils/trailingCommentRun/index.ts"
import { isAtRule, isComment, isDeclaration, isRoot } from "../../utils/typeGuards/index.ts"
import { keepsEscapedCharacter, readWhitespaceBeforeSemicolon, takingTheSemicolonKeepsEscapedCharacter, whitespaceBeforeSemicolon, writeWhitespaceBeforeSemicolon } from "../../utils/whitespaceBeforeSemicolon/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `declaration-block-trailing-semicolon`

const MESSAGES = defineMessages({
	expected: `Expected a trailing semicolon`,
	rejected: `Unexpected trailing semicolon`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** A raw behind the node closing a block, or the `raws.left` and text of a `//` comment holding code: owner, key, file offset, which a raw of a node another rule built without a source has none of, text, and a copy of the text as long as it with all but its code blanked. */
type HeldRaw = {
	owner: Node,
	key: string,
	start: number | undefined,
	text: string,
	code: string,
}

/**
 * Returns a node's start and end offsets.
 *
 * Where a closing brace ends an at-rule, PostCSS ends it on the last of its parameter tokens that is not whitespace, and a bodiless at-rule with nothing but whitespace in front of that brace has no such token, so it is handed over with `source.end` unset. The end is taken from the node's printed text there, since it holds that whitespace as its own trailing run wherever the `always` fix of a neighboring namespace has moved the run to.
 * @param node - The node whose source is read.
 * @param result - The Stylelint result, whose syntax prints a node the parser gave no end.
 * @returns The offsets, or nothing for a node another rule built without a source, which holds no place in the file.
 */
function offsetsOf (node: Node, result?: PostcssResult): {
	start: number,
	end: number,
} | undefined {
	let { source } = node

	if (!source?.start) return undefined

	let start = source.start.offset

	if (source.end) return { start, end: source.end.offset }

	return { start, end: start + nodeString(node, result).replace(TRAILING_CSS_WHITESPACE, ``).length }
}

/**
 * Returns the offset of the block's closing brace.
 *
 * A free semicolon behind the brace goes into `raws.ownSemicolon`, and PostCSS ends the container at its offset plus the raw's length, so the brace is twice that length back. An inline `style` root has no brace and ends where the root does.
 * @param container - The container the block belongs to.
 * @returns The offset in the file the block ends at, or nothing for a block with no place in it.
 */
function blockEnd (container: Container): number | undefined {
	let end = offsetsOf(container)?.end

	if (end === undefined || isRoot(container)) return end

	let ownSemicolon = container.raws.ownSemicolon

	return ownSemicolon ? end - (2 * ownSemicolon.length) : end - 1
}

/**
 * Moves an offset by a length, where there is an offset to move.
 * @param offset - The offset, or nothing where the node holds no place in the file.
 * @param by - The length.
 * @returns The offset moved, or nothing.
 */
function placedAt (offset: number | undefined, by: number): number | undefined {
	return offset === undefined ? undefined : offset + by
}

/**
 * Returns the raws between the node closing the block and the block's end, in file order, with their start offsets.
 *
 * Only comments follow that node, so a `;` here is code, and so is one a `//` comment holds in its text past the break closing it, unless the flag's semicolon is the text of a `//` comment: that comment runs on to the first break closing it, which a comment it meets may hold. A comment's `raws.before` is anchored to the comment's own start, since `postcss-less` ends an inline comment one character short. A missing raw is skipped, since an empty string would override the PostCSS default.
 * @param syntax - The syntax reading the comments.
 * @param node - The node closing the block.
 * @param result - The Stylelint result.
 * @param flagIsCommentText - Whether the flag's semicolon is the text of such a comment.
 * @returns The raws, each with its owner and key.
 */
function rawsBehind (syntax: Syntax, node: ChildNode, result: PostcssResult, flagIsCommentText: boolean): HeldRaw[] {
	let container = node.parent

	if (!container?.nodes) throw new Error(`The node must stand in a block`)

	let raws: HeldRaw[] = []
	let inComment = flagIsCommentText

	/**
	 * Returns a copy of a raw with the comment blanked up to its first break, which closes it.
	 * @param text - The raw.
	 * @returns The copy.
	 */
	function codeOf (text: string): string {
		if (!inComment) return text

		let lineBreak = text.search(INLINE_COMMENT_BREAK)

		if (lineBreak === -1) return ` `.repeat(text.length)

		inComment = false

		return ` `.repeat(lineBreak) + text.slice(lineBreak)
	}

	for (let sibling of container.nodes.slice(container.index(node) + 1)) {
		let text = sibling.raws.before

		if (typeof text === `string`) raws.push({ owner: sibling, key: `before`, start: placedAt(offsetsOf(sibling)?.start, -text.length), text, code: codeOf(text) })

		let code = isComment(sibling) ? syntax.inlineCommentCode(sibling) : null

		// The break ends every comment it stands in, so the syntax's copy is the code whatever came in front
		if (code !== null && isComment(sibling)) raws.push({ owner: sibling, key: `text`, start: placedAt(offsetsOf(sibling)?.start, `//`.length), text: `${sibling.raws.left ?? ``}${sibling.text}`, code })

		if (inComment && INLINE_COMMENT_BREAK.test(nodeString(sibling, result))) inComment = false
	}

	let after = container.raws.after

	if (typeof after === `string`) raws.push({ owner: container, key: `after`, start: placedAt(blockEnd(container), -after.length), text: after, code: codeOf(after) })

	return raws
}

/**
 * Asks whether a raw spells a semicolon in its code.
 * @param raw - The raw behind the node.
 * @returns True where it does.
 */
function spellsSemicolon (raw: HeldRaw): boolean {
	return raw.code.includes(`;`)
}

/**
 * Asks whether a semicolon closes the node ending the block.
 *
 * A flag set by a comment's text leaves the node closed only by a semicolon of code behind that comment. A Sass nested property with a value closes on its own brace, and `postcss-scss` files the semicolon behind that brace in a raw behind it, the block's tail or a following comment's `raws.before`, rather than in the flag, so it too is closed by a semicolon of code behind it.
 * @param node - The node closing the block.
 * @param raws - The raws behind the node.
 * @param flagIsCommentText - Whether the flag's semicolon is the text of a `//` comment.
 * @returns True where one does.
 */
function endsOnSemicolon (node: ChildNode, raws: HeldRaw[], flagIsCommentText: boolean): boolean {
	if (flagIsCommentText || hasBlock(node)) return raws.some((raw) => spellsSemicolon(raw))

	return Boolean(node.parent?.raws.semicolon)
}

/**
 * Returns the index of the last semicolon behind the node closing the block.
 *
 * `raws.semicolon` covers only the semicolon right behind the node; further ones sit in a following comment's `raws.before` or the block's `raws.after`. The index is counted in the file, as `report` reads it, so it may reach past the node's end; a raw another rule rewrote in the same `--fix` pass shifts it.
 * @param node - The node closing the block.
 * @param result - The Stylelint result, which {@link offsetsOf} reads the syntax from.
 * @param raws - The raws behind the node.
 * @param flagIsCommentText - Whether the flag's semicolon is the text of a `//` comment.
 * @returns The index from the node's start, or undefined without a semicolon.
 */
function trailingSemicolonIndex (node: ChildNode, result: PostcssResult, raws: HeldRaw[], flagIsCommentText: boolean): number | undefined {
	let offsets = offsetsOf(node, result)
	let holder = raws.findLast((raw) => spellsSemicolon(raw))
	// A semicolon with no place in the file, or behind a node with none, is reported at the node's end, as a missing one is
	let nodeEnd = nodeString(node, result).trim().length - 1

	if (holder) return offsets && holder.start !== undefined ? holder.start + holder.code.lastIndexOf(`;`) - offsets.start : nodeEnd

	// The flag's semicolon is the first behind the node, so it is asked last; the node's span ends on it
	if (!node.parent?.raws.semicolon || flagIsCommentText) return undefined

	return offsets ? offsets.end - 1 - offsets.start : nodeEnd
}

/**
 * Returns a raw with the semicolons its code spells taken out.
 * @param raw - The raw behind the node.
 * @returns The text the write leaves.
 */
function withoutTheSemicolonsOfCode (raw: HeldRaw): string {
	return raw.text.replaceAll(EVERY_SEMICOLON, (semicolon, index: number) => (raw.code[index] === `;` ? `` : semicolon))
}

/**
 * Removes every semicolon behind the node, in the flag and in the raws, and the whitespace in front of the flag's own.
 *
 * Removing the flag's alone left one in a raw, which the next parse read as the flag's. The whitespace outlived the semicolon whenever a `declaration-block-semicolon-*-before` rule was listed first; in front of a semicolon in a raw it is a comment's layout and stays. Behind an inline comment nothing is trimmed, and a semicolon in its text or in a comment the code holds stays.
 * @param syntax - The syntax the rule is built over.
 * @param node - The node closing the block.
 * @param result - The Stylelint result.
 * @param raws - The raws behind the node.
 * @param flagIsCommentText - Whether the flag's semicolon is the text of a `//` comment.
 */
function takeTheTrailingSemicolonsAway (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult, raws: HeldRaw[], flagIsCommentText: boolean): void {
	let { parent } = node

	if (!parent) throw new Error(`The node must stand in a block`)

	if (parent.raws.semicolon && !syntax.writesIntoInlineComment(node, result)) writeWhitespaceBeforeSemicolon(syntax, node, result, ``)

	if (!flagIsCommentText) parent.raws.semicolon = false

	for (let raw of raws) {
		let text = withoutTheSemicolonsOfCode(raw)

		// `raws.left` is whitespace, so every semicolon taken stood in the text
		if (raw.key === `text` && isComment(raw.owner)) raw.owner.text = text.slice(String(raw.owner.raws.left ?? ``).length)
		else raw.owner.raws[raw.key] = text
	}
}

/**
 * Returns the text standing behind the node closing the block: the first raw behind it where it spells anything, else the node behind it, else the closing brace.
 * @param node - The node closing the block.
 * @param result - The Stylelint result.
 * @param raws - The raws behind the node.
 * @returns The text, empty where the node ends an inline `style` root.
 */
function textBehind (node: ChildNode, result: PostcssResult, raws: HeldRaw[]): string {
	let next = node.next()

	if (raws[0]?.text) return raws[0].text

	if (next) return nodeString(next, result)

	return node.parent && isRoot(node.parent) ? `` : `}`
}

/**
 * Returns the text standing behind the node once a `never` write has taken the semicolons away: the first raw behind it that still spells anything, else what a raw spelling nothing leaves in front — the node behind it, or the closing brace.
 * @param node - The node closing the block.
 * @param result - The Stylelint result.
 * @param raws - The raws behind the node.
 * @returns The text.
 */
function textBehindTheWrite (node: ChildNode, result: PostcssResult, raws: HeldRaw[]): string {
	let [first] = raws

	if (!first) return textBehind(node, result, raws)

	return withoutTheSemicolonsOfCode(first) || textBehind(node, result, [])
}

/**
 * Returns the run an `always` write leaves in front of the semicolon.
 *
 * Where no whitespace is asked for, the node keeps its own run, as a custom property's value does, unless the at-rule's run moves to the block.
 * @param syntax - The syntax reading the value.
 * @param node - The node closing the block.
 * @param result - The Stylelint result.
 * @param whitespace - The whitespace asked for.
 * @param runMoves - Whether the fix moves the at-rule's trailing run to the block.
 * @returns The run.
 */
function runLeftInFront (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult, whitespace: string, runMoves: boolean): string {
	if (whitespace || runMoves) return whitespace

	return readWhitespaceBeforeSemicolon(syntax, node, result)
}

/**
 * The bodiless at-rule that swallowed what follows the node closing a block into `raws.between`, which leaves it no sibling; not behind a Less mixin call's flag, since the `less` namespace hands that run to the block wherever it finds the flag in the file.
 * @param node - The node closing the block.
 * @returns The at-rule, or undefined.
 */
function swallowingAtRule (node: ChildNode): AtRule | undefined {
	return isAtRule(node) && !node.next() && !node.raws.important ? node : undefined
}

/**
 * Asks whether the warning over a node can carry a fix.
 *
 * Under `always`, no for a node with a block (`postcss-scss` drops a Sass nested property's semicolon), where the flag is the text of an inline comment ending the node, which a break written in front of the semicolon would take out of it, and where a backslash ending the node would read the written text as part of it. Where such a comment ends the node and the semicolon would land inside it, yes only where the run holding the comment can move behind the semicolon ({@link trailingCommentRun}), which the fix then writes in front of the comment. Under `never`, no for the semicolon PostCSS writes regardless of the flag and the ones the syntax requires, which under Less are the semicolon behind a bodiless at-rule and the one behind a declaration it reads no value in, and none either where taking the run in front of the flag's semicolon away would leave a backslash ending the node reading what the file holds behind it. The warning then stands over code the fix leaves alone.
 * @param syntax - The syntax the rule is built over.
 * @param node - The node the semicolon stands behind.
 * @param primary - The primary option.
 * @param spelledBetween - The run between the node and an `always` write, where that write misses the node's trailing whitespace.
 * @param result - The Stylelint result.
 * @param flagIsCommentText - Whether the flag's semicolon is the text of a `//` comment.
 * @param whitespace - The whitespace an `always` write puts in front of the semicolon.
 * @param raws - The raws behind the node, which say what stands behind it before the write and after it.
 * @param trailingRun - The run an `always` write moves behind the semicolon, where the comment ending the node leaves one.
 * @returns True where the fix may be written.
 */
function isFixable (syntax: Syntax, node: AtRule | Declaration, primary: `always` | `never`, spelledBetween: string | undefined, result: PostcssResult, flagIsCommentText: boolean, whitespace: string, raws: HeldRaw[], trailingRun: TrailingCommentRun | null): boolean {
	if (primary === `never`) {
		if (semicolonOutlivesTheFlag(node) || syntax.requiresTrailingSemicolon(node, result)) return false

		// The run is taken away with the flag's own semicolon alone, so anywhere else the character behind a backslash ending the node keeps its place
		if (!node.parent?.raws.semicolon || syntax.writesIntoInlineComment(node, result)) return true

		return takingTheSemicolonKeepsEscapedCharacter(syntax, node, result, textBehindTheWrite(node, result, raws))
	}

	if (hasBlock(node) || flagIsCommentText) return false

	if (syntax.writesIntoInlineComment(node, result, spelledBetween)) return trailingRun !== null

	return keepsEscapedCharacter(syntax, node, result, whitespace, textBehind(node, result, raws))
}

/**
 * Returns the run an `always` write moves behind the semicolon: where the semicolon would land inside an inline comment ending the node, the run holding the comment, where it can move.
 * @param syntax - The rule's syntax.
 * @param node - The node the semicolon stands behind.
 * @param primary - The primary option.
 * @param spelledBetween - The run between the node and an `always` write, where that write misses the node's trailing whitespace.
 * @param result - The Stylelint result.
 * @returns The run, or `null` where nothing moves.
 */
function movableRun (syntax: Syntax, node: AtRule | Declaration, primary: `always` | `never`, spelledBetween: string | undefined, result: PostcssResult): TrailingCommentRun | null {
	if (primary === `never` || !syntax.writesIntoInlineComment(node, result, spelledBetween)) return null

	return trailingCommentRun(syntax, node, result)
}

/** `always` a semicolon behind the last declaration, `never` none. */
export type PrimaryOption = `always` | `never`

/** The secondary options. */
export type SecondaryOptions = {

	/** `single-declaration` passes a block holding one node other than a comment over. */
	ignore?: `single-declaration` | `single-declaration`[],
}

/**
 * Requires or disallows a trailing semicolon within declaration blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always` or `never`.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
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
			if (!closesADeclarationBlock(syntax, atRule) || hasBlock(atRule)) return
			checkLastNode(atRule)
		})

		root.walkDecls((decl) => {
			if (!decl.parent) throw new Error(`A parent node must be present`)
			if (!closesADeclarationBlock(syntax, decl)) return
			checkLastNode(decl)
		})

		/**
		 * Checks the last node of a block.
		 * @param node - The node to check.
		 */
		function checkLastNode (node: AtRule | Declaration): void {
			let { parent } = node

			if (!parent) throw new Error(`A parent node must be present`)

			let flagIsCommentText = syntax.closingSemicolonIsCommentText(node, result)
			let raws = rawsBehind(syntax, node, result, flagIsCommentText)
			let hasSemicolon = endsOnSemicolon(node, raws, flagIsCommentText)
			// `never` asks for the semicolon's place, since the block can end on one the flag does not cover
			let trailingSemicolon = primary === `never` ? trailingSemicolonIndex(node, result, raws, flagIsCommentText) : undefined
			let ignoreSingleDeclaration = optionsMatches(
				secondaryOptions,
				`ignore`,
				`single-declaration`,
			)

			// The last non-comment node being the first too means the block holds no other node
			if (ignoreSingleDeclaration && nextNonCommentNode(parent.first) === node) return

			let message

			if (primary === `always` && !hasSemicolon) message = messages.expected
			else if (primary === `never` && trailingSemicolon !== undefined) message = messages.rejected

			// Under `never` the warning stands on the semicolon; under `always` at the node's end
			let problemIndex = trailingSemicolon ?? nodeString(node, result).trim().length - 1

			if (message) {
				let bodilessAtRule = swallowingAtRule(node)
				// Whether the at-rule runs up to the closing brace, asked before the fix sets the flag, which would answer it no
				let atRuleHoldsTheBlockAfter = Boolean(bodilessAtRule) && lastNodeHoldsTheBlockAfter(parent)
				// The whitespace before the closing brace is parsed into the at-rule, not the block
				let between = typeof bodilessAtRule?.raws.between === `string` ? bodilessAtRule.raws.between : ``
				let beforeWhitespace = between.replace(TRAILING_CSS_WHITESPACE, ``)
				// The written semicolon carries the whitespace the `*-semicolon-space-before` rules ask for, since one listed earlier never sees it
				let whitespace = message === messages.expected && (isDeclaration(node) || isAtRule(node)) ? whitespaceBeforeSemicolon(syntax, node, result) : ``
				// Behind a bodiless at-rule the semicolon lands on the whitespace handed to the block, which the guard reads when told nothing; behind any other node only `whitespace` stands between, and a line break in it closes an inline comment
				let spelledBetween = bodilessAtRule ? undefined : whitespace
				let trailingRun = movableRun(syntax, node, primary, spelledBetween, result)
				report({
					message,
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					...(isFixable(syntax, node, primary, spelledBetween, result, flagIsCommentText, runLeftInFront(syntax, node, result, whitespace, atRuleHoldsTheBlockAfter), raws, trailingRun) && {
						fix: (): void => {
							if (primary === `always` && !hasSemicolon) {
								parent.raws.semicolon = true

								// The trailing whitespace goes to the block first, so the space lands in front of the semicolon; where a semicolon closed the at-rule at the parse, the at-rule holds none of that run and the block's raw holds it already — a shape one copy of the rule reaches no longer, since the semicolon it cleared in the same pass was a second copy's
								if (bodilessAtRule && atRuleHoldsTheBlockAfter) {
									bodilessAtRule.raws.between = beforeWhitespace
									parent.raws.after = between.slice(beforeWhitespace.length)
								}

								// An inline comment ending the node moves behind the semicolon with the run holding it, the run read before the block took its whitespace, since the move writes the whole of it behind the semicolon
								trailingRun?.move()

								if (bodilessAtRule) {
									if (whitespace) writeWhitespaceBeforeSemicolon(syntax, bodilessAtRule, result, whitespace)
								}
								// A whitespace-only value shares its run with the colon, and a colon rule listed earlier may have written onto the tail of `raws.between`; that tail and the value are read as one run, as the semicolon rules do
								else if (isDeclaration(node) && whitespace && !(!node.important && WHITESPACE_OR_NOTHING.test(syntax.read(node)) && betweenTailAfterColon(syntax, node, result) + syntax.read(node) === whitespace)) writeWhitespaceBeforeSemicolon(syntax, node, result, whitespace)
							}
							else if (primary === `never`) takeTheTrailingSemicolonsAway(syntax, node, result, raws, flagIsCommentText)
						},
					}),
				})
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
