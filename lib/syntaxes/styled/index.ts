import type { Declaration, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { LEADING_SPACES_AND_TABS, LINE_BREAK } from "../../regexps.ts"
import { isStyledSyntaxDeclaration } from "../../utils/isStyledSyntaxDeclaration/index.ts"
import { isStyledSyntaxNode } from "../../utils/isStyledSyntaxNode/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import type { Syntax } from "../index.ts"

/** The syntax of the `styled` namespace: a stylesheet embedded in JavaScript as a styled template, parsed with `postcss-styled-syntax`. The namespace is a superset of the core — plain CSS is read exactly as the core reads it — so a project holding both configures these rules alone for the files that carry templates. */
export let styled: Syntax = {
	namespace: `styled`,
	accepts: (root: Root, result: PostcssResult) => root.raws.styledSyntaxRangeStart !== undefined || nodeSyntax(root, result) === undefined,
	embedding (node: Node): { indent: string, multiline: boolean } {
		if (!isStyledSyntaxNode(node)) return { indent: ``, multiline: false }

		let { parent } = node

		if (!parent?.parent?.source || !parent.source?.start) throw new Error(`A styled expression must stand inside a node with a source`)

		// The line of the host file the expression opens on carries the indentation the template hangs from, and a template broken over lines holds its content one level deeper than that line
		return {
			indent: lineAt(parent.parent.source.input.css, parent.source.start.line).match(LEADING_SPACES_AND_TABS)?.[0] ?? ``,
			multiline: LINE_BREAK.test(parent.source.input.css),
		}
	},
	valueEmbedsHostCode: (decl: Declaration) => isStyledSyntaxDeclaration(decl) && decl.value.includes(`\${`),
}

/**
 * Reads one line of a text, counted from one as a source position counts them.
 * @param text - The text.
 * @param line - The number of the line.
 * @returns The line, without its break.
 */
function lineAt (text: string, line: number): string {
	let found = text.split(`\n`)[line - 1]

	if (found === undefined) throw new Error(`A styled expression starts on a line its file does not hold`)

	return found
}
