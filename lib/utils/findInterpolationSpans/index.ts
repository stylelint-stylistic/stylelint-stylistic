import type { Node } from "postcss-value-parser"

import { EVERY_INTERPOLATION } from "../../regexps.ts"

/** The span an interpolation occupies in a text, counted in that text. */
export type InterpolationSpan = { start: number, end: number }

/**
 * Finds the spans the interpolations of a text occupy in it.
 *
 * {@link EVERY_INTERPOLATION} is what an interpolation is read by, so this answers for the three spellings a preprocessor writes and not for the bare braces of a template, which the name there says why.
 *
 * The text handed over is the code as the file spells it, since Sass interpolates inside a quoted string as it does outside one. A caller holding a text whose comments it can place should blank them first: a brace written in a comment closes no interpolation, and a comment is not code the caller is reading either.
 * @param text - The text to scan.
 * @returns The spans, in the coordinates of the scanned text.
 */
export function findInterpolationSpans (text: string): InterpolationSpan[] {
	return [...text.matchAll(EVERY_INTERPOLATION)].map(({ 0: interpolation, index }) => ({ start: index, end: index + interpolation.length }))
}

/**
 * Finds the span of an interpolation whose text a node of a value parse carries any of, where one does.
 *
 * `postcss-value-parser` breaks a value at whitespace, and an interpolation holding whitespace is broken along with it, so an interpolation reaches a rule as several nodes and no one of them holds the whole of it: the first word of `10px#{$a != $b}` is `10px#{$a`, and a reading that asks whether that word holds an interpolation is answered no. `isStandardSyntaxValue` asks exactly that, of a word at a time, which is why the word came back standard and was read as the unit `px$a` of the number `10` (#298).
 *
 * The question is put to the whole of the node rather than to the position it opens at, since the two sides of such a word are two languages and what either side means is settled by the compiler expanding the interpolation between them. A node touching one is a node of no language a rule reading plain CSS may read, whichever side of the edge it opens on.
 * @param valueNode - The node the walk has reached, of which only its span is read.
 * @param spans - The spans {@link findInterpolationSpans} found in the text the node was parsed from, which the node's positions count in.
 * @returns The span the node touches, or nothing where the node carries no interpolation's text.
 */
export function findInterpolationSpanTouching (valueNode: Pick<Node, `sourceIndex` | `sourceEndIndex`> & { type?: string, value?: string }, spans: InterpolationSpan[]): InterpolationSpan | undefined {
	return spans.find(({ start, end }) => valueNode.sourceIndex < end && valueNode.sourceEndIndex > start)
}
