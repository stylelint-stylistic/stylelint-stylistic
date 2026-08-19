import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { getDeclarationValue } from "../getDeclarationValue/index.js"

/**
 * Prints a declaration as the file spells it.
 *
 * `decl.toString()` prints it through the stringifier of PostCSS itself, which prints the value the
 * way the parser stored it. A fix reading the value through {@link getDeclarationValue} and cutting
 * it at a position counted in that string has to count the position in the same copy of the value,
 * so the string is built from the copy the getter reads.
 * @param {import('postcss').Declaration} decl - The declaration to print.
 * @returns {string} The declaration, from its property to the end of its bang, if it has one.
 */
export function declarationString (decl) {
	let important = decl.important ? (decl.raws.important || ` !important`) : ``

	// Only the value is spelled in two copies: the property and everything between it and the value
	// are printed as they stand, so the string PostCSS prints holds them exactly as the file does
	return decl.toString().slice(0, declarationValueIndex(decl)) + getDeclarationValue(decl) + important
}
