import type { Declaration } from "postcss"

import { findInlineCommentSpans } from "../findInlineCommentSpans/index.ts"
import { rewriteInlineComments } from "../rewriteInlineComments/index.ts"
import type { SyntaxRaw } from "../typeGuards/index.ts"

/**
 * Sets the value of a CSS declaration, in the copy of it the syntax prints.
 *
 * Where `postcss-scss` keeps two copies of a value, the raw one it rewrote the `//` comments in and the one spelled as the file spells it, the second is the one that is printed, so the fix goes there. The raw is kept beside it in step, for the rules that come after: rewriting the comments of the fixed value the way the syntax rewrites them is what fills it, so a rule reading the pair is still handed the two copies of one text.
 * @param decl - The CSS declaration node.
 * @param value - The new value to set.
 * @returns The declaration that was passed in.
 */
export function setDeclarationValue (decl: Declaration, value: string): Declaration {
	let syntaxRaw: SyntaxRaw | undefined = decl.raws.value

	if (syntaxRaw) {
		if (typeof syntaxRaw.scss === `string`) {
			syntaxRaw.scss = value
			syntaxRaw.raw = rewriteInlineComments(value, findInlineCommentSpans(value, true))
		}
		else {
			syntaxRaw.raw = value
		}
	}
	else {
		decl.value = value
	}

	return decl
}
