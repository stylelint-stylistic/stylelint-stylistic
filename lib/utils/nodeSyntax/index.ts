/**
 * The syntax a node was parsed with, which is the one that prints it back.
 *
 * A stylesheet embedded in a page carries the syntax of its own block, and it is that one the question belongs to: the syntax the file was opened with parses the page rather than the style, and one page may hold blocks written in several languages.
 * @param node - The node whose text is being read.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns That syntax, undefined where the file was read as plain CSS.
 */
export function nodeSyntax (node: import("postcss").Node, result?: import("stylelint").PostcssResult): import("postcss").Syntax | undefined {
	let root = node.root()

	return (root.source && (root.source as { syntax?: import("postcss").Syntax }).syntax) || (result && result.opts && result.opts.syntax)
}
