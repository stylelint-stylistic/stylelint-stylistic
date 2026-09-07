import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { LEADING_CSS_WHITESPACE, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"

/**
 * Reads a declaration's value as the file spells it: the text `decl.value` stands for, with the comments the parser took out put back.
 *
 * PostCSS drops every comment from `decl.value`, the ones in front of the first word into `raws.between`, so a break in or beside a comment is nowhere in it and a rule counting lines missed one ([#389](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/389)). The `-single-line` and `-multi-line` options of the two `declaration-colon-*-after` rules count the lines a reader sees, so this is their text.
 *
 * Only the comments come back; the runs at either end stay as `decl.value` lays them out. At the head the comments are read back out of `raws.between` and the whitespace opening that raw is left, since that run is what those rules are about; where the value has no word the raw ends at the colon. At the tail the trailing run comes off as the parser takes it, except for a custom property's: it is the run in front of the semicolon, and a break a semicolon rule writes into it is no line of the declaration ([#487](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/487)).
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns The value as the file spells it, comments and all.
 */
export function declarationValueAsSpelled (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let head = betweenTailAfterColon(syntax, decl, result).replace(LEADING_CSS_WHITESPACE, ``)
	let value = syntax.read(decl)

	return head + (isCustomProperty(decl.prop) ? value : value.replace(TRAILING_CSS_WHITESPACE, ``))
}
