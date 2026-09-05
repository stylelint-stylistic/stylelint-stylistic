import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { LEADING_CSS_WHITESPACE, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"

/**
 * Reads a declaration's value as the file spells it: the text `decl.value` stands for, with the comments the parser took out of it put back.
 *
 * PostCSS builds `decl.value` by walking the tokens of the value and dropping every comment on the way — a comment standing between two runs of whitespace leaves nothing at all behind, and the comments standing in front of the first word go into `raws.between` together with the whitespace around them. So a line break spelled inside a comment, or between a comment and the code beside it, is nowhere in `decl.value`, and a rule counting the lines of that copy counts one line for a declaration the file writes over two (#389). The `-single-line` and `-multi-line` options of the two `declaration-colon-*-after` rules are about the lines a reader sees, so what they count is this text.
 *
 * The runs at either end of the value are laid out here as the parser lays them out in `decl.value`, and only the comments come back. At the head, where the value has a word of its own, the parser trims the run behind the colon into `raws.between` and the comments in front of the word with it: the comments are read back out of that raw, and the whitespace opening it is left where the parser put it, since that run is the one these rules are about rather than a line of the value. Where the value has no word, `raws.between` ends at the colon and the head stays in the value, as it does in `decl.value`. At the tail, the parser keeps the trailing run of every value but a custom property's out of `decl.value`, so it is taken off the printed text here as well: that run is the one in front of the semicolon, and a break a semicolon rule writes into it is no line of the declaration (#487). A custom property's value is the printed text itself to the parser, its trailing run included, and it is read whole.
 *
 * What stands in the middle is the copy the syntax prints, which `syntax.read` hands over: the raw where PostCSS kept one beside a value holding a comment, the file's own spelling where `postcss-scss` keeps a further copy of a value holding an inline comment, and `decl.value` itself where the two are one.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The value as the file spells it, comments and all.
 */
export function declarationValueAsSpelled (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let head = betweenTailAfterColon(syntax, decl, result).replace(LEADING_CSS_WHITESPACE, ``)
	let value = syntax.read(decl)

	return head + (isCustomProperty(decl.prop) ? value : value.replace(TRAILING_CSS_WHITESPACE, ``))
}
