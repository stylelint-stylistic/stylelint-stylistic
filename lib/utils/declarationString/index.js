import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { getDeclarationValue } from "../getDeclarationValue/index.js"

/**
 * Prints a declaration as the file spells it.
 *
 * `decl.toString()` prints it through the stringifier of PostCSS itself, which knows nothing of the
 * second copy `postcss-scss` keeps of a value carrying an inline comment and prints the raw one, with
 * every `//` comment rewritten into a block comment. A position counted in that string therefore
 * stands two characters further along per comment than the file spells it, and a fix reading the
 * value through {@link getDeclarationValue} and cutting it at that position cuts it in the wrong place.
 * @param {import('postcss').Declaration} decl - The declaration to print.
 * @returns {string} The declaration, from its property to the end of its bang, if it has one.
 */
export function declarationString (decl) {
	let important = decl.important ? (decl.raws.important || ` !important`) : ``

	// Only the value is spelled in two copies: the property and everything between it and the value
	// are printed as they stand, so the string PostCSS prints holds them exactly as the file does
	return decl.toString().slice(0, declarationValueIndex(decl)) + getDeclarationValue(decl) + important
}
