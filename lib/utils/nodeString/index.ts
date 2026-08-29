import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { nodeSyntax } from "../nodeSyntax/index.ts"

/**
 * Prints a node the way the syntax that parsed it prints it back, which is the way the file spells it.
 *
 * `node.toString()` goes through the stringifier of PostCSS itself, which is not the one the file was opened with, and the two part company in five places: `postcss-scss` keeps a second copy of a value, of a set of parameters and of a selector, with every `//` comment of the file rewritten into a block comment in the copy PostCSS prints; a `Comment` opened by a double slash is printed as a block comment under both custom syntaxes; `postcss-less` holds a mixin call as an at-rule whose `.` lives in `raws.identifier`; the `raws.important` of such a call PostCSS does not print at all; and a Sass nested property is a declaration carrying a block, which `postcss-scss` prints and PostCSS drops, since no declaration of plain CSS has children to print.
 *
 * An index handed to `report` is counted by `Node.positionInside` in the text of the **file**, from the start of the node, so a length taken from the printed copy lands the warning past its mark by whatever the two copies differ in. Asking the syntax that parsed the node is what closes that gap: printing a file back as it was written is what a custom syntax is for, and it is the nearest thing to the file there is to ask.
 *
 * It is not the file itself. `postcss-less` files the whitespace standing around the `!important` of a mixin call into that at-rule's `raws.between` and prints the flag behind that raw rather than in front of it, so `a {`, a break, `\t.m() !important`, a break, `}` comes back with the break moved in front of the flag. That is [#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374), it is older than this util, and no reading here can undo it.
 *
 * A declaration is a different question, and {@link declarationString} rather than this: what a rule reading a bang or a comma of a declaration wants is the text that bang or comma stands in, which stops in front of a nested property's block rather than taking it in.
 * @param node - The node to print.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The node, spelled as the file spells it.
 */
export function nodeString (node: Node, result?: PostcssResult): string {
	// A file read as plain CSS has no syntax of its own, and `toString` reaches for PostCSS's stringifier where it is handed none
	return node.toString(nodeSyntax(node, result))
}
