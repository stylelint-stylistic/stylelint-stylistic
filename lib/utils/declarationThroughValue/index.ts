import type { Declaration } from "postcss"

import type { Syntax } from "../../syntaxes/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"

/**
 * Prints a declaration from its property to the end of its value, as the file spells it.
 *
 * `decl.toString()` prints the declaration through the stringifier of PostCSS itself, which knows nothing of the second copy `postcss-scss` keeps of a value carrying an inline comment and prints the raw one, with every `//` comment rewritten into a block comment. A position counted in that string therefore stands two characters further along per comment than the file spells it, and a fix reading the value through `syntax.read` and cutting it at that position cuts it in the wrong place. Only the value is spelled in two copies: the property and everything between it and the value are kept once, so the string PostCSS prints holds them as every syntax prints them, and it is cut in front of the value and the copy the syntax prints laid behind the cut.
 *
 * What stands behind the value is the caller's to name, and the two callers name different things: {@link declarationString} prints the flag there, so that a position can be counted in the declaration as the file spells it, while {@link declarationColonSource} prints the run that ran on past the declaration and a sentinel, so that a checker reading past the colon has a character to ask about where the file spells none. Neither text is the other with something taken off — `a { color:  !important; }` prints as `color:  !important` to the one and as `color:  xxx` to the other — so neither is built over the other.
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/415
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration to print.
 * @returns The declaration, from its property to the end of its value.
 */
export function declarationThroughValue (syntax: Syntax, decl: Declaration): string {
	return decl.toString().slice(0, declarationValueIndex(decl)) + syntax.read(decl)
}
