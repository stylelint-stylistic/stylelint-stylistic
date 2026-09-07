import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { valueAsClosed } from "../closedBySemicolon/index.ts"
import { declarationThroughValue } from "../declarationThroughValue/index.ts"
import { runPastDeclaration } from "../runPastDeclaration/index.ts"

/**
 * Builds the text a rule reads to see what a declaration prints behind its colon.
 *
 * PostCSS puts the whitespace behind the colon in `raws.between` only where the value has a word; otherwise `raws.between` ends at the colon and the run stays at the head of the value. So the text is the declaration through its value, as {@link declarationThroughValue} prints it, wherever the run is kept.
 *
 * Where nothing prints behind the colon and no semicolon follows, the run stands in the next node's raw; `runPastDeclaration` returns it, and nothing at the end of a stylesheet, where the text ends at the colon. See [#387](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387) and [#537](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537).
 *
 * The `xxx` on the end gives the checker something other than whitespace behind the colon; without it `always` would pass `a { color:; }` over in silence.
 *
 * Either end of the run is read as `declaration-block-trailing-semicolon` will leave it, so the text is the same whatever order the configuration lists the rules in ([#536](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/536)).
 *
 * The flag is nowhere in this text: {@link declarationString} prints it behind the same value.
 * @param syntax - The syntax the declaration is read under.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The declaration through its value and any run past it, with a sentinel behind.
 */
export function declarationColonSource (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let through = declarationThroughValue(syntax, decl)
	// The run `declaration-block-trailing-semicolon` takes away with the semicolon is none behind the colon (#536)
	let taken = syntax.read(decl).length - valueAsClosed(syntax, decl, result).length

	return `${through.slice(0, through.length - taken)}${runPastDeclaration(syntax, decl, result) ?? ``}xxx`
}
