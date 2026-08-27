/**
 * Asks whether the syntax that parsed a node reads a line in a form feed, and so closes an inline comment on one.
 *
 * Sass ends such a comment on a line feed, on a carriage return and on a form feed alike. Less ends one on the first two, since it normalises the line endings of a file before parsing it, and reads no line in a form feed at all; every other syntax spells no comment with a double slash to begin with. The node itself says which of them holds it: `postcss-scss` keeps the file's spelling of a selector, of a value or of a set of parameters in a copy of its own whenever it rewrote a `//` comment out of the raw, and that copy standing there is the syntax naming itself.
 *
 * That is a reading of the node, and {@link inlineCommentReading} is a reading of the syntax, taken from a probe rather than from a raw. Wherever a `//` comment is really there the two say the same thing under `postcss-scss` and under `postcss-less`, and they can part company for a custom syntax: one that leaves the copy behind and yet makes nothing of the probe reads `true` here and names no reading there, so the scan of a text stops at the form feed while the guard in front of a fix is owed both answers and refuses on the one that has the comment running on. Which of the two a caller wants is which question it is putting — where a comment stands in this node's text, or what the language does with the character.
 * @param {import('postcss').Node} node - The node whose text is being scanned.
 * @returns {boolean} True where a form feed closes an inline comment of that node's text.
 */
export function endsInlineCommentOnFormFeed (node) {
	let raws = /** @type {{ selector?: { scss?: string }, value?: { scss?: string }, params?: { scss?: string } }} */ (node.raws)

	return typeof raws.selector?.scss === `string` || typeof raws.value?.scss === `string` || typeof raws.params?.scss === `string`
}
