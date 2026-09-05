import { describe, expect, it } from "vitest"

import { RATIO_MEDIA_FEATURES } from "../../reference/mediaQueries.ts"

import { findMediaFeatureValues } from "./index.ts"

/**
 * Cuts the values the finder names out of the parameters, so that a case reads as the texts rather than as numbers.
 * @param params - The parameters.
 * @returns The text of every span, in order.
 */
function valuesOf (params: string): string[] {
	return findMediaFeatureValues(params, RATIO_MEDIA_FEATURES).map(({ start, end }) => params.slice(start, end))
}

describe(`findMediaFeatureValues`, () => {
	it(`finds the value of a feature in the plain form, whatever case the name is written in`, () => {
		expect(valuesOf(`(aspect-ratio: 16/9)`)).toEqual([`16/9`])
		expect(valuesOf(`(ASPECT-RATIO:2)`)).toEqual([`2`])
		expect(valuesOf(`screen and (min-aspect-ratio: 1 / 1) and (max-device-aspect-ratio: 2/1)`)).toEqual([`1 / 1`, `2/1`])
	})

	it(`finds the values of the three shapes of the range form`, () => {
		expect(valuesOf(`(16/9 <= aspect-ratio)`)).toEqual([`16/9`])
		expect(valuesOf(`(aspect-ratio >= 2)`)).toEqual([`2`])
		expect(valuesOf(`(16/9 <= aspect-ratio <= 2/1)`)).toEqual([`16/9`, `2/1`])
	})

	it(`keeps a comment inside the value and leaves one at either edge out`, () => {
		expect(valuesOf(`(aspect-ratio: /*a*/ 16 /*b*/ / 9 /*c*/)`)).toEqual([`16 /*b*/ / 9`])
	})

	it(`finds the values of every query of a list and of a feature inside a grouped condition`, () => {
		expect(valuesOf(`(aspect-ratio: 2), print and ((aspect-ratio: 3) and (width > 1px))`)).toEqual([`2`, `3`])
	})

	it(`names no value for a feature of another name, one written without a value, or one the parser cannot read`, () => {
		expect(valuesOf(`(width: 2)`)).toEqual([])
		expect(valuesOf(`(aspect-ratio)`)).toEqual([])
		expect(valuesOf(`(aspect-ratio: $a)`)).toEqual([])
		expect(valuesOf(`(aspect-ratio: #{$a})`)).toEqual([])
	})
})
