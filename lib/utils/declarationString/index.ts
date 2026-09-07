import type { Declaration } from "postcss"

import type { Syntax } from "../../syntaxes/index.ts"
import { declarationThroughValue } from "../declarationThroughValue/index.ts"

/**
 * Prints a declaration from its property to the end of its bang: what {@link declarationThroughValue} prints, then the flag's raw, or ` !important` where PostCSS kept none.
 *
 * Not {@link nodeString}: a Sass nested property is a declaration with a block, which `postcss-scss` prints, and the callers count positions of a bang, a comma or the semicolon, none of which the block holds.
 * @param syntax - The rule's syntax.
 * @param decl - The declaration.
 * @returns The declaration through its bang.
 */
export function declarationString (syntax: Syntax, decl: Declaration): string {
	let important = decl.important ? (decl.raws.important || ` !important`) : ``

	return declarationThroughValue(syntax, decl) + important
}
