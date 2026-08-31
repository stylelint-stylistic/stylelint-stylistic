import type { Declaration } from "postcss"

/**
 * Gets the value of a CSS declaration, spelled as the file spells it.
 *
 * PostCSS keeps a value holding comments in `raws.value.raw` beside the copy it hands back with the comments taken out. The raw is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach, so it is the one a rule reads. The copy a preprocessor keeps beside the pair is its own namespace\u2019s to read.
 * @param decl - The CSS declaration node.
 * @returns The declaration value, including raw whitespace.
 */
import type { SyntaxRaw } from "../typeGuards/index.ts"

export function getDeclarationValue (decl: Declaration): string {
	let syntaxRaw: SyntaxRaw | undefined = decl.raws.value

	if (!syntaxRaw) return decl.value

	return syntaxRaw.raw || decl.value
}
