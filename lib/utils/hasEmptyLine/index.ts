import { EMPTY_LINE } from "../../regexps.ts"

/**
 * Checks whether a string holds an empty line.
 * @param string - A raw, undefined where PostCSS keeps none.
 * @returns True where it does.
 */
export function hasEmptyLine (string: string | undefined): boolean {
	if (string === `` || string === undefined) return false

	return EMPTY_LINE.test(string)
}
