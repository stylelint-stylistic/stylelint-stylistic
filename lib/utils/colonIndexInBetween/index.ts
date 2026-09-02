import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"

/**
 * Finds the declaration's own colon in `raws.between`.
 *
 * PostCSS files everything the file spells between the property and the value in that raw, comments and strings included, and any of them may spell a colon of its own — a URL's in a comment, for one. The declaration's colon is the one the parser stopped its reading at, and every reader of the raw asks for it here: the checker the two `declaration-colon-space-*` rules share, the shared-run reading of `writesSharedRun`, the tail `betweenTailAfterColon` hands the semicolon rules, and `declaration-colon-newline-after`, which used to walk the raw character by character and take a comment's colon for the declaration's.
 *
 * Which colon that is, the syntax answers with the tokenizer its own parser reads by, since every reading of the question written by hand parted from one parser or another somewhere: a colon inside a comment, a string, a parenthesised group, an at-word or an escape is text to the tokenizer and no colon token at all. The property is read in front of the raw rather than the raw alone, because a tokenizer reads a parenthesis against a word it read earlier — the parentheses of `url` hold an address and no code — and the nearest such word is the property's. PostCSS keeps those words for the whole file and takes one off at every parenthesis, so where the word it would take is one this reading has not seen — a bare `url` standing earlier in the file, met by a raw that opens a second parenthesis, or a property the parser handed back unlike the text the file spells there — the answer parts from the parser's. A raw opening a parenthesis at all is no CSS, and nothing in the corpus this was measured over spells one.
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/388
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/499
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The index of the colon in `raws.between`, or `-1` where the raw spells none the parser read as one.
 */
export function colonIndexInBetween (syntax: Syntax, decl: Declaration, result: PostcssResult): number {
	return syntax.colonTokenIndex(decl.prop, decl.raws.between ?? ``, decl, result)
}
