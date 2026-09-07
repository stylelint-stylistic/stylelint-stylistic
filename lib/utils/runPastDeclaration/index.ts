import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { closedBySemicolon, valueAsClosed } from "../closedBySemicolon/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { declarationEndsTheStylesheet } from "../declarationEndsTheStylesheet/index.ts"

/**
 * Finds the whitespace run behind a declaration's colon that lies outside the declaration's text, and whether its raw ends the stylesheet.
 *
 * A declaration printing nothing behind its colon (`raws.between` ends there, empty value, no `!important`) and closed by no semicolon leaves the run to the next node's `raws.before` or the container's `raws.after` ([#387](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387)). The semicolon and the value are read as `declaration-block-trailing-semicolon` will leave them ([#536](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/536)). A missing raw is refused, since a write would replace PostCSS's computed default; so is one not all whitespace. A root's `raws.after` is what the stylesheet ends on ([#537](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537)).
 * @param syntax - The rule's syntax.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns The run and whether it ends the stylesheet, or nothing where the run is the declaration's own.
 */
function runOf (syntax: Syntax, decl: Declaration, result: PostcssResult): {
	run: string,
	endsTheStylesheet: boolean,
} | undefined {
	let { parent } = decl

	if (!parent) return undefined

	if (decl.important || valueAsClosed(syntax, decl, result) !== ``) return undefined

	if (colonIndexInBetween(syntax, decl, result) === -1 || betweenTailAfterColon(syntax, decl, result) !== ``) return undefined

	if (closedBySemicolon(syntax, decl, result)) return undefined

	let next = decl.next()
	let run = next ? next.raws.before : parent.raws.after

	if (typeof run !== `string` || !WHITESPACE_OR_NOTHING.test(run)) return undefined

	return { run, endsTheStylesheet: declarationEndsTheStylesheet(decl) }
}

/**
 * Reads the run {@link runOf} finds, where it is the declaration's to write.
 * @param syntax - The rule's syntax.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns The run, or nothing where it is the declaration's own or ends the stylesheet.
 */
export function runPastDeclaration (syntax: Syntax, decl: Declaration, result: PostcssResult): string | undefined {
	let found = runOf(syntax, decl, result)

	return found && !found.endsTheStylesheet ? found.run : undefined
}

/**
 * Asks whether the run past a declaration is the raw the stylesheet ends on.
 *
 * The raw is `no-missing-end-of-source-newline`'s; an inline `style` attribute's root is passed over as there, and a one-line `<style>` element keeps the run outside the stylesheet. `declaration-colon-space-after` has no spelling keeping the closing break, so it passes the declaration over; its newline neighbour writes its break in front of the run, leaving the last line whitespace ([#537](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537)).
 * @param syntax - The rule's syntax.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns True where such a run exists and its raw is the stylesheet's tail.
 */
export function runPastDeclarationEndsTheStylesheet (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean {
	return runOf(syntax, decl, result)?.endsTheStylesheet ?? false
}

/**
 * Writes over the run {@link runPastDeclaration} reads, in the raw that holds it.
 *
 * Not `raws.between`, which would leave the run standing and grow the file every `--fix` ([#387](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387)); not `setBlockAfter`, whose childless-at-rule question does not arise behind a declaration.
 * @param decl - The declaration {@link runPastDeclaration} answered for.
 * @param run - The run to write.
 */
export function writeRunPastDeclaration (decl: Declaration, run: string): void {
	let next = decl.next()

	if (next) {
		next.raws.before = run

		return
	}

	let { parent } = decl

	if (parent) parent.raws.after = run
}
