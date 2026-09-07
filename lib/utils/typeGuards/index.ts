import type { AtRule, Comment, Declaration, Document, Node, Parser, Root, Rule, Source as NodeSource, Syntax } from "postcss"
import type { FunctionNode, Node as ValueParserNode } from "postcss-value-parser"

/** The raw of a selector, value or params: the text with comments in `raw`, the cleaned `value`, and under `postcss-scss` the printed `scss` copy with every `//` comment in place. */
export type SyntaxRaw = {
	raw: string,
	value: string,
	scss?: string,
}

/** The source of a root `postcss-html` read out of a page: `style` attribute or not, the language named, the syntax used. */
export type EmbeddedSource = NodeSource & {
	inline?: boolean,
	lang?: string,
	syntax?: Syntax,
}

/**
 * Tells whether a node is a Root.
 * @param node - Any member of a PostCSS tree, asked its type.
 * @returns True for a Root.
 */
export function isRoot (node: Node): node is Root {
	return node.type === `root`
}

/**
 * Tells whether a node is a Rule.
 * @param node - Any member of a PostCSS tree, asked its type.
 * @returns True for a Rule.
 */
export function isRule (node: Node): node is Rule {
	return node.type === `rule`
}

/**
 * Tells whether a node is an AtRule.
 * @param node - Any member of a PostCSS tree, asked its type.
 * @returns True for an AtRule.
 */
export function isAtRule (node: Node): node is AtRule {
	return node.type === `atrule`
}

/**
 * Tells whether a node is a Comment.
 * @param node - Any member of a PostCSS tree, asked its type.
 * @returns True for a Comment.
 */
export function isComment (node: Node): node is Comment {
	return node.type === `comment`
}

/**
 * Tells whether a node is a Declaration.
 * @param node - Any member of a PostCSS tree, asked its type.
 * @returns True for a Declaration.
 */
export function isDeclaration (node: Node): node is Declaration {
	return node.type === `decl`
}

/**
 * Tells whether a node is a Document.
 * @param node - Any member of a PostCSS tree, asked its type.
 * @returns True for a Document.
 */
export function isDocument (node: Node): node is Document {
	return node.type === `document`
}

/**
 * Tells whether a value parser node is a function.
 * @param node - Any member of a value parse, asked its type.
 * @returns True for a function.
 */
export function isValueFunction (node: ValueParserNode): node is FunctionNode {
	return node.type === `function`
}

/**
 * Tells whether a node has a source.
 * @param node - Any member of a PostCSS tree, asked for its source.
 * @returns True with a source.
 */
export function hasSource (node: Node): node is (Node & { source: NodeSource }) {
	return Boolean(node.source)
}

/**
 * Asks whether a value can parse a stylesheet: anything with a `parse` function.
 * @param value - What a configuration named as a syntax.
 * @returns True where it can parse.
 */
export function isSyntax (value: unknown): value is { parse: Parser } {
	// PostCSS itself is a function carrying `parse`; a syntax package is an object
	return (typeof value === `object` || typeof value === `function`) && value !== null && `parse` in value && typeof value.parse === `function`
}
