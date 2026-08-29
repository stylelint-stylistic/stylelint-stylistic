export type Node = import("postcss").Node
export type NodeSource = import("postcss").Source

/** The raw of a selector, a value or a set of params. PostCSS keeps the text with its comments in `raw` beside the copy it hands back in `value`, and `postcss-scss` keeps a third copy under `scss`, spelled as the file spells it with every `//` comment in place, which is the one it prints. */
export type SyntaxRaw = { raw: string, value: string, scss?: string }

/** The source of a root `postcss-html` read out of a page, beside what PostCSS gives every node: whether the block came out of a `style` attribute, the language the block names, and the syntax it was parsed with. */
export type EmbeddedSource = import("postcss").Source & { inline?: boolean, lang?: string, syntax?: import("postcss").Syntax }

/**
 * Checks if a node is a PostCSS Root node.
 * @param node - The node to check.
 * @returns True if the node is a Root, false otherwise.
 */
export function isRoot (node: Node): node is import("postcss").Root {
	return node.type === `root`
}

/**
 * Checks if a node is a PostCSS Rule node.
 * @param node - The node to check.
 * @returns True if the node is a Rule, false otherwise.
 */
export function isRule (node: Node): node is import("postcss").Rule {
	return node.type === `rule`
}

/**
 * Checks if a node is a PostCSS AtRule node.
 * @param node - The node to check.
 * @returns True if the node is an AtRule, false otherwise.
 */
export function isAtRule (node: Node): node is import("postcss").AtRule {
	return node.type === `atrule`
}

/**
 * Checks if a node is a PostCSS Comment node.
 * @param node - The node to check.
 * @returns True if the node is a Comment, false otherwise.
 */
export function isComment (node: Node): node is import("postcss").Comment {
	return node.type === `comment`
}

/**
 * Checks if a node is a PostCSS Declaration node.
 * @param node - The node to check.
 * @returns True if the node is a Declaration, false otherwise.
 */
export function isDeclaration (node: Node): node is import("postcss").Declaration {
	return node.type === `decl`
}

/**
 * Checks if a node is a PostCSS Document node.
 * @param node - The node to check.
 * @returns True if the node is a Document, false otherwise.
 */
export function isDocument (node: Node): node is import("postcss").Document {
	return node.type === `document`
}

/**
 * Checks if a value parser node is a Function node.
 * @param node - The node to check.
 * @returns True if the node is a Function, false otherwise.
 */
export function isValueFunction (node: import("postcss-value-parser").Node): node is import("postcss-value-parser").FunctionNode {
	return node.type === `function`
}

/**
 * Checks if a node has a source property.
 * @param node - The node to check.
 * @returns True if the node has a source, false otherwise.
 */
export function hasSource (node: Node): node is (Node & { source: NodeSource }) {
	return Boolean(node.source)
}

/**
 * Asks whether a value is something a stylesheet can be parsed with: an object carrying a `parse` function, which is all a syntax has to have to be asked a question.
 * @param value - The value a configuration named as a syntax, or nothing at all.
 * @returns True where it can parse.
 */
export function isSyntax (value: unknown): value is { parse: import("postcss").Parser } {
	// PostCSS itself is a function carrying `parse`, and a syntax package is an object carrying one
	return (typeof value === `object` || typeof value === `function`) && value !== null && `parse` in value && typeof value.parse === `function`
}
