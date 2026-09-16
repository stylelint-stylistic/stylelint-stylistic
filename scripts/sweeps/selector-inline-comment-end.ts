/**
 * A selector's `//` comment closed by each break `postcss-scss` closes one at, wherever a rule writing through the selector copies writes.
 *
 * Written for spec 1789508401: the copies were read to `\r?\n`, so a comment closed by a bare carriage return or a form feed took the selector behind it along: a fix in front of the comment wrote that part again, and one behind it was lost. The line feed and the Windows pair are the control, closed where they always were. Only `postcss-scss` keeps the two copies, so the sweep is read under it alone.
 */

import { place } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

/** The break closing the comment; the first two are the control. */
const BREAKS: [string, string][] = [
	[`lineFeed`, `\n`],
	[`windowsPair`, `\r\n`],
	[`carriageReturn`, `\r`],
	[`formFeed`, `\f`],
]

/** Every rule writing a selector through its copies, directly or through a shared checker. */
const RULES = [
	`selector-attribute-brackets-space-inside`,
	`selector-attribute-operator-space-after`,
	`selector-attribute-operator-space-before`,
	`selector-combinator-space-after`,
	`selector-combinator-space-before`,
	`selector-descendant-combinator-no-non-space`,
	`selector-list-comma-newline-after`,
	`selector-list-comma-newline-before`,
	`selector-list-comma-space-after`,
	`selector-list-comma-space-before`,
	`selector-max-empty-lines`,
	`selector-pseudo-class-case`,
	`selector-pseudo-class-parentheses-space-inside`,
	`string-quotes`,
]

const name: Sweep[`name`] = `selector-inline-comment-end`

const corpus: Sweep[`corpus`] = place(BREAKS, {
	afterComma: (value) => `a, // c${value} bb {}\n`,
	afterCommaGlued: (value) => `a,// c${value}bb {}\n`,
	afterCommaTwoSpaces: (value) => `a,  // c${value}  bb {}\n`,
	afterCommaThenLineFeed: (value) => `a, // c${value}\nbb {}\n`,
	beforeComma: (value) => `a // c${value}, bb {}\n`,
	beforeCommaGlued: (value) => `a // c${value},bb {}\n`,
	beforeCombinator: (value) => `a // c${value}> bb {}\n`,
	afterCombinator: (value) => `a > // c${value} bb {}\n`,
	descendant: (value) => `a // c${value} bb {}\n`,
	insidePseudoClass: (value) => `:is( a, // c${value} bb ) {}\n`,
	behindAttribute: (value) => `[ a = "x" ], // c${value} [ b = "y" ] {}\n`,
	pseudoClassCase: (value) => `a:HOVER, // c${value} bb:FOCUS {}\n`,
	twoComments: (value) => `a, // c${value} bb, // d${value} cc {}\n`,
	closingMarkInComment: (value) => `a, // c */ d${value} bb {}\n`,
	emptyLinesBehind: (value) => `a, // c${value}\n\n\nbb {}\n`,
	beforeBrace: (value) => `a, bb // c${value} {}\n`,
})

const configs: Sweep[`configs`] = RULES.flatMap((rule) => (RULE_OPTIONS[rule] ?? []).map((primary) => ({ rule, primary })))

const syntaxes: Sweep[`syntaxes`] = [`scss`]

export { configs, corpus, name, syntaxes }
