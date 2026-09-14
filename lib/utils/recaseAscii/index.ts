import { EVERY_ASCII_LOWER_CASE_RUN, EVERY_ASCII_UPPER_CASE_RUN } from "../../regexps.ts"

/**
 * Recases the ASCII letters of a text and nothing else.
 *
 * CSS compares a unit identifier, a keyword or a property name ASCII case-insensitively, so the ASCII letters are the only case such a name has: recasing any other code point makes another name, and the built-in recases do worse where a mapping is not one code point to one: `ß` uppercases to `SS`, `İ` lowercases to `i` and a combining dot (#653).
 * @param text - The name, or the run of the file it stands in.
 * @param to - The case asked for.
 * @returns The text with its ASCII letters in that case.
 */
export function recaseAscii (text: string, to: `lower` | `upper`): string {
	return to === `lower` ? text.replaceAll(EVERY_ASCII_UPPER_CASE_RUN, (run) => run.toLowerCase()) : text.replaceAll(EVERY_ASCII_LOWER_CASE_RUN, (run) => run.toUpperCase())
}
