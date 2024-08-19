/**
 * @param {import('postcss').Declaration} decl
 * @returns {string}
 */
export default function getDeclarationValue (decl) {
	let raws = decl.raws

	return (raws.value && raws.value.raw) || decl.value
}
