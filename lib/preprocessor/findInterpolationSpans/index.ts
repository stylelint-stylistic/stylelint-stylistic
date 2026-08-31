import type { InterpolationSpan } from "../../utils/findInterpolationSpans/index.ts"
import { EVERY_INTERPOLATION } from "../regexps.ts"

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
