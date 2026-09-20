/**
 * Replaces every run of line breaks a pattern finds in the blanked copy, in the copy and the text alike: the copy is the text's length with every comment spaced out, so every run found lies outside the comments, where the two agree.
 * @param blanked - The text with comments blanked.
 * @param text - The text the copy was blanked from.
 * @param pattern - A forbidden run.
 * @param replacement - The allowed run.
 * @returns The copy and the text.
 */
export function replaceRuns (blanked: string, text: string, pattern: RegExp, replacement: string): [string, string] {
	let blankedPieces = []
	let pieces = []
	let index = 0

	for (let run of blanked.matchAll(new RegExp(pattern, `gmu`))) {
		blankedPieces.push(blanked.slice(index, run.index), replacement)
		pieces.push(text.slice(index, run.index), replacement)
		index = run.index + run[0].length
	}

	blankedPieces.push(blanked.slice(index))
	pieces.push(text.slice(index))

	return [blankedPieces.join(``), pieces.join(``)]
}
