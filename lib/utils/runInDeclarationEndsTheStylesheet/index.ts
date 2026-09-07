import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { declarationEndsTheStylesheet } from "../declarationEndsTheStylesheet/index.ts"

/**
 * Asks whether a whitespace run behind a declaration's colon is its own text and ends the stylesheet.
 *
 * PostCSS keeps a whitespace-only value in `decl.value`, so the file's closing break stands inside such a declaration. `declaration-colon-space-after` writes the run where it stands ([#371](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371)), taking that break, and no spelling satisfies both the option and a closed last line; the declaration is passed over, like one whose run has left it ([#537](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537), [#546](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546)).
 *
 * The text is `raws.between`'s tail plus the printed value, since a fix of `declaration-colon-newline-after` ahead in the pass moves the run onto that tail. A flag parts the run from the file's end, the break staying in its raw.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns True where a whitespace run behind the colon ends the stylesheet.
 */
export function runInDeclarationEndsTheStylesheet (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean {
	if (decl.important || !declarationEndsTheStylesheet(decl)) return false

	if (colonIndexInBetween(syntax, decl, result) === -1) return false

	let text = betweenTailAfterColon(syntax, decl, result) + syntax.read(decl)

	return text !== `` && WHITESPACE_OR_NOTHING.test(text)
}
