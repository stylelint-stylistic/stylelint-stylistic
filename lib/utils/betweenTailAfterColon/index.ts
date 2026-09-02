import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"

/**
 * Reads what stands behind a declaration's colon in `raws.between`.
 *
 * The parser trims the whitespace behind the colon of a worded value onto `raws.between`; on a whitespace-only value — a custom property's above all — it leaves the run in the value and nothing here. A fix of `declaration-colon-space-after` or `declaration-colon-newline-after` writes what it asks for onto this tail either way, where it stands until the file is read back, so a rule running behind such a fix in the same pass — one deferred to the run's end above all (#355) — reads the run it is about partly or wholly here.
 *
 * The declaration's own colon is the one `colonIndexInBetween` finds: a comment in `raws.between` may spell a colon of its own, and everything behind the real one — that comment included — is the tail. Where that reading cannot answer — a stylesheet of a syntax whose tokenizer the plugin cannot reach — the tail is empty rather than the whole raw: the callers read it to see whether a single space is all that stands behind the colon, and a raw handed back whole would tell them it is not, turning a reading the plugin could not make into a fix it writes.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns What `raws.between` holds behind the colon, and nothing where the colon was not found.
 */
export function betweenTailAfterColon (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let colonIndex = colonIndexInBetween(syntax, decl, result)

	return colonIndex === -1 ? `` : (decl.raws.between ?? ``).slice(colonIndex + 1)
}
