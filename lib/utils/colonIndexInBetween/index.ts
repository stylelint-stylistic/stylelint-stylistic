import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"

/**
 * Finds the declaration's own colon in `raws.between`.
 *
 * The raw holds everything between the property and the value, and a comment or a string in it may spell a colon. The syntax answers with its parser's tokenizer, to which a colon inside a comment, a string, a parenthesised group, an at-word or an escape is text. The property is tokenized in front, since a tokenizer reads a parenthesis against the nearest word before it, `url` holding an address. See [#92](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92), [#388](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/388) and [#499](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/499).
 * @param syntax - The syntax whose tokenizer answers.
 * @param decl - The declaration.
 * @param result - The Stylelint result handed to the tokenizer.
 * @returns The index in `raws.between`, or `-1`.
 */
export function colonIndexInBetween (syntax: Syntax, decl: Declaration, result: PostcssResult): number {
	return syntax.colonTokenIndex(decl.prop, decl.raws.between ?? ``, decl, result)
}
