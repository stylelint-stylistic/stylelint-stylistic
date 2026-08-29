/**
 * The syntax a node was parsed with, which is the one that prints it back.
 *
 * A stylesheet embedded in a page carries the syntax of its own block, and it is that one the question belongs to: the syntax the file was opened with parses the page rather than the style, and one page may hold blocks written in several languages.
 * @param {import('postcss').Node} node - The node whose text is being read.
 * @param {import('stylelint').PostcssResult} [result] - The Stylelint result, which holds the syntax the file was opened with.
 * @returns {any} That syntax, undefined where the file was read as plain CSS.
 */
export function nodeSyntax (node, result) {
	let root = node.root()

	return (root.source && /** @type {{ syntax?: any }} */ (root.source).syntax) || (result && result.opts && result.opts.syntax)
}
