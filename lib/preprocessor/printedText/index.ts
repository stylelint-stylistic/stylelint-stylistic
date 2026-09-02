import type { AtRule, Declaration, Rule } from "postcss"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { rewriteInlineComments } from "../../utils/rewriteInlineComments/index.ts"
import { isDeclaration, isRule, type SyntaxRaw } from "../../utils/typeGuards/index.ts"

/**
 * The raw a syntax keeps beside a node's own copy of its text, whichever of the three texts the node prints.
 * @param node - The declaration, rule or at-rule.
 * @returns The raw, where the parser filled one.
 */
export function rawsOf (node: AtRule | Declaration | Rule): SyntaxRaw | undefined {
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
 * PostCSS keeps a text holding comments in a raw beside the copy it hands back with the comments taken out, and `postcss-scss` rewrites every `//` comment of that raw into a block comment, keeps the spelling of the file in a copy of its own under `scss` and prints that one. The copy that is printed is the one a rule has to read: it is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach. So the spelled copy is read where a syntax keeps one, the raw where PostCSS kept one, and the node's own text otherwise — the core and the namespaces alike, since which copies stand on a node is the parser's doing and not the rule's.
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
			syntaxRaw.raw = rewriteInlineComments(text)
		}
		else {
			syntaxRaw.raw = text
		}
	}
	else if (isDeclaration(node)) {
		// The parser keeps the trailing whitespace run of every value but a custom property's out of `decl.value`, filing the full text in `raws.value` beside the run-less copy — so a written text is laid out the same way, and a reader of the value's lineness within the pass reads what the next parse would hand it: the break `writeWhitespaceBeforeSemicolon` puts onto the value used to land in `decl.value` itself and read as a line of the declaration until the next parse took it back (#487). A custom property's value is the printed text itself, its trailing run included, to the parser as much as to this write
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
