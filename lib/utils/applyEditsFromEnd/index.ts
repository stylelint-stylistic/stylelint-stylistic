/** A replacement for one span, indexed in the unedited text. */
export type Edit = {
	start: number,
	end: number,
	text: string,
}

/**
 * Applies edits to a text from the end, so the original indices stay valid; no two may overlap or open at one index.
 * @param text - The original the indices count in.
 * @param edits - The edits, in any order.
 * @returns The edited text.
 */
export function applyEditsFromEnd (text: string, edits: Edit[]): string {
	let edited = text

	for (let edit of edits.toSorted((a, b) => b.start - a.start)) {
		edited = edited.slice(0, edit.start) + edit.text + edited.slice(edit.end)
	}

	return edited
}

/**
 * Adds an edit to a list, appending its text to an edit on the same span.
 *
 * Two fixes of one rule can name one span, as the `never-multi-line` fixes of `function-parentheses-newline-inside` do over the whitespace between two comments, while {@link applyEditsFromEnd} takes no two edits at one index. An overlapping pair is the caller's bug.
 * @param edits - The list, edited in place.
 * @param edit - The edit to add, joined to one on its span.
 */
export function addEdit (edits: Edit[], edit: Edit): void {
	let standing = edits.find(({ start, end }) => start === edit.start && end === edit.end)

	if (standing) standing.text += edit.text
	else edits.push(edit)
}
