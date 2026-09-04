import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { declarationEndsTheStylesheet } from "../declarationEndsTheStylesheet/index.ts"

/**
 * Asks whether the whitespace behind a declaration's colon is the declaration's own text and the text the stylesheet ends on.
 *
 * PostCSS keeps a whitespace-only value in `decl.value` itself, and a custom property is where it keeps one that a plain property would have handed to the raw behind it. Where such a declaration ends the stylesheet, that value is the tail of the file: the root's own raw is empty, and the line break the file closes its last line with stands inside the declaration.
 *
 * `declaration-colon-space-after` writes the whitespace behind the colon where the run stands, which for such a value is the value itself (#371), so a write there takes the file's last break with it. No spelling of that rule's options answers both the option and a closed last line — `always` asks for a single space with no whitespace behind it, `never` for no whitespace at all — so the declaration is passed over rather than drawing a warning nothing can settle, exactly as the run that has left the declaration altogether is (#537).
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
 *
 * The text asked about is the whole of what the declaration prints behind its colon, `raws.between`'s tail and the printed value together, rather than the value alone: a fix of `declaration-colon-newline-after` running ahead in the same pass moves that run onto the tail of `raws.between` and leaves the value empty, and the run is the file's tail there as much as it was in the value.
 *
 * A flag parts the run from the end of the file whatever the value holds, since what the file writes behind it is printed out of the raw the flag carries — `--b: !important\n` keeps the break there — so such a declaration is read like any other.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns True where the declaration prints a run of whitespace behind its colon and the stylesheet ends on it.
 */
export function runInDeclarationEndsTheStylesheet (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean {
	if (decl.important || !declarationEndsTheStylesheet(decl)) return false

	if (colonIndexInBetween(syntax, decl, result) === -1) return false

	let text = betweenTailAfterColon(syntax, decl, result) + syntax.read(decl)

	return text !== `` && WHITESPACE_OR_NOTHING.test(text)
}
