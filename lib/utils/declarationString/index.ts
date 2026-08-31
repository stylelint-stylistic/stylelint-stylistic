import type { Declaration } from "postcss"

import type { Syntax } from "../../syntaxes/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"

/**
 * Prints a declaration as the file spells it.
 *
 * `decl.toString()` prints it through the stringifier of PostCSS itself, which knows nothing of the second copy `postcss-scss` keeps of a value carrying an inline comment and prints the raw one, with every `//` comment rewritten into a block comment. A position counted in that string therefore stands two characters further along per comment than the file spells it, and a fix reading the value through {@link getDeclarationValue} and cutting it at that position cuts it in the wrong place.
 *
 * This is not {@link nodeString} on a declaration, and the two answer different questions. A Sass nested property is a declaration carrying a block, and `postcss-scss` prints that block where PostCSS prints nothing at all, so `nodeString` hands back `font: 12px { family: serif; }` where this hands back `font: 12px`. What the callers here read is the text a bang, a comma or the semicolon of **that** declaration stands in, and every position they write is counted in it: a block behind the value holds none of the three, and taking one in would put a second copy of everything the block's own declarations carry in front of the checker, and every fix at the wrong end of the text. `indentation` reads none of the three and asks only how wide the declaration is, which is the same question one line further out.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration to print.
 * @returns The declaration, from its property to the end of its bang, if it has one.
 */
export function declarationString (syntax: Syntax, decl: Declaration): string {
	let important = decl.important ? (decl.raws.important || ` !important`) : ``

	// Only the value is spelled in two copies: the property and everything between it and the value are printed as they stand, so the string PostCSS prints holds them exactly as the file does
	return decl.toString().slice(0, declarationValueIndex(decl)) + syntax.read(decl) + important
}
