/**
 * Asks whether the syntax that parsed a node reads a line in a form feed, and so closes an inline comment on one.
 *
 * Sass ends such a comment on a line feed, on a carriage return and on a form feed alike. Less ends
 * one on the first two, since it normalises the line endings of a file before parsing it, and reads
 * no line in a form feed at all; every other syntax spells no comment with a double slash to begin
 * with. The node itself says which of them holds it: `postcss-scss` keeps the file's spelling of a
 * value or of a set of parameters in a copy of its own whenever it rewrote a `//` comment out of the
 * raw, and that copy standing there is the syntax naming itself.
 * @param {import('postcss').Node} node - The node whose text is being scanned.
 * @returns {boolean} True where a form feed closes an inline comment of that node's text.
 */
export function endsInlineCommentOnFormFeed (node) {
	let raws = /** @type {{ value?: { scss?: string }, params?: { scss?: string } }} */ (node.raws)

	return typeof raws.value?.scss === `string` || typeof raws.params?.scss === `string`
}
