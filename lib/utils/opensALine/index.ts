import type { Root } from "postcss"

import { TRAILING_LINE_BREAK } from "../../regexps.ts"

/**
 * Asks whether a root's text opens a line of the file.
 *
 * A file's own text opens one. So does a `<style>` element's block wherever a break follows the opening tag, since `postcss-html` leaves that break in `raws.codeBefore` and the block begins on the line behind it. An inline `style` attribute's block and a styled template's never do: what `codeBefore` ends in is the quotation mark or the backtick, and the text's first break closes the page's line.
 *
 * The question is put to the text in front of the root rather than to the host it came from, so a block no list of hosts names is answered by what stands there.
 * @param root - The stylesheet.
 * @returns True where nothing but a break, or nothing at all, stands in front of the root's text.
 */
export function opensALine (root: Root): boolean {
	let { codeBefore } = root.raws

	return !codeBefore || TRAILING_LINE_BREAK.test(codeBefore)
}
