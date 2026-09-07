import type { Node } from "postcss-value-parser"

import { EVERY_INTERPOLATION } from "../../regexps.ts"

/** The span an interpolation occupies in a text. */
export type InterpolationSpan = {
	start: number,
	end: number,
}

/**
 * Finds the spans the interpolations of a text occupy.
 *
 * {@link EVERY_INTERPOLATION} reads the three preprocessor spellings, not a template's bare braces. The text is the file's code, since Sass interpolates inside a quoted string too; blank the comments first where they can be placed, since a brace in one closes no interpolation.
 * @param text - The text to scan.
 * @returns The spans.
 */
export function findInterpolationSpans (text: string): InterpolationSpan[] {
	return [...text.matchAll(EVERY_INTERPOLATION)].map(({ 0: interpolation, index }) => ({ start: index, end: index + interpolation.length }))
}

/**
 * Finds the interpolation span a value-parser node overlaps, where one does.
 *
 * `postcss-value-parser` breaks a value at whitespace, an interpolation with it: the first word of `10px#{$a != $b}` is `10px#{$a`, read as the unit `px$a` of `10` ([#298](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298)). The whole node is asked about, not its opening position, since a node touching an interpolation is no plain CSS.
 * @param valueNode - The node; only its span is read.
 * @param spans - The spans {@link findInterpolationSpans} found in the node's text.
 * @returns The span the node touches, or nothing.
 */
export function findInterpolationSpanTouching (valueNode: Pick<Node, `sourceIndex` | `sourceEndIndex`> & {
	type?: string,
	value?: string,
}, spans: InterpolationSpan[]): InterpolationSpan | undefined {
	return spans.find(({ start, end }) => valueNode.sourceIndex < end && valueNode.sourceEndIndex > start)
}
