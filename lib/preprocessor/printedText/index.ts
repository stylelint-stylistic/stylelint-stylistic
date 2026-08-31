import type { AtRule, Declaration, Rule } from "postcss"

import { findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.ts"
import { rewriteInlineComments } from "../../utils/rewriteInlineComments/index.ts"
import { isDeclaration, isRule, type SyntaxRaw } from "../../utils/typeGuards/index.ts"

/**
 * The raw a syntax keeps beside a node's own copy of its text, whichever of the three texts the node prints.
 * @param node - The declaration, rule or at-rule.
 * @returns The raw, where the parser filled one.
 */
function rawsOf (node: AtRule | Declaration | Rule): SyntaxRaw | undefined {
	if (isDeclaration(node)) return node.raws.value

	return isRule(node) ? node.raws.selector : node.raws.params
}

/**
 * The copy of a node's text PostCSS itself hands back, with the comments taken out.
 * @param node - The declaration, rule or at-rule.
 * @returns That copy.
 */
function plainText (node: AtRule | Declaration | Rule): string {
	if (isDeclaration(node)) return node.value

	return isRule(node) ? node.selector : node.params
}

/**
 * Reads the text of a node as the file spells it — a declaration's value, a rule's selector, an at-rule's params — whichever copies the syntax keeps of it.
 *
 * `postcss-scss` rewrites every `//` comment of such a text into a block comment inside the raw, keeps the spelling of the file in a copy of its own under `scss` and prints that second copy. The copy that is printed is the one a rule has to read: it is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach. A syntax keeping no such copy prints the raw, and a node carrying no raw at all prints its own text.
 * @param node - The declaration, rule or at-rule.
 * @returns The text, in the file's own spelling.
 */
export function printedText (node: AtRule | Declaration | Rule): string {
	let syntaxRaw = rawsOf(node)

	if (!syntaxRaw) return plainText(node)

	if (typeof syntaxRaw.scss === `string`) return syntaxRaw.scss

	return syntaxRaw.raw || plainText(node)
}

/**
 * Writes the text of a node into the copy of it the syntax prints, keeping whatever other copies it holds in step.
 *
 * Where `postcss-scss` keeps two copies of the text, the raw one it rewrote the `//` comments in and the one spelled as the file spells it, the second is the one that is printed, so the fix goes there. The raw is kept beside it in step, for the rules that come after: rewriting the comments of the fixed text the way the syntax rewrites them is what fills it, so a rule reading the pair is still handed the two copies of one text. Writing the node's own property instead would have PostCSS throw both raws away, and every comment the text holds with them.
 * @param node - The declaration, rule or at-rule.
 * @param text - The text to write.
 */
export function writePrintedText (node: AtRule | Declaration | Rule, text: string): void {
	let syntaxRaw = rawsOf(node)

	if (syntaxRaw) {
		if (typeof syntaxRaw.scss === `string`) {
			syntaxRaw.scss = text
			syntaxRaw.raw = rewriteInlineComments(text, findInlineCommentSpans(text, true))
		}
		else {
			syntaxRaw.raw = text
		}
	}
	else if (isDeclaration(node)) {
		node.value = text
	}
	else if (isRule(node)) {
		node.selector = text
	}
	else {
		node.params = text
	}
}
