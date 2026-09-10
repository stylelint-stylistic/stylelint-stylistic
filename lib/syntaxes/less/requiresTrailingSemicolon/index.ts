import type { Declaration, Document, Node, Root } from "postcss"
import type { AtRule } from "postcss-less"
import type { PostcssResult } from "stylelint"

import { printedText } from "../../../preprocessor/printedText/index.ts"
import { readsInlineComments } from "../../../preprocessor/readsInlineComments/index.ts"
import { WHITESPACE_OR_NOTHING } from "../../../regexps.ts"
import { blankComments } from "../../../utils/blankComments/index.ts"
import { findCommentSpans } from "../../../utils/findCommentSpans/index.ts"
import { hasBlock } from "../../../utils/hasBlock/index.ts"
import { isCustomProperty } from "../../../utils/isCustomProperty/index.ts"
import { nodeSyntax } from "../../../utils/nodeSyntax/index.ts"
import { isAtRule, isDeclaration, isSyntax } from "../../../utils/typeGuards/index.ts"
import { isLessDetachedRulesetCall } from "../isLessDetachedRulesetCall/index.ts"

/** The verdict of {@link readsAsLess}, per syntax. */
let lessSyntaxes: WeakMap<object, boolean> = new WeakMap()

/** A Less variable declaration, which `postcss-less` alone marks. */
const LESS_PROBE = `a { @v: pink; }`

/**
 * Asks whether a syntax reads Less, by parsing a probe: a custom syntax has no name to go by.
 *
 * `postcss-less` alone marks the probe's at-rule `variable`, the mark `isStandardSyntaxAtRule` reads Less by. A host language and a syntax that throws are not Less; a host's Less blocks say so on their own roots.
 * @param syntax - The PostCSS syntax the file was parsed with.
 * @returns True where it reads Less.
 */
function readsAsLess (syntax: unknown): boolean {
	if (!isSyntax(syntax)) return false

	let known = lessSyntaxes.get(syntax)

	if (known !== undefined) return known

	let verdict = false

	try {
		let probe: Root | Document = syntax.parse(LESS_PROBE, { from: undefined })

		probe.walkAtRules((atRule) => {
			verdict = Boolean(`variable` in atRule && atRule.variable)

			// The probe holds one at-rule
			return false
		})
	}
	catch {
		// Not Less
	}

	lessSyntaxes.set(syntax, verdict)

	return verdict
}

/**
 * Asks whether Less reads a node `postcss-less` returned as an at-rule as one.
 *
 * Two of the three other things filed under that type are told by shape: a mixin call, marked `mixin`, and a detached ruleset call, {@link isLessDetachedRulesetCall}. The third, a variable declaration `@v: pink`, is answered as an at-rule, since telling it apart takes Less's expression grammar; `never` loses its fix behind such a variable.
 * @param atRule - The node.
 * @returns True where Less reads an at-rule.
 */
function isLessAtRule (atRule: AtRule): boolean {
	if (atRule.mixin) return false

	return !isLessDetachedRulesetCall(atRule)
}

/**
 * Asks whether Less finds no value behind a declaration's colon, which leaves the semicolon the only thing closing it.
 *
 * Nothing but whitespace and comments is no value, so Less refuses `a { color: }` and refuses it just as readily with a comment standing behind the colon ([#358](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/358)). The two kinds of property part on the important flag alone: Less reads a custom property's value permissively and the flag stands there as a value, so `a { --x: !important }` compiles, while `a { color: !important }` is refused along with the rest. A comment survives for neither. `postcss-less` files the flag in `raws.important` for both, so the property says which of the two readings holds.
 * @param decl - The declaration.
 * @param result - The result, whose syntax says what opens a comment.
 * @returns True where nothing Less reads as a value stands behind the colon.
 */
function spellsNoValue (decl: Declaration, result: PostcssResult): boolean {
	if (decl.important && isCustomProperty(decl.prop)) return false

	let value = printedText(decl)

	return WHITESPACE_OR_NOTHING.test(blankComments(value, findCommentSpans(value, readsInlineComments(decl, result))))
}

/**
 * Asks whether the syntax refuses to part with the semicolon behind a node.
 *
 * CSS and Sass make a block's trailing semicolon optional behind every node, which `never` of `declaration-block-trailing-semicolon` rests on; Less reads every blockless at-rule to its semicolon and refuses `a { @extend .b }` without one, and reads a declaration to it wherever {@link spellsNoValue}. {@link isLessAtRule} says which nodes are at-rules to Less; a disagreement costs a warning its fix, never a file Less refuses.
 *
 * An embedded stylesheet is asked under its own block's syntax.
 * @param node - The node whose trailing semicolon is asked about.
 * @param result - The result, holding the syntax.
 * @returns True where the semicolon stays.
 */
export function requiresTrailingSemicolon (node: Node, result: PostcssResult): boolean {
	// A block's own closing brace ends the node, whatever stands in front of it
	if (hasBlock(node)) return false

	let asked = isDeclaration(node) ? spellsNoValue(node, result) : isAtRule(node) && isLessAtRule(node)

	if (!asked) return false

	return readsAsLess(nodeSyntax(node, result))
}
