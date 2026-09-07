import type { Declaration } from "postcss"

import type { Syntax } from "../../syntaxes/index.ts"

/**
 * Moves the head of a declaration's value into `raws.between`, where a fix writing behind the colon can reach it.
 *
 * Where the value has no word, PostCSS leaves the whitespace and comments in front of it at the head of the value's raw, which prints only while it and `decl.value` stand for each other. In `raws.between` the head stands where PostCSS keeps it for a value with a word, and the declaration prints as `syntax.read` returns it (`postcss-scss` would otherwise print a `//` comment there as a block one). Only what the fix writes over is moved; the rest is the semicolon rule's run.
 *
 * Where the raw keeps something, `decl.value` stays as the parser wrote it, as `syntax.write` does; where it is emptied it goes, and the value with it, since an empty raw is read as no raw; where PostCSS keeps no raw (a whitespace-only custom property) the printed value is written.
 * @param syntax - The rule's syntax.
 * @param decl - The declaration; its `raws.between` is filled.
 * @param length - The characters of the printed value to move, never more than it holds.
 */
export function moveDeclarationValueHeadIntoBetween (syntax: Syntax, decl: Declaration, length: number): void {
	let value = syntax.read(decl)
	let tail = value.slice(length)

	decl.raws.between += value.slice(0, length)

	// An empty raw is read as no raw, and `decl.value` would stand for text the move took
	if (tail === ``) {
		delete decl.raws.value
		decl.value = ``

		return
	}

	syntax.write(decl, tail)
}
