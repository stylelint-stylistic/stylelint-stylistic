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
