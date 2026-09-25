import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { nodeSyntax } from "../nodeSyntax/index.ts"

/**
 * Prints a node with the stringifier of the syntax that parsed it.
 *
 * PostCSS's stringifier, which `node.toString()` uses, differs from the file in six places: it prints the copy `postcss-scss` keeps of a value, a parameter set or a selector with every `//` comment rewritten as a block comment; prints a `//` `Comment` as a block comment under both custom syntaxes; leaves out a Less mixin call's `.` (`raws.identifier`) and its `raws.important`; drops a Sass nested property's block; and prints `<style` and `</style` in any case, followed by no word character, and `<!--` with the `<` as `\3c ` (`escapeHTMLInCSS`), three characters longer, save in a comment `postcss-scss` prints, a `//` comment `postcss-less` prints and the value of a Less variable. A `report` index is counted in the file's text, so a differing print lands the warning past its mark.
 *
 * `postcss-less` prints a mixin call's `!important` behind its `raws.between`, which holds the runs on both sides of the flag as parsed; the `less` namespace parts them before a rule reads the root, wherever it finds the flag in the file.
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
