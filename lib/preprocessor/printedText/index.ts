import type { AtRule, Declaration, Rule } from "postcss"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { rewriteInlineComments } from "../../utils/rewriteInlineComments/index.ts"
import { isDeclaration, isRule, type SyntaxRaw } from "../../utils/typeGuards/index.ts"

/**
 * Returns the raw a syntax keeps beside a node's text: `raws.value`, `raws.selector` or `raws.params`.
 * @param node - The declaration, rule or at-rule.
 * @returns The raw, where the parser filled one.
 */
export function rawsOf (node: AtRule | Declaration | Rule): SyntaxRaw | undefined {
	if (isDeclaration(node)) return node.raws.value

	return isRule(node) ? node.raws.selector : node.raws.params
}

/**
 * Returns the node's own text, comments dropped.
 * @param node - The declaration, rule or at-rule.
 * @returns That text.
 */
function plainText (node: AtRule | Declaration | Rule): string {
	if (isDeclaration(node)) return node.value

	return isRule(node) ? node.selector : node.params
}

/**
 * Returns a node's text as the file spells it.
 *
 * PostCSS keeps the text with its comments in a raw beside the comment-less copy on the node, and `postcss-scss` prints from a `scss` copy of its own with the raw's `//` comments rewritten. Warnings are counted in the printed copy and a fix can reach no other, so `scss` is read first, then the raw, then the node's own text.
 * @param node - The declaration, rule or at-rule.
 * @returns The text as spelled.
 */
export function printedText (node: AtRule | Declaration | Rule): string {
	let syntaxRaw = rawsOf(node)

	if (!syntaxRaw) return plainText(node)

	if (typeof syntaxRaw.scss === `string`) return syntaxRaw.scss

	return syntaxRaw.raw || plainText(node)
}

/**
 * Writes a node's text into the copy the syntax prints, keeping its other copies in step.
 *
 * Under `postcss-scss` the `scss` copy takes the fix and the raw is rebuilt with its `//` comments rewritten, so a later rule still reads two copies of one text; writing the node's own property would have PostCSS drop both raws.
 * @param node - The declaration, rule or at-rule.
 * @param text - The text to write.
 */
export function writePrintedText (node: AtRule | Declaration | Rule, text: string): void {
	let syntaxRaw = rawsOf(node)

	if (syntaxRaw) {
		if (typeof syntaxRaw.scss === `string`) {
			syntaxRaw.scss = text
			syntaxRaw.raw = rewriteInlineComments(text)
		}
		else {
			syntaxRaw.raw = text
		}
	}
	else if (isDeclaration(node)) {
		// The parser keeps a value's trailing whitespace in `raws.value`, out of `decl.value`, except a custom property's; the write is laid out the same way, so a same-pass reader of the value's lineness sees what the next parse would (#487)
		let value = isCustomProperty(node.prop) ? text : text.replace(TRAILING_CSS_WHITESPACE, ``)

		if (value !== text) node.raws.value = { raw: text, value }

		node.value = value
	}
	else if (isRule(node)) {
		node.selector = text
	}
	else {
		node.params = text
	}
}
