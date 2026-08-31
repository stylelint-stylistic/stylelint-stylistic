import type { Declaration } from "postcss"

import type { SyntaxRaw } from "../typeGuards/index.ts"

/**
 * Sets the value of a CSS declaration, in the copy of it the syntax prints.
 *
 * Where PostCSS keeps a raw of the value beside the copy with the comments taken out, the raw is the one that is printed, so the fix goes there. The pair a preprocessor keeps beside it is its own namespace\u2019s to write.
 * @param decl - The CSS declaration node.
 * @param value - The new value to set.
 * @returns The declaration that was passed in.
 */
export function setDeclarationValue (decl: Declaration, value: string): Declaration {
	let syntaxRaw: SyntaxRaw | undefined = decl.raws.value

	if (syntaxRaw) {
		syntaxRaw.raw = value
	}
	else {
		decl.value = value
	}

	return decl
}
