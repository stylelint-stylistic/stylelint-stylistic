import type { ChildNode, Declaration, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { SEMICOLONS_OR_WHITESPACE, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"
import { neighborCopies, type NeighborCopy } from "../neighborSettings/index.ts"
import { nextNonCommentNode } from "../nextNonCommentNode/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { isAtRule, isComment, isDeclaration, isRoot } from "../typeGuards/index.ts"
import { whitespaceBeforeSemicolon } from "../whitespaceBeforeSemicolon/index.ts"

/** The trailing-semicolon rule and its primaries. */
const TRAILING_SEMICOLON_RULE = { name: `declaration-block-trailing-semicolon`, options: [`always`, `never`] }

/** Secondary keys Stylelint reads itself. */
const STYLELINT_SECONDARY_KEYS = new Set([`severity`, `message`, `reportDisables`, `disableFix`, `url`])

/** The rule's only secondary value. */
const IGNORE = `single-declaration`

/**
 * Asks whether the rule accepts the secondary options, as `validateOptions` does; refusing, it runs no check.
 * @param secondary - The secondary options.
 * @returns True where the rule runs.
 */
function takesSecondary (secondary: Record<string, unknown>): boolean {
	return Object.entries(secondary).every(([key, value]) => {
		if (STYLELINT_SECONDARY_KEYS.has(key)) return true
		if (key !== `ignore`) return false

		return value === IGNORE || (Array.isArray(value) && value.every((item) => item === IGNORE))
	})
}

/**
 * Asks whether the node stands in a declaration block; the callers ask whether it closes one.
 *
 * The root ends no block, except an inline `style` attribute's; an at-rule there stays out. A Sass map has no block.
 * @param node - The node whose container is asked about.
 * @returns True where it stands in a declaration block.
 */
export function standsInADeclarationBlock (node: Node): boolean {
	let container = node.parent

	// A guard for callers other than the walks
	if (!container || container.type === `object`) return false
	if (!isRoot(container)) return true

	return isDeclaration(node) && isInlineStyleAttribute(container)
}

/**
 * Asks whether the node closes its declaration block: it stands in one, it is the node PostCSS hangs the block's `raws.semicolon` on, and no `//` comment behind it holds code other than semicolons.
 *
 * Where the parser kept code in such a comment's text, a node the language reads stands behind this one.
 * @param syntax - The syntax reading the comments.
 * @param node - The node asked about.
 * @returns True where it closes the block.
 */
export function closesADeclarationBlock (syntax: Syntax, node: ChildNode): boolean {
	let { parent } = node

	if (!parent?.nodes || !standsInADeclarationBlock(node) || lastNonCommentNode(parent) !== node) return false

	return parent.nodes.slice(parent.index(node) + 1).every((sibling) => {
		if (!isComment(sibling)) return true

		let code = syntax.inlineCommentCode(sibling)

		return code === null || SEMICOLONS_OR_WHITESPACE.test(code)
	})
}

/**
 * Asks whether PostCSS writes the semicolon behind a node whatever the block's `raws.semicolon` says.
 *
 * `pushBody` writes one behind a childless at-rule and a custom property wherever a sibling follows, so `never` has nothing to take; restated rather than printed per warning, and false under a PostCSS older than 8.5.22.
 * @param node - The at-rule or declaration a sibling follows.
 * @returns True where clearing the flag leaves the semicolon.
 */
export function semicolonOutlivesTheFlag (node: Node): boolean {
	if (!node.next()) return false

	return (isAtRule(node) && !hasBlock(node)) || (isDeclaration(node) && isCustomProperty(node.prop))
}

/**
 * Asks whether a copy of `declaration-block-trailing-semicolon` can fix a declaration: fix on, secondaries it takes, no disable on the line under its name, closing a block, not alone under `ignore: single-declaration`.
 * @param copy - The copy, as `neighborCopies` reads it.
 * @param decl - The declaration.
 * @param result - The Stylelint result, whose disable ranges are read.
 * @returns True where the fix reaches the declaration.
 */
function reaches (copy: NeighborCopy, decl: Declaration, result: PostcssResult): boolean {
	if (copy.fixDisabled || !takesSecondary(copy.secondary)) return false

	let { parent } = decl

	if (!parent || !closesADeclarationBlock(copy.syntax, decl)) return false

	let line = decl.source?.end?.line ?? decl.source?.start?.line

	if (line !== undefined && fixDisabledOnLine(result, copy.name, line)) return false

	return !(optionsMatches(copy.secondary, `ignore`, `single-declaration`) && nextNonCommentNode(parent.first) === decl)
}

/**
 * Asks what one copy of `declaration-block-trailing-semicolon` writes behind a declaration, reading it through the syntax of its own namespace: a semicolon under a live `always`, none under a live `never`, nothing where its fix cannot write.
 *
 * `always` writes behind no node with a block and none an inline comment closes; `never` takes no semicolon PostCSS writes regardless or the language requires; neither acts on a flag a comment's text set. The disable line is the declaration's last, where `always` reports.
 * @param copy - The copy.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True for a semicolon, false for none, nothing where the copy leaves it.
 */
function writtenBy (copy: NeighborCopy, decl: Declaration, result: PostcssResult): boolean | undefined {
	let { syntax } = copy

	if (!reaches(copy, decl, result) || syntax.closingSemicolonIsCommentText(decl, result)) return undefined

	if (copy.option === `always`) return !hasBlock(decl) && !syntax.writesIntoInlineComment(decl, result, whitespaceBeforeSemicolon(syntax, decl, result)) ? true : undefined

	return !semicolonOutlivesTheFlag(decl) && !syntax.requiresTrailingSemicolon(decl, result) ? false : undefined
}

/**
 * Reads what the copy of `declaration-block-trailing-semicolon` reading the root leaves behind a declaration, and the syntax that copy reads through.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The semicolon and the syntax, or nothing where no copy writes.
 */
function lastWrite (decl: Declaration, result: PostcssResult): { semicolon: boolean, syntax: Syntax } | undefined {
	let [copy] = neighborCopies(decl, result, TRAILING_SEMICOLON_RULE)
	let semicolon = copy && writtenBy(copy, decl, result)

	return copy && semicolon !== undefined ? { semicolon, syntax: copy.syntax } : undefined
}

/**
 * Asks what `declaration-block-trailing-semicolon` leaves behind a declaration, as its last writing copy leaves it.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True for a semicolon, false for none, nothing where the rule leaves it.
 */
export function trailingSemicolonAsked (decl: Declaration, result: PostcssResult): boolean | undefined {
	return lastWrite(decl, result)?.semicolon
}

/**
 * Asks whether a semicolon closes a declaration once `declaration-block-trailing-semicolon` has run.
 *
 * Without the semicolon the run behind the colon is the next node's raw; reading the boundary as the rule will leave it frees a reader from configuration order.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True where a semicolon closes the declaration, or will.
 */
export function closedBySemicolon (decl: Declaration, result: PostcssResult): boolean {
	return trailingSemicolonAsked(decl, result) ?? !isLastNodeWithoutSemicolon(decl)
}

/**
 * Reads a declaration's printed value as `declaration-block-trailing-semicolon` will leave it.
 *
 * Its `never` takes the whitespace in front of the semicolon too where no flag or inline comment closes the declaration. A `never` copy finding a semicolon takes the run.
 * @param syntax - The asking rule's syntax, which reads the value.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The printed value, less the run a `never` copy takes.
 */
export function valueAsClosed (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let value = syntax.read(decl)

	if (decl.important) return value

	let [copy] = neighborCopies(decl, result, TRAILING_SEMICOLON_RULE)

	if (copy && decl.parent?.raws.semicolon && writtenBy(copy, decl, result) === false && !copy.syntax.writesIntoInlineComment(decl, result)) return value.replace(TRAILING_CSS_WHITESPACE, ``)

	return value
}
