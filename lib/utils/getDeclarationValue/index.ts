import type { Declaration } from "postcss"

/**
 * Gets the value of a CSS declaration, spelled as the file spells it.
 *
 * `postcss-scss` rewrites every `//` comment of a value into a block comment inside `raws.value.raw`, keeps the spelling of the file in `raws.value.scss` and prints that second copy. The copy that is printed is the one a rule has to read: it is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach.
 * @param decl - The CSS declaration node.
 * @returns The declaration value, including raw whitespace.
 */
import type { SyntaxRaw } from "../typeGuards/index.ts"

export function getDeclarationValue (decl: Declaration): string {
	let syntaxRaw: SyntaxRaw | undefined = decl.raws.value

	if (!syntaxRaw) return decl.value

	if (typeof syntaxRaw.scss === `string`) return syntaxRaw.scss

	return syntaxRaw.raw || decl.value
}
