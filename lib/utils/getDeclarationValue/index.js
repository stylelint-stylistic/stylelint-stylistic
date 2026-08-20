/**
 * Gets the value of a CSS declaration, spelled as the file spells it.
 *
 * `postcss-scss` rewrites every `//` comment of a value into a block comment inside `raws.value.raw`, keeps the spelling of the file in `raws.value.scss` and prints that second copy. The copy that is printed is the one a rule has to read: it is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach.
 * @param {import('postcss').Declaration} decl - The CSS declaration node.
 * @returns {string} The declaration value, including raw whitespace.
 */
export function getDeclarationValue (decl) {
	let raws = decl.raws

	if (!raws.value) return decl.value

	if (typeof raws.value.scss === `string`) return raws.value.scss

	return raws.value.raw || decl.value
}
