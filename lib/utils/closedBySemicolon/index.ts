import type { Declaration, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"
import { neighbourSetting } from "../neighbourSettings/index.ts"
import { nextNonCommentNode } from "../nextNonCommentNode/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { isAtRule, isDeclaration, isRoot } from "../typeGuards/index.ts"
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
 * Asks whether `declaration-block-trailing-semicolon` can fix a declaration: fix on, secondaries it takes, no disable on the line, closing a block, not alone under `ignore: single-declaration`.
 * @param syntax - The asking rule's syntax.
 * @param decl - The declaration.
 * @param result - The Stylelint result, whose disable ranges are read.
 * @param setting - The rule's setting, as `neighbourSetting` reads it.
 * @returns True where the fix reaches the declaration.
 */
function reaches (syntax: Syntax, decl: Declaration, result: PostcssResult, setting: { fixDisabled: boolean, secondary: Record<string, unknown> }): boolean {
	if (setting.fixDisabled || !takesSecondary(setting.secondary)) return false

	let { parent } = decl

	if (!parent || !standsInADeclarationBlock(decl) || lastNonCommentNode(parent) !== decl) return false

	let line = decl.source?.end?.line ?? decl.source?.start?.line

	if (line !== undefined && fixDisabledOnLine(result, addNamespace(TRAILING_SEMICOLON_RULE.name, syntax.namespace), line)) return false

	return !(optionsMatches(setting.secondary, `ignore`, `single-declaration`) && nextNonCommentNode(parent.first) === decl)
}

/**
 * Asks what `declaration-block-trailing-semicolon` leaves behind a declaration: a semicolon under a live `always`, none under a live `never`, nothing where its fix cannot write.
 *
 * `always` writes behind no node with a block and none an inline comment closes; `never` takes no semicolon PostCSS writes regardless or the language requires. The disable line is the declaration's last, where `always` reports.
 * @param syntax - The asking rule's syntax.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True for a semicolon, false for none, nothing where the rule leaves it.
 */
export function trailingSemicolonAsked (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean | undefined {
	let setting = neighbourSetting(syntax, result, TRAILING_SEMICOLON_RULE)

	if (!setting || !reaches(syntax, decl, result, setting)) return undefined

	if (setting.option === `always`) return !hasBlock(decl) && !syntax.writesIntoInlineComment(decl, result, whitespaceBeforeSemicolon(syntax, decl, result)) ? true : undefined

	return !semicolonOutlivesTheFlag(decl) && !syntax.requiresTrailingSemicolon(decl, result) ? false : undefined
}

/**
 * Asks whether a semicolon closes a declaration once `declaration-block-trailing-semicolon` has run.
 *
 * Without the semicolon the run behind the colon is the next node's raw ([#387](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387)); reading the boundary as the rule will leave it frees a reader from configuration order ([#536](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/536)).
 * @param syntax - The asking rule's syntax.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True where a semicolon closes the declaration, or will.
 */
export function closedBySemicolon (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean {
	return trailingSemicolonAsked(syntax, decl, result) ?? !isLastNodeWithoutSemicolon(decl)
}

/**
 * Reads a declaration's printed value as `declaration-block-trailing-semicolon` will leave it.
 *
 * Its `never` takes the whitespace in front of the semicolon too ([#479](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/479)) where no flag or inline comment closes the declaration.
 * @param syntax - The asking rule's syntax.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The printed value, less the run `never` takes.
 */
export function valueAsClosed (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let value = syntax.read(decl)

	if (decl.important || !decl.parent?.raws.semicolon || trailingSemicolonAsked(syntax, decl, result) !== false || syntax.writesIntoInlineComment(decl, result)) return value

	return value.replace(TRAILING_CSS_WHITESPACE, ``)
}
