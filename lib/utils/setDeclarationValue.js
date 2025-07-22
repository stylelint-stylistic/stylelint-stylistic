/** @typedef {import('postcss').Declaration} Declaration */

/**
 * @param {Declaration} decl
 * @param {string} value
 * @returns {Declaration} The declaration that was passed in.
 */
export function setDeclarationValue (decl, value) {
	let raws = decl.raws

	if (raws.value) {
		raws.value.raw = value
	} else {
		decl.value = value
	}

	return decl
}
