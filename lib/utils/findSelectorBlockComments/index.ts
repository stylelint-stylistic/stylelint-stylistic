import { EVERY_ESCAPE_STRING_OR_BLOCK_COMMENT } from "../../regexps.ts"

/**
 * Finds a selector's block comments, passing over a quoted attribute value: `[x="/*"]` opens no comment.
 *
 * An escape is read before a quotation mark, so a quote escaped outside a string (`.x\'y`, a Less class name) opens nothing.
 * @param selector - The text as the raw spells it, comments and strings in place.
 * @returns The comments, in order.
 */
export function findSelectorBlockComments (selector: string): Array<{
	start: number,
	end: number,
}> {
	let comments = []

	for (let match of selector.matchAll(EVERY_ESCAPE_STRING_OR_BLOCK_COMMENT)) {
		if (match[0].startsWith(`/*`)) comments.push({ start: match.index, end: match.index + match[0].length })
	}

	return comments
}
