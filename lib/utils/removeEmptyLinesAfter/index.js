import { EVERY_EMPTY_LINE_RUN, EVERY_SEMICOLON } from "../../regexps.js"

/**
 * Removes empty lines after a node. Mutates the node.
 *
 * The first break of a run is what the run is written back as, so the line that is left is spelled the way the file spells its lines. `context.newline` cannot say: it reads a Windows pair or a line feed and knows no other break.
 *
 * A stray semicolon standing between two breaks is kept and the empty line around it taken away. The readers of this question measure the whitespace with the semicolons taken out, so an empty line spelled `\n;\n` is one to them; leaving the run alone there would report a problem that no run of `--fix` could clear.
 * @template {import('postcss').Rule | import('postcss').AtRule} T
 * @param {T} node - The PostCSS node to modify.
 * @returns {T} The modified node.
 */
export function removeEmptyLinesAfter (node) {
	node.raws.after = node.raws.after ? node.raws.after.replaceAll(EVERY_EMPTY_LINE_RUN, (run, first) => first + (run.match(EVERY_SEMICOLON) || []).join(``)) : ``

	return node
}
