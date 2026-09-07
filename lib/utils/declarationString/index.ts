import type { Declaration } from "postcss"

import type { Syntax } from "../../syntaxes/index.ts"
import { declarationThroughValue } from "../declarationThroughValue/index.ts"

/**
 * Prints a declaration as the file spells it, from its property to the end of its bang, if it has one.
 *
 * The declaration down to the end of its value is what {@link declarationThroughValue} prints, in the copy the syntax spells it in; behind that this prints the flag — the raw of it where PostCSS kept one, and a spelling of its own where it did not — since what the text is written for is to give the declaration back as the file spells it, for a position to be counted in.
 *
 * This is not {@link nodeString} on a declaration, and the two answer different questions. A Sass nested property is a declaration carrying a block, and `postcss-scss` prints that block where PostCSS prints nothing at all, so `nodeString` hands back `font: 12px { family: serif; }` where this hands back `font: 12px`. What the callers here read is the text a bang, a comma or the semicolon of **that** declaration stands in, and every position they write is counted in it: a block behind the value holds none of the three, and taking one in would put a second copy of everything the block's own declarations carry in front of the checker, and every fix at the wrong end of the text. `indentation` reads none of the three and asks only how wide the declaration is, which is the same question one line further out.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration to print.
 * @returns The declaration, from its property to the end of its bang, if it has one.
 */
export function declarationString (syntax: Syntax, decl: Declaration): string {
	let important = decl.important ? (decl.raws.important || ` !important`) : ``

	return declarationThroughValue(syntax, decl) + important
}
