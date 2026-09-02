import valueParser, { type Node } from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { findCommentSpanAt, findCommentSpanHolding, findCommentSpans, findCommentSpanTouching } from "./index.ts"

describe(`findCommentSpans`, () => {
	it(`no comment`, () => {
		expect(findCommentSpans(`1px 2px`)).toEqual([])
	})

	it(`a block comment, delimiters and all`, () => {
		expect(findCommentSpans(`1px /*c*/ 2px`)).toEqual([{ start: 4, end: 9, isInline: false }])
	})

	it(`a block comment the text never closes`, () => {
		expect(findCommentSpans(`1px /*c`)).toEqual([{ start: 4, end: 7, isInline: false }])
	})

	it(`a block comment broken over lines`, () => {
		expect(findCommentSpans(`1px /*a\nb*/ 2px`)).toEqual([{ start: 4, end: 11, isInline: false }])
	})

	it(`an inline comment, whose break stays outside the span`, () => {
		expect(findCommentSpans(`1px // c\n2px`)).toEqual([{ start: 4, end: 8, isInline: true }])
	})

	it(`a comment of each kind`, () => {
		expect(findCommentSpans(`/*a*/ 1px // b`)).toEqual([{ start: 0, end: 5, isInline: false }, { start: 10, end: 14, isInline: true }])
	})

	it(`a block comment closing where the next one opens`, () => {
		expect(findCommentSpans(`/*a*//*b*/`)).toEqual([{ start: 0, end: 5, isInline: false }, { start: 5, end: 10, isInline: false }])
	})

	it(`a double slash inside a block comment opens nothing`, () => {
		expect(findCommentSpans(`/* // */ 1px`)).toEqual([{ start: 0, end: 8, isInline: false }])
	})

	it(`a run inside a string that spells the delimiters of a comment`, () => {
		expect(findCommentSpans(`"a/*b" "c*/d"`)).toEqual([])
	})

	it(`a double slash belonging to a bare address`, () => {
		expect(findCommentSpans(`url(http://x/y.png)`)).toEqual([])
	})

	it(`a comment behind an address`, () => {
		expect(findCommentSpans(`url(http://x) // c`)).toEqual([{ start: 14, end: 18, isInline: true }])
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378
	it(`a slash and a star inside a bare address, which are two characters of the address to every tokenizer and open no comment`, () => {
		expect(findCommentSpans(`url(a/* x) 1PX /* c */ 3PX`)).toEqual([{ start: 15, end: 22, isInline: false }])
		expect(findCommentSpans(`url(a/* x) 1PX // c`)).toEqual([{ start: 15, end: 19, isInline: true }])
		expect(findCommentSpans(`url(a/*)b*/) // c`)).toEqual([{ start: 13, end: 17, isInline: true }])
	})

	it(`a block comment beside a quoted address inside the parentheses, which is a comment to every tokenizer`, () => {
		expect(findCommentSpans(`url("a" /*/ 'x' */) 'y'`)).toEqual([{ start: 8, end: 18, isInline: false }])
		expect(findCommentSpans(`url("a" /* c */ x) /* d */`)).toEqual([{ start: 8, end: 15, isInline: false }, { start: 19, end: 26, isInline: false }])
	})

	it(`a double slash beside a quoted address, which is code to PostCSS and to postcss-less, and a file Less refuses`, () => {
		expect(findCommentSpans(`url("a" // c)`)).toEqual([])
		expect(findCommentSpans(`url("a" // c)`, false)).toEqual([])
	})

	it(`a comment beside a quoted address the token never closes, which is no token and whose comment the scan reads again on its own`, () => {
		expect(findCommentSpans(`url("a" /* c */ x`)).toEqual([{ start: 8, end: 15, isInline: false }])
	})

	it(`a comment inside an address whitespace parts from its parenthesis, which the tokenizers read three ways and none of them hands the scan a span for`, () => {
		expect(findCommentSpans(`url( a /* c */ )`)).toEqual([])
	})

	it(`a slash and a star inside such an address whose closing delimiter lies past the parenthesis, a text only postcss-scss hands over and reads as one bracket token closed on that parenthesis`, () => {
		expect(findCommentSpans(`url( a/* x) 1PX /* c */ 3PX`)).toEqual([{ start: 16, end: 23, isInline: false }])
		expect(findCommentSpans(`url( a/* x) 1PX // c`)).toEqual([{ start: 16, end: 20, isInline: true }])
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/321
	// Every case below stands on an escape, which the scan used to read as an ordinary character everywhere but inside an address and inside a quoted string.
	it(`a double slash whose first character an escape spells`, () => {
		expect(findCommentSpans(`a\\//b 1px`)).toEqual([])
	})

	it(`a slash an escape spells in front of a star`, () => {
		expect(findCommentSpans(`a\\/*c*/ 1px`)).toEqual([])
	})

	it(`a double slash behind an escape of the backslash itself`, () => {
		expect(findCommentSpans(`a\\\\//c`)).toEqual([{ start: 3, end: 6, isInline: true }])
	})

	it(`a comment behind a quotation mark an escape spells, which opens no string to run past it`, () => {
		expect(findCommentSpans(`a\\"b // c`)).toEqual([{ start: 5, end: 9, isInline: true }])
	})

	it(`a double slash belonging to an address whose name an escape spells`, () => {
		expect(findCommentSpans(`\\url(http://x/y.png)`)).toEqual([])
		expect(findCommentSpans(`u\\rl(http://x/y.png)`)).toEqual([])
		expect(findCommentSpans(`\\75 rl(http://x/y.png)`)).toEqual([])
		expect(findCommentSpans(`\\55 RL(http://x/y.png)`)).toEqual([])
	})

	it(`a double slash inside a call an escape spells the name of, which is no address`, () => {
		expect(findCommentSpans(`a\\url(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
		expect(findCommentSpans(`image-\\75 rl(http://x)`)).toEqual([{ start: 18, end: 22, isInline: true }])
	})

	it(`a name an escape opens standing in front of the address, whose last character tells nothing about it`, () => {
		expect(findCommentSpans(`\\61 \\75 rl(http://x)`)).toEqual([{ start: 16, end: 20, isInline: true }])
		expect(findCommentSpans(`\\\\\\75 rl(http://x)`)).toEqual([{ start: 14, end: 18, isInline: true }])
		expect(findCommentSpans(`\\61 url(http://x)`)).toEqual([{ start: 13, end: 17, isInline: true }])
		expect(findCommentSpans(`\\/url(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
	})

	it(`a backslash a break stands behind, which opens no name and leaves the address its own`, () => {
		expect(findCommentSpans(`\\\n url(http://x)`)).toEqual([])
	})

	it(`an address behind a string, a block comment or a comment of the other kind, none of which opens a name`, () => {
		expect(findCommentSpans(`a"b"url(http://x)`)).toEqual([])
		expect(findCommentSpans(`a'b'url(http://x)`)).toEqual([])
		expect(findCommentSpans(`a/*b*/url(http://x)`)).toEqual([{ start: 1, end: 6, isInline: false }])
		expect(findCommentSpans(`a// b\nurl(http://x)`)).toEqual([{ start: 1, end: 5, isInline: true }])
	})

	it(`a name spelled by an escape no code point answers to, which is no address either`, () => {
		expect(findCommentSpans(`\\0 rl(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/343
	// The cases below stand on a name the scan used to read in ASCII word characters alone, so that a call named otherwise came out an address. The last two pin what had to survive the widening, and so does the second half of the case that puts one name in two spellings: an escape opened a name whatever it spelled, so the file that writes the name `\e9 url(` reached a call on either side of the branch where the file that writes it as the character it spells did not.
	it(`a double slash inside a call whose name opens on a code point outside ASCII`, () => {
		expect(findCommentSpans(`\u00E9url(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
	})

	it(`a name of several such code points`, () => {
		expect(findCommentSpans(`\u65E5\u672Curl(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
	})

	it(`a name of the middle dot, the one such code point the grammar names below the letters`, () => {
		expect(findCommentSpans(`\u00B7url(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
	})

	it(`a name of a character above the basic plane, whose two halves each answer for themselves`, () => {
		expect(findCommentSpans(`\u{1F600}url(http://x)`)).toEqual([{ start: 11, end: 15, isInline: true }])
	})

	it(`one such name written plainly and written as an escape, which are the same name`, () => {
		expect(findCommentSpans(`\u00E9\\75 rl(http://x)`)).toEqual([{ start: 13, end: 17, isInline: true }])
		expect(findCommentSpans(`\\e9 url(http://x)`)).toEqual([{ start: 13, end: 17, isInline: true }])
	})

	it(`a name of the four such code points the grammar names one at a time above the middle dot`, () => {
		expect(findCommentSpans(`\u200Curl(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
		expect(findCommentSpans(`\u200Durl(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
		expect(findCommentSpans(`\u203Furl(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
		expect(findCommentSpans(`\u2040url(http://x)`)).toEqual([{ start: 10, end: 14, isInline: true }])
	})

	it(`a name an interpolation closes, which the closing brace keeps a name`, () => {
		expect(findCommentSpans(`@{p}url(http://x)`)).toEqual([{ start: 13, end: 17, isInline: true }])
		expect(findCommentSpans(`#{$p}url(http://x)`)).toEqual([{ start: 14, end: 18, isInline: true }])
	})

	it(`whitespace between such a code point and the address, which leaves the address its own`, () => {
		expect(findCommentSpans(`\u00E9 url(http://x)`)).toEqual([])
	})

	it(`a comment a Windows pair closes, the carriage return of the pair staying outside the span with the line feed`, () => {
		expect(findCommentSpans(`1px // c\r
2px`)).toEqual([{ start: 4, end: 8, isInline: true }])
	})

	it(`a bare carriage return or a form feed inside the comment, which is whitespace and closes nothing`, () => {
		expect(findCommentSpans(`1px // c\r2px`)).toEqual([{ start: 4, end: 12, isInline: true }])
		expect(findCommentSpans(`1px // c\f2px`)).toEqual([{ start: 4, end: 12, isInline: true }])
	})

	it(`a syntax spelling no comment with a double slash has none of that kind to find`, () => {
		expect(findCommentSpans(`1px // c\n2px`, false)).toEqual([])
		expect(findCommentSpans(`myurl(//a)`, false)).toEqual([])
	})

	it(`the second slash of such a syntax opens a block comment where a star follows it`, () => {
		expect(findCommentSpans(`1px//*c*/`, false)).toEqual([{ start: 4, end: 9, isInline: false }])
	})

	it(`a block comment of such a syntax is found as it always was`, () => {
		expect(findCommentSpans(`1px /* c */ 2px`, false)).toEqual([{ start: 4, end: 11, isInline: false }])
	})
})

describe(`findCommentSpanAt`, () => {
	// The comment of `1px // c\n2px`, which runs from the double slash to the break
	let spans = [{ start: 4, end: 8, isInline: true }]
	// The comment of `1px /*/ c */ 2px`, which CSS closes on the last of its slashes and `postcss-value-parser` on the first star: everything from the fourth character to the twelfth is text the parser hands back as nodes of the value (#378)
	let slashStarSlash = [{ start: 4, end: 12, isInline: false }]

	it(`a position in front of the comment`, () => {
		expect(findCommentSpanAt(3, spans)).toBeUndefined()
	})

	it(`the position the comment opens at`, () => {
		expect(findCommentSpanAt(4, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`a position inside the text of the comment`, () => {
		expect(findCommentSpanAt(6, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`the last character the comment holds, which is the position in front of the break`, () => {
		expect(findCommentSpanAt(7, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`the position of the break that closes the comment, which the comment does not hold`, () => {
		expect(findCommentSpanAt(8, spans)).toBeUndefined()
	})

	it(`a position behind the comment`, () => {
		expect(findCommentSpanAt(9, spans)).toBeUndefined()
	})

	it(`any position at all where the text holds no comment`, () => {
		expect(findCommentSpanAt(4, [])).toBeUndefined()
	})

	it(`a position behind the star a comment opening with a solidus, a star and a solidus was closed on by the value parser, which is inside the comment CSS reads`, () => {
		expect(findCommentSpanAt(8, slashStarSlash)).toEqual({ start: 4, end: 12, isInline: false })
		expect(findCommentSpanAt(11, slashStarSlash)).toEqual({ start: 4, end: 12, isInline: false })
		expect(findCommentSpanAt(12, slashStarSlash)).toBeUndefined()
	})
})

describe(`findCommentSpanHolding`, () => {
	// The comment of `1px /*/ 2PX */ 3px`, whose `2PX` the value parser hands back as a word opening at 8
	let spans = [{ start: 4, end: 14, isInline: false }]

	it(`a node opening in front of the comment`, () => {
		expect(findCommentSpanHolding(valueParser(`1px /*/ 2PX */ 3px`).nodes[0] as Node, spans)).toBeUndefined()
	})

	it(`the node the value parser makes of the comment, which opens on the comment's own first character`, () => {
		expect(findCommentSpanHolding(valueParser(`1px /*/ 2PX */ 3px`).nodes[2] as Node, spans)).toEqual({ start: 4, end: 14, isInline: false })
	})

	it(`a word the parser reads behind the star it closed the comment on, which is text of the comment`, () => {
		expect(findCommentSpanHolding(valueParser(`1px /*/ 2PX */ 3px`).nodes[4] as Node, spans)).toEqual({ start: 4, end: 14, isInline: false })
	})

	it(`a node opening behind the comment`, () => {
		expect(findCommentSpanHolding(valueParser(`1px /*/ 2PX */ 3px`).nodes[8] as Node, spans)).toBeUndefined()
	})
})

describe(`findCommentSpanTouching`, () => {
	let spans = [{ start: 4, end: 8, isInline: true }]

	it(`a node ending where the comment opens, which carries none of its text`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 1, sourceEndIndex: 4 }, spans)).toBeUndefined()
	})

	it(`a node opening outside the comment and reaching into it`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 1, sourceEndIndex: 5 }, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`a node opening outside the comment and reaching past the break that closes it`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 1, sourceEndIndex: 12 }, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`a node standing inside the comment`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 5, sourceEndIndex: 7 }, spans)).toEqual({ start: 4, end: 8, isInline: true })
	})

	it(`a node opening at the break that closes the comment`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 8, sourceEndIndex: 9 }, spans)).toBeUndefined()
	})

	it(`a node standing behind the comment`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 9, sourceEndIndex: 12 }, spans)).toBeUndefined()
	})

	it(`any node at all where the text holds no comment`, () => {
		expect(findCommentSpanTouching({ sourceIndex: 4, sourceEndIndex: 8 }, [])).toBeUndefined()
	})

	it(`a string standing behind the star the value parser closed a comment opening with a solidus, a star and a solidus on, which is text of the comment CSS reads`, () => {
		// The `"a  a"` of `"c c" /*/ "a  a" */ "b b"`, which the parser hands back as a string opening at 10
		expect(findCommentSpanTouching({ sourceIndex: 10, sourceEndIndex: 16 }, [{ start: 6, end: 19, isInline: false }])).toEqual({ start: 6, end: 19, isInline: false })
	})
})
