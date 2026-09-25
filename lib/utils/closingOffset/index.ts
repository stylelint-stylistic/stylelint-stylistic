import type { Node } from "postcss"

/**
 * Finds the offset behind a container's last character in the file — behind the closing brace, or behind `raws.ownSemicolon` where PostCSS files a stray semicolon there — where the parser kept it right.
 *
 * `postcss-less` reads the rest of the file with a new input where a string a `//` comment opens runs over the comment's break, and repairs the nodes read from it, but not a container opened in front of the comment: its end is counted in the new, shorter text. Such an end is told by a last child read from another input, or by a character in the file that is not the one the container ends on.
 * @param node - The container.
 * @returns The offset in the file, or nothing where the parser's end cannot be trusted.
 */
export function closingOffset (node: Node): number | undefined {
	let end = node.source?.end?.offset
	let text = node.source?.input.css

	if (end === undefined || text === undefined) return undefined

	let last = `last` in node ? (node as { last?: Node }).last : undefined

	if (last?.source && last.source.input !== node.source?.input) return undefined

	let own = node.raws.ownSemicolon
	let rootStart = node.root().source?.start?.offset ?? 0
	let expected = typeof own === `string` && own.length > 0 ? `;` : `}`

	return text[end - rootStart - 1] === expected ? end : undefined
}
