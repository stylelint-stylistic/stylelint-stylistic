import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastDeclarationWithoutSemicolon } from "../isLastDeclarationWithoutSemicolon/index.ts"
import { isRoot } from "../typeGuards/index.ts"

/**
 * Reads the whitespace standing behind a declaration's colon where the file leaves it past the declaration's own text.
 *
 * Where the value has a word of its own, the parser trims that run onto `raws.between`; where it has none, it leaves it at the head of the value, in the raw of it or in `decl.value` itself. Both are texts the declaration prints, and every reader of the run finds it there. But where the declaration prints nothing at all behind its colon and the file writes no semicolon behind it, the run reaches neither: nothing closes the declaration, so the run goes on until something else claims it — the `raws.before` of the node written next, and the block's own `raws.after` where the declaration is the last thing the block holds.
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
 *
 * A declaration prints nothing behind its colon where `raws.between` ends at the colon the parser read, the printed value is empty and no `!important` follows — `a { b:  ; }` keeps the run in the raw of its value, `a { --b:  }` in `decl.value`, and `a { b:  !important }` in the raw the flag is printed behind, so none of the three is asked about here.
 *
 * A raw the node carries none of is refused rather than read as an empty one: PostCSS computes a raw of its own where a node carries none, and a run written in its place would take that default away. So is a raw holding anything but whitespace, which is a run that did not simply go on.
 *
 * Every container that can hold such a declaration is asked, whatever closes it — a rule, an at-rule, the declaration `postcss-scss` builds for a nested property of Sass, which carries a block of its own, and the root of an inline `style` attribute, which closes on the attribute's own quotation mark rather than on a brace. The root of a stylesheet is the one container left out: `postcss.parse` reads a declaration standing at the top level of a file, and that root's `raws.after` is the tail of the file itself, the raw `no-missing-end-of-source-newline` writes its break into. One character cannot answer to that rule and to an option about the colon at once, and which of the two it answers to is [#537](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537).
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The run, or nothing where the whitespace behind the colon is the declaration's own.
 */
export function runPastDeclaration (syntax: Syntax, decl: Declaration, result: PostcssResult): string | undefined {
	let { parent } = decl

	if (!parent || (isRoot(parent) && !isInlineStyleAttribute(parent))) return undefined

	if (decl.important || syntax.read(decl) !== ``) return undefined

	if (colonIndexInBetween(syntax, decl, result) === -1 || betweenTailAfterColon(syntax, decl, result) !== ``) return undefined

	if (!isLastDeclarationWithoutSemicolon(decl)) return undefined

	let next = decl.next()
	let run = next ? next.raws.before : parent.raws.after

	if (typeof run !== `string` || !WHITESPACE_OR_NOTHING.test(run)) return undefined

	return run
}

/**
 * Writes over the run {@link runPastDeclaration} reads, in the raw that holds it.
 *
 * A fix writing its own spelling into `raws.between` instead would leave the run standing where it stood and add to the file on every run of `--fix`, which is what the issue above is. The block's raw is written directly rather than through `setBlockAfter`: that one asks whether the last node of the block has swallowed the block's final raw, which only an at-rule carrying no block ever does, and the node closing the block here is the declaration itself or a comment behind it.
 * @param decl - The declaration, whose run {@link runPastDeclaration} has answered for.
 * @param run - The run to write in its place.
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
