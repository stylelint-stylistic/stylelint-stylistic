/**
 * A replacement for one span of a text, addressed in that text as it stood before any edit was applied.
 * @typedef {{ start: number, end: number, text: string }} Edit
 */

/**
 * Applies a list of edits to a text.
 *
 * Every index in the list is counted in the text as it was handed over, and such an index goes stale the moment a write standing in front of it changes the length of what it replaces. Applying the edits from the end backwards is what keeps each of them the index it was measured as: a write moves only what stands behind it, and everything behind it has already been written.
 *
 * The edits are given in whatever order they were collected in, and no two of them may cover the same character or open at the same index: what a caller means by two writes into one place is for the caller to spell as one edit.
 * @param {string} text - The text to edit.
 * @param {Edit[]} edits - The edits to apply.
 * @returns {string} The text with every edit written into it.
 */
export function applyEditsFromEnd (text, edits) {
	let edited = text

	for (let edit of edits.toSorted((a, b) => b.start - a.start)) {
		edited = edited.slice(0, edit.start) + edit.text + edited.slice(edit.end)
	}

	return edited
}

/**
 * Adds an edit to a list, folding it into the edit already standing on the same span.
 *
 * Two fixes can write into one and the same place. An empty function is one: everything the file spells between its parentheses is whitespace the parser hands back as `before`, so the span in front of the closing parenthesis is the same empty span as the one behind the opening one, and an `always` option asks for a write in both. A whitespace node standing between two comments is another: a fixer walking out from the opening parenthesis empties it, and one walking back from the closing parenthesis empties it again.
 *
 * {@link applyEditsFromEnd} takes no two edits opening at one index, so the second write is appended to the text of the first. The order is the order the writes were collected in, which is the order they stand in the text: what a fix puts behind an opening parenthesis is collected before what another puts in front of the closing one.
 *
 * One span and the same span is the whole of what is folded. Two edits that merely overlap are left apart, since folding them would put a text somewhere neither of them named and hide a caller reading its own value wrongly — such a pair is one no caller may build, and one nothing here can repair.
 * @param {Edit[]} edits - The list to add to, which is edited in place.
 * @param {Edit} edit - The edit to add.
 * @returns {void}
 */
export function addEdit (edits, edit) {
	let standing = edits.find(({ start, end }) => start === edit.start && end === edit.end)

	if (standing) standing.text += edit.text
	else edits.push(edit)
}
