import type { Container, Declaration, Document, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_JS_LINE_TERMINATOR, LEADING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../css/index.ts"
import type { Syntax } from "../index.ts"

import { hostCodeSpans } from "./hostCodeSpans/index.ts"

/** The `styled` namespace: a stylesheet embedded in JavaScript as a styled template, parsed with `postcss-styled-syntax`. A superset of the core, so a project holding both configures these rules alone. */
export let styled: Syntax = {
	...css,
	namespace: `styled`,
	// A styled root carries the parser's mark; plain CSS is a file opened with no custom syntax, which `opts.syntax` cannot tell
	accepts: (root: Root, result: PostcssResult) => root.raws.styledSyntaxRangeStart !== undefined || result.stylelint?.config?.customSyntax === undefined,
	embedding (node: Node): { indent: string, multiline: boolean } {
		if (!isStyledSyntaxNode(node)) return { indent: ``, multiline: false }

		let { parent } = node

		if (!parent?.parent?.source || !parent.source?.start) throw new Error(`A styled expression must stand inside a node with a source`)

		// The template hangs from its host line's indentation, and a multi-line one holds its content a level deeper
		return {
			indent: lineAt(parent.parent.source.input.css, parent.source.start.line).match(LEADING_SPACES_AND_TABS)?.[0] ?? ``,
			multiline: hostLines(parent.source.input.css).length > 1,
		}
	},
	hostLineEdges (root: Root): { opens: boolean, closes: boolean } {
		if (root.raws.styledSyntaxRangeStart === undefined) return { opens: false, closes: false }

		if (!root.source) throw new Error(`A styled template must have a source`)

		let lines = hostLines(root.source.input.css)
		let last = lines.at(-1) ?? ``

		// The template opens behind the backtick on the host's line; it closes on the host's line where it is not broken over lines, or where its last line is the closing backtick's, holding nothing but that backtick's indentation
		return { opens: true, closes: lines.length === 1 || last.match(LEADING_SPACES_AND_TABS)?.[0] === last }
	},
	valueEmbedsHostCode: (decl: Declaration) => isStyledSyntaxDeclaration(decl) && decl.value.includes(`\${`),
	hostCodeSpans,
	// A template's source holds its escapes before JavaScript cooks them; plain CSS the namespace reads too holds them as written
	readsBackslashesAsWritten: (root: Root) => root.raws.styledSyntaxRangeStart === undefined,
}

/**
 * Asks whether `postcss-styled-syntax` parsed the node.
 * @param node - Any member of the tree, asked about its parent.
 * @returns True where it did.
 */
function isStyledSyntaxNode (node: Node): boolean {
	return node.parent?.raws.styledSyntaxRangeStart !== undefined
}

/**
 * Asks whether `postcss-styled-syntax` parsed the declaration.
 * @param declaration - The one whose ancestors are walked.
 * @returns True where it did.
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
 * Splits a text into lines as the host language counts them.
 * @param text - The template, or the host file.
 * @returns The lines.
 */
function hostLines (text: string): string[] {
	return text.split(EVERY_JS_LINE_TERMINATOR)
}

/**
 * Reads one line of the host file, counted from one.
 * @param text - The host file.
 * @param line - The line number.
 * @returns The line.
 */
function lineAt (text: string, line: number): string {
	let found = hostLines(text)[line - 1]

	if (found === undefined) throw new Error(`A styled expression starts on a line its file does not hold`)

	return found
}
