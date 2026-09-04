import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { isRoot } from "../typeGuards/index.ts"

/**
 * Finds the whitespace standing behind a declaration's colon where the file leaves it past the declaration's own text, and says whether the raw holding it is the tail of the stylesheet itself.
 *
 * Where the value has a word of its own, the parser trims that run onto `raws.between`; where it has none, it leaves it at the head of the value, in the raw of it or in `decl.value` itself. Both are texts the declaration prints, and every reader of the run finds it there. But where the declaration prints nothing at all behind its colon and the file writes no semicolon behind it, the run reaches neither: nothing closes the declaration, so the run goes on until something else claims it — the `raws.before` of the node written next, and the container's own `raws.after` where the declaration is the last thing it holds.
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
 *
 * A declaration prints nothing behind its colon where `raws.between` ends at the colon the parser read, the printed value is empty and no `!important` follows — `a { b:  ; }` keeps the run in the raw of its value, `a { --b:  }` in `decl.value`, and `a { b:  !important }` in the raw the flag is printed behind, so none of the three is asked about here.
 *
 * A raw the node carries none of is refused rather than read as an empty one: PostCSS computes a raw of its own where a node carries none, and a run written in its place would take that default away. So is a raw holding anything but whitespace, which is a run that did not simply go on.
 *
 * Every container is asked, whatever closes it — a rule, an at-rule, the declaration `postcss-scss` builds for a nested property of Sass, which carries a block of its own, and a root, whatever holds the stylesheet it is the root of — a whole file, a `<style>` element of an HTML page, a template of JavaScript, an inline `style` attribute. Where the container is a root the two answers part, and what parts them is whether anything is written behind the declaration: a run standing in the raw of a node written behind it is bounded by that node wherever the declaration stands, while a root's own `raws.after` is bounded by nothing the stylesheet holds and is what the stylesheet ends on.
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The run and whether it ends the stylesheet, or nothing where the whitespace behind the colon is the declaration's own.
 */
function runOf (syntax: Syntax, decl: Declaration, result: PostcssResult): {
	run: string,
	endsTheStylesheet: boolean,
} | undefined {
	let { parent } = decl

	if (!parent) return undefined

	if (decl.important || syntax.read(decl) !== ``) return undefined

	if (colonIndexInBetween(syntax, decl, result) === -1 || betweenTailAfterColon(syntax, decl, result) !== ``) return undefined

	if (!isLastNodeWithoutSemicolon(decl)) return undefined

	let next = decl.next()
	let run = next ? next.raws.before : parent.raws.after

	if (typeof run !== `string` || !WHITESPACE_OR_NOTHING.test(run)) return undefined

	return { run, endsTheStylesheet: !next && isRoot(parent) && !isInlineStyleAttribute(parent) }
}

/**
 * Reads the run {@link runOf} finds, where it is the declaration's to read and to write.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The run, or nothing where the whitespace behind the colon is the declaration's own or the stylesheet's.
 */
export function runPastDeclaration (syntax: Syntax, decl: Declaration, result: PostcssResult): string | undefined {
	let found = runOf(syntax, decl, result)

	return found && !found.endsTheStylesheet ? found.run : undefined
}

/**
 * Asks whether the run standing past a declaration is the raw the stylesheet holding it ends on.
 *
 * That raw is `no-missing-end-of-source-newline`'s, and over every syntax this plugin reads the roots the two questions are asked of are one and the same set: that rule writes its break into the `raws.after` of a file's own root, of the root a `<style>` element of an HTML page holds and of the root a template of JavaScript holds, and passes over the root of an inline `style` attribute, which is the one root left out here. It passes over a root a syntax marks as an object literal as well, which none of the syntaxes this plugin reads ever builds.
 *
 * Where an HTML page writes that element on one line, `postcss-html` keeps the whitespace standing behind the declaration outside the stylesheet altogether — `<style>b:  </style>` hands the root the text `b:` and an empty raw, and the two spaces come back when the document is printed — so a spelling written into that raw would stand in front of the run rather than over it, which is the growth again by another road.
 *
 * `declaration-colon-space-after` has no spelling of that raw answering both its option and the break the stylesheet's last line is closed by: `always` asks for a single space with no whitespace behind it and `never` for no whitespace at all, while a stylesheet that closes its last line ends the raw on a break. So writing there takes that break away, whether or not the rule that asks for it is configured, and the declaration is passed over instead of drawing a warning nothing can settle.
 *
 * Its neighbour has a spelling that answers both — a break written behind the colon is a break the stylesheet may end on — and passes the declaration over all the same. The two rules are handed one text by `declarationColonSource` and read the run alike, so reading it for one of them is reading it for both; and the break that rule writes goes in front of whatever run already stands there rather than over it, so `a { color: }` comes back as `a { color:\n }` and the same write at the end of a stylesheet would leave its last line a run of whitespace.
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns True where there is such a run and the raw holding it is the stylesheet's own tail.
 */
export function runPastDeclarationEndsTheStylesheet (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean {
	return runOf(syntax, decl, result)?.endsTheStylesheet ?? false
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
