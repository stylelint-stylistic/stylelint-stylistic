/**
 * A `url()` in a text, under every spelling of its name, of what stands in front of it, and of what its parentheses hold.
 *
 * Written for [#427](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/427) and [#398](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/398), when `max-line-length` and `endsWithInlineComment` were made to read a `url()` as `findCommentSpans` does; no oracle has an escaped name, one behind a non-ASCII code point or an interpolation, or one inside a comment or a string.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import { VALUE_PLACES } from "./axes/places.ts"
import { URL_ADDRESSES, URL_NAMES } from "./axes/url.ts"
import type { Sweep } from "./run.ts"

const name: Sweep[`name`] = `address-in-a-text`

// Multiplied, not covered: measured 2026-09-16 over one branch, a strength-two covering of these axes (1 287 texts of 10 296) kept 28 of 219 moved rows and lost one of the three rules the branch moved, since whether a row moves here hangs on all three values at once
const corpus: Sweep[`corpus`] = multiply({ place: keysOf(VALUE_PLACES), name: URL_NAMES, address: URL_ADDRESSES }, ({ place, name: spelledName, address }) => {
	let wrap = VALUE_PLACES[place ?? ``]

	if (!wrap || spelledName === undefined || address === undefined) throw new Error(`Every axis names a value`)

	return wrap(`${spelledName}(${address})`)
})

/** Every rule reading the inline-comment guard, the four writers reading the comment spans that move over these forms, the bang writer and the three solidus writers behind which a run switches the reading of the parentheses, the value-parser readers that wrote into a string holding a parenthesis, and `max-line-length` at a maximum on either side of these lines' width. */
const configs: Sweep[`configs`] = ([
	[`block-closing-brace-newline-before`, [`always`, `never-multi-line`]],
	[`block-closing-brace-space-before`, [`always`, `never`]],
	[`block-opening-brace-newline-after`, [`always`, `never-multi-line`]],
	[`block-opening-brace-newline-before`, [`always`, `never-multi-line`]],
	[`block-opening-brace-space-before`, [`always`, `never`]],
	[`color-hex-case`, [`lower`, `upper`]],
	[`declaration-bang-space-after`, [`always`, `never`]],
	[`declaration-bang-space-before`, [`always`, `never`]],
	[`declaration-block-semicolon-newline-after`, [`always`, `never-multi-line`]],
	[`declaration-block-semicolon-newline-before`, [`always`, `never-multi-line`]],
	[`declaration-block-semicolon-space-before`, [`always`, `never`]],
	[`declaration-block-trailing-semicolon`, [`always`, `never`]],
	[`declaration-colon-space-before`, [`always`, `never`]],
	[`function-comma-space-after`, [`always`, `never`]],
	[`function-comma-space-before`, [`always`, `never`]],
	[`function-parentheses-newline-inside`, [`always`, `never-multi-line`]],
	[`function-parentheses-space-inside`, [`always`, `never`]],
	[`function-whitespace-after`, [`always`, `never`]],
	[`indentation`, [`tab`]],
	[`media-feature-parentheses-space-inside`, [`always`, `never`]],
	[`named-grid-areas-alignment`, [true]],
	[`media-feature-slash-space-after`, [`always`, `never`]],
	[`media-query-list-comma-space-before`, [`always`, `never`]],
	[`number-leading-zero`, [`always`, `never`]],
	[`number-no-trailing-zeros`, [true]],
	[`string-quotes`, [`single`, `double`]],
	[`unit-case`, [`lower`, `upper`]],
	[`value-list-comma-newline-after`, [`always`, `never-multi-line`]],
	[`value-list-comma-space-after`, [`always`, `never`]],
	[`value-list-comma-space-before`, [`always`, `never`]],
	[`value-slash-newline-after`, [`always`, `never-multi-line`]],
	[`value-slash-space-after`, [`always`, `never`]],
	[`value-slash-space-before`, [`always`, `never`]],
	[`max-line-length`, [20, 40]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
