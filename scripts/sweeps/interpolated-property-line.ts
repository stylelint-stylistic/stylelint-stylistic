/**
 * A property carrying a Sass interpolation, whose braces are the one place a line break reaches `decl.prop`.
 *
 * Written for the spec 1789503578: `indentation` counted such a line back from the property's end, got a negative offset and wrote the indentation into the head of `raws.between`. The interpolations holding no break are the controls, as are the properties spelling none; `property-case` and `no-multiple-whitespaces` are here because they write and read that same copy of the property.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What the interpolation's braces hold: `§` stands for it. */
const INNERS: Record<string, string> = {
	bare: `$s`,
	spaced: ` $s `,
	breakBefore: `\n$s`,
	breakBeforeTab: `\n\t$s`,
	breakBeforeTwoTabs: `\n\t\t$s`,
	breakBeforeThreeTabs: `\n\t\t\t$s`,
	breakBeforeTwoSpaces: `\n  $s`,
	crlfBefore: `\r\n$s`,
	twoBreaksBefore: `\n\n$s`,
	breakAfter: `$s\n`,
	breakBoth: `\n$s\n`,
	breakBothTwoTabs: `\n\t\t$s\n\t\t`,
	commentBreak: `/* c */\n$s`,
	call: `\nfn($a, $b)`,
}

/** The property the interpolation stands in: `§` stands for the interpolation's contents. */
const PROPERTIES: Record<string, string> = {
	interpolationLast: `font-#{§}`,
	interpolationFirst: `#{§}-font`,
	interpolationWhole: `#{§}`,
	customProperty: `--font-#{§}`,
	twoInterpolations: `#{§}-#{$b}`,
}

/** The controls: a property spelling no interpolation, and one spelling the characters of the braces where they open none. A property crossed with `INNERS` would repeat itself once per value of that axis, so the controls are multiplied without it. */
const PLAIN_PROPERTIES: Record<string, string> = {
	plain: `font-family`,
	hash: `font-\\#-family`,
	braces: `font-\\{family\\}`,
	dollar: `font-\\$family`,
}

/** What closes the declaration behind the property: `§` stands for the property. */
const TAILS: Record<string, string> = {
	singleLine: `§: 1px`,
	brokenValue: `§: 1px\n2px`,
	valueBehindTheColon: `§:\n1px`,
	flagOnItsLine: `§: 1px\n!important`,
}

/** Where the declaration stands: last in a block, in its middle, and in a nested block. */
const PLACES: Record<string, string> = {
	last: `a {\n\t§;\n}\n`,
	middle: `a {\n\t§;\n\ttop: 0;\n}\n`,
	nested: `a {\n\tb {\n\t\t§;\n\t}\n}\n`,
}

const name: Sweep[`name`] = `interpolated-property-line`

const corpus: Sweep[`corpus`] = [
	...multiply({ place: PLACES, tail: TAILS, property: PROPERTIES, inner: INNERS }, ({ place = ``, tail = ``, property = ``, inner = `` }) => place.replace(`§`, tail.replace(`§`, property.replaceAll(`§`, inner)))),
	...multiply({ place: PLACES, tail: TAILS, property: PLAIN_PROPERTIES }, ({ place = ``, tail = ``, property = `` }) => place.replace(`§`, tail.replace(`§`, property))),
]

/** The rule under both spellings of its primary and with a value asked for the declaration's level or left unmeasured, beside the two rules that write and read the same copy of the property. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { except: [`value`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { ignore: [`value`] } },
	{ rule: `property-case`, primary: `lower` },
	{ rule: `property-case`, primary: `upper` },
	{ rule: `no-multiple-whitespaces`, primary: true },
]

/** Read under all three, so that the controls are measured where the subject cannot be spelled: only `postcss-scss` lets a break into `decl.prop`, and under css and less every text holding an interpolation fails to parse. */
const syntaxes: Sweep[`syntaxes`] = [`css`, `scss`, `less`]

export { configs, corpus, name, syntaxes }
