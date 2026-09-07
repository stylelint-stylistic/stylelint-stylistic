import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { nodeSyntax } from "../nodeSyntax/index.ts"

/**
 * Prints a node with the stringifier of the syntax that parsed it.
 *
 * PostCSS's stringifier, which `node.toString()` uses, differs from the file in five places: it prints the copy `postcss-scss` keeps of a value, a parameter set or a selector with every `//` comment rewritten as a block comment; prints a `//` `Comment` as a block comment under both custom syntaxes; leaves out a Less mixin call's `.` (`raws.identifier`) and its `raws.important`; and drops a Sass nested property's block. A `report` index is counted in the file's text, so a differing print lands the warning past its mark.
 *
 * Not the file either: `postcss-less` prints a mixin call's `!important` behind its `raws.between`, so a break behind the flag comes back in front of it ([#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374)).
 *
 * A rule reading a declaration's bang or comma wants {@link declarationString}, which stops in front of a nested property's block.
 * @param node - The node printed.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The node's text.
 */
export function nodeString (node: Node, result?: PostcssResult): string {
	// Handed no syntax (plain CSS), `toString` uses PostCSS's stringifier
	return node.toString(nodeSyntax(node, result))
}
