/**
 * Finds the block comments of a selector, passing over what stands inside a quoted attribute value, since an attribute value may hold any text at all — `[x="/*"]` opens no comment.
 *
 * An escape is read before a quotation mark is, so that a quote escaped outside a string — the one in `.x\'y`, which Less takes for a class of that name — opens nothing.
 * @param {string} selector - The selector to read.
 * @returns {Array<{ start: number, end: number }>} The comments, in the order they stand in.
 */
export function findSelectorBlockComments (selector) {
	let comments = []

	for (let match of selector.matchAll(/\\.|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\/\*.*?\*\//gsu)) {
		if (match[0].startsWith(`/*`)) comments.push({ start: match.index, end: match.index + match[0].length })
	}

	return comments
}
