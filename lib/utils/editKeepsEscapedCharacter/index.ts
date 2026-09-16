import { TRAILING_BACKSLASHES } from "../../regexps.ts"
import type { Edit } from "../applyEditsFromEnd/index.ts"

/**
 * Asks whether an edit keeps the character behind a backslash the text in front of it ends on.
 *
 * PostCSS lets a backslash cover no whitespace, so `red \ !important` keeps the flag; the grammar reads a backslash in front of a line break as a delimiter and in front of anything else as an escape. A write changing that character is read with the backslash by one of the two: `red \!important` takes the flag into the value.
 * @param text - The text the edit applies to.
 * @param edit - The edit, indexed in that text.
 * @param edit.start - Where the span it replaces opens.
 * @param edit.end - Where that span closes.
 * @param edit.text - What it writes there.
 * @returns True where the text in front of the edit ends on no odd run of backslashes or the character behind it stays.
 */
export function editKeepsEscapedCharacter (text: string, { start, end, text: written }: Edit): boolean {
	let code = text.slice(0, start)
	let backslashes = code.length - code.replace(TRAILING_BACKSLASHES, ``).length

	if (backslashes % 2 === 0) return true

	return text.charAt(start) === `${written}${text.slice(end)}`.charAt(0)
}
