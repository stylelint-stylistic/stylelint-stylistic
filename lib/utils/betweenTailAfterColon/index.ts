import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"

/**
 * Returns what stands behind a declaration's colon in `raws.between`.
 *
 * The parser trims the whitespace behind the colon of a worded value into `raws.between` but leaves a whitespace-only value in the value; the colon rules write onto this tail either way, so a rule deferred to the run's end reads its run partly or wholly here ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)). The colon is the one `colonIndexInBetween` finds, since a comment in the raw may spell one; where it cannot answer, the tail is empty, since the callers ask whether a single space is all that stands there.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns The tail, empty where the colon was not found.
 */
export function betweenTailAfterColon (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let colonIndex = colonIndexInBetween(syntax, decl, result)

	return colonIndex === -1 ? `` : (decl.raws.between ?? ``).slice(colonIndex + 1)
}
