import type { Container, Declaration, Document, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_JS_LINE_TERMINATOR, LEADING_SPACES_AND_TABS } from "../../regexps.ts"
import type { Syntax } from "../index.ts"

/** The syntax of the `styled` namespace: a stylesheet embedded in JavaScript as a styled template, parsed with `postcss-styled-syntax`. The namespace is a superset of the core — plain CSS is read exactly as the core reads it — so a project holding both configures these rules alone for the files that carry templates. */
export let styled: Syntax = {
	namespace: `styled`,
	// A styled root carries the parser's mark, and plain CSS is a file opened with no custom syntax at all: `opts.syntax` cannot answer that, since Stylelint hands PostCSS a syntax of its own for plain CSS too, so the configuration is what is asked
	accepts: (root: Root, result: PostcssResult) => root.raws.styledSyntaxRangeStart !== undefined || result.stylelint?.config?.customSyntax === undefined,
	embedding (node: Node): { indent: string, multiline: boolean } {
		if (!isStyledSyntaxNode(node)) return { indent: ``, multiline: false }

		let { parent } = node

		if (!parent?.parent?.source || !parent.source?.start) throw new Error(`A styled expression must stand inside a node with a source`)

		// The line of the host file the expression opens on carries the indentation the template hangs from, and a template broken over lines holds its content one level deeper than that line
		return {
			indent: lineAt(parent.parent.source.input.css, parent.source.start.line).match(LEADING_SPACES_AND_TABS)?.[0] ?? ``,
			multiline: parent.source.input.css.split(EVERY_JS_LINE_TERMINATOR).length > 1,
		}
	},
	valueEmbedsHostCode: (decl: Declaration) => isStyledSyntaxDeclaration(decl) && decl.value.includes(`\${`),
}

/**
 * Checks whether the node is processed by `postcss-styled-syntax`.
 * @param node - The node to check.
 * @returns True if the node is processed by postcss-styled-syntax, false otherwise.
 */
function isStyledSyntaxNode (node: Node): boolean {
	return node.parent?.raws.styledSyntaxRangeStart !== undefined
}

/**
 * Checks whether the declaration is processed by `postcss-styled-syntax`.
 * @param declaration - The CSS declaration node.
 * @returns True if the declaration is processed by postcss-styled-syntax, false otherwise.
 */
function isStyledSyntaxDeclaration (declaration: Declaration): boolean {
	let parent: Container | Document | undefined = declaration.parent

	while (parent) {
		if (parent.raws.styledSyntaxRangeStart !== undefined) return true

		parent = parent.parent
	}

	return false
}

/**
 * Reads one line of the host file, counted from one the way `postcss-styled-syntax` counts them.
 * @param text - The host file.
 * @param line - The number of the line.
 * @returns The line, without its break.
 */
function lineAt (text: string, line: number): string {
	let found = text.split(EVERY_JS_LINE_TERMINATOR)[line - 1]

	if (found === undefined) throw new Error(`A styled expression starts on a line its file does not hold`)

	return found
}
