import type { Declaration } from "postcss"
import styleSearch from "style-search"

/**
 * Reads what stands behind a declaration's colon in `raws.between`.
 *
 * The parser trims the whitespace behind the colon of a worded value onto `raws.between`; on a whitespace-only value — a custom property's above all — it leaves the run in the value and nothing here. A fix of `declaration-colon-space-after` or `declaration-colon-newline-after` writes what it asks for onto this tail either way, where it stands until the file is read back, so a rule running behind such a fix in the same pass — one deferred to the run's end above all (#355) — reads the run it is about partly or wholly here.
 *
 * The declaration's own colon is the first one standing outside a comment, as `sharedRunsOf` finds it: a comment in `raws.between` may spell a colon of its own, and everything behind the real one — that comment included — is the tail.
 * @param decl - The declaration.
 * @returns What `raws.between` holds behind the colon, or all of it where it spells none.
 */
export function betweenTailAfterColon (decl: Declaration): string {
	let between = decl.raws.between ?? ``
	let colonIndex = -1

	styleSearch({ source: between, target: `:`, once: true }, ({ startIndex }) => {
		colonIndex = startIndex
	})

	return between.slice(colonIndex + 1)
}
