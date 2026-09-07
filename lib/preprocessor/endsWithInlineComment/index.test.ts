import { describe, expect, it } from "vitest"

import { endsWithInlineComment } from "./index.ts"

/** Less's reading, which leaves such a comment in the value a rule reads. */
const LESS = { spells: true, keeps: true, answered: true }

/** Plain CSS's reading, which spells no `//` comment. */
const PLAIN_CSS = { spells: false, keeps: false, answered: true }

describe(`endsWithInlineComment`, () => {
	it(`empty string`, () => {
		expect(endsWithInlineComment(``)).toBe(false)
	})

	it(`whitespace only`, () => {
		expect(endsWithInlineComment(` \n\t`)).toBe(false)
	})

	it(`inline comment`, () => {
		expect(endsWithInlineComment(` // keep me`)).toBe(true)
	})

	it(`inline comment closed by a line break`, () => {
		expect(endsWithInlineComment(` // keep me\n`)).toBe(true)
	})

	it(`inline comment closed by a CRLF and an indent`, () => {
		expect(endsWithInlineComment(` // keep me\r\n\t`)).toBe(true)
	})

	it(`inline comment followed by content`, () => {
		expect(endsWithInlineComment(` // keep me\ncolor`)).toBe(false)
	})

	it(`block comment`, () => {
		expect(endsWithInlineComment(` /* keep me */\n`)).toBe(false)
	})

	it(`block comment holding a double slash`, () => {
		expect(endsWithInlineComment(` /* keep // me */\n`)).toBe(false)
	})

	it(`block comment holding an URL`, () => {
		expect(endsWithInlineComment(` /* https://foo.bar/ */\n`)).toBe(false)
	})

	it(`block comment spanning several lines`, () => {
		expect(endsWithInlineComment(` /*\n// keep me\n*/\n`)).toBe(false)
	})

	it(`inline comment after a block comment`, () => {
		expect(endsWithInlineComment(` /* one */ // two\n`)).toBe(true)
	})

	it(`block comment after an inline comment`, () => {
		expect(endsWithInlineComment(` // one\n/* two */`)).toBe(false)
	})

	it(`several inline comments`, () => {
		expect(endsWithInlineComment(` // one\n// two\n`)).toBe(true)
	})

	it(`unquoted URL`, () => {
		expect(endsWithInlineComment(`background: url(http://foo.bar/a.png)\n`)).toBe(false)
	})

	it(`unquoted protocol-relative URL`, () => {
		expect(endsWithInlineComment(`background: url(//foo.bar/a.png)\n`)).toBe(false)
	})

	it(`quoted URL`, () => {
		expect(endsWithInlineComment(`background: url("http://foo.bar/a.png")\n`)).toBe(false)
	})

	it(`string holding a double slash`, () => {
		expect(endsWithInlineComment(`content: "//"\n`)).toBe(false)
	})

	it(`inline comment after an URL`, () => {
		expect(endsWithInlineComment(`background: url(http://foo.bar/a.png) // keep me\n`)).toBe(true)
	})

	it(`inline comment holding a quote`, () => {
		expect(endsWithInlineComment(` // it's mine\n`)).toBe(true)
	})

	it(`inline comment inside a string`, () => {
		expect(endsWithInlineComment(`content: "// not a comment"\n`)).toBe(false)
	})

	it(`a bare carriage return or a form feed inside the comment, which is whitespace and closes nothing, whatever the reading`, () => {
		expect(endsWithInlineComment(` // one\rcolor`)).toBe(true)
		expect(endsWithInlineComment(` // one\fcolor`)).toBe(true)
		expect(endsWithInlineComment(` // one\fcolor`, LESS)).toBe(true)
		expect(endsWithInlineComment(`// A \f " \n B " // C "`)).toBe(false)
	})

	it(`inline comment a carriage return leaves at the end`, () => {
		expect(endsWithInlineComment(` // one\r`)).toBe(true)
	})

	it(`escaped quote inside a string`, () => {
		expect(endsWithInlineComment(`content: "\\"" // keep me\n`)).toBe(true)
	})

	it(`a syntax spelling no comment with a double slash ends in code, whatever the text holds`, () => {
		expect(endsWithInlineComment(` // keep me`, PLAIN_CSS)).toBe(false)
		expect(endsWithInlineComment(`1px//c`, PLAIN_CSS)).toBe(false)
		expect(endsWithInlineComment(`myurl(//a)`, PLAIN_CSS)).toBe(false)
	})

	// The name in front of the address is read as the comment walk reads it: an identifier code point, a closing brace or an escape. A pattern of the guard's own read ASCII word characters and the hyphen alone, so each call below was "no name" and taken for an address whose double slashes opened nothing. See #398
	it(`a call whose name ends in a character no ASCII word holds, whose arguments hold a comment`, () => {
		expect(endsWithInlineComment(`b: aurl(http://a/b.png) 1px; `, LESS)).toBe(true)
		expect(endsWithInlineComment(`b: éurl(http://a/b.png) 1px; `, LESS)).toBe(true)
		expect(endsWithInlineComment(`b: @{p}url(http://a/b.png) 1px; `, LESS)).toBe(true)
		expect(endsWithInlineComment(`b: \\75 url(http://a/b.png) 1px; `, LESS)).toBe(true)
	})

	// The address closes on the first parenthesis behind it, where the comment scan counts parentheses and reads the whole of `url(a(b)c//d)` as one address. Neither reading has a compiler behind it (Less and Sass both refuse the text), and this one is the safe half: a fix held back where the other would write.
	it(`a parenthesis inside a bare address, which closes the address for this reading`, () => {
		expect(endsWithInlineComment(`b: url(a(b)c//d) 1px; `, LESS)).toBe(true)
	})

	// A quoted argument of `url` leaves a double slash behind it opening the comment Sass reads there: the first of these compiles to `a { b: url("a") 1px; }`. The comment scan reads those slashes as code, the tokenizers' reading and the other half of the same divergence.
	it(`a double slash beside a quoted address, which opens the comment Sass reads there`, () => {
		expect(endsWithInlineComment(`b: url("a" // c\n) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: url("a" // c`, LESS)).toBe(true)
		expect(endsWithInlineComment(`b: url("a" // c) 1px; `, LESS)).toBe(true)
		expect(endsWithInlineComment(`b: url( "a" // c`, LESS)).toBe(true)
	})

	// The text is a prefix of what the file spells, so a `url(` left open is one the file closes behind it: the address runs to the end, and the protocol's double slashes open nothing.
	it(`an address the text is cut short inside, which the file closes behind it`, () => {
		expect(endsWithInlineComment(`( c: url( http://a/b.png `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: url(http://a/b.png`, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: url(`, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: image-url( http://a/b.png `, LESS)).toBe(true)
	})

	// A name opens behind whatever closed the state in front of it: a reader keeping the name's start has to say so at every one of the four, or it puts `x"url`, `c*/url`, `c\nurl` and `x)url` to the question and reads an address as an ordinary call.
	it(`an address whose name abuts the character that closed the string, the comment or the address in front of it`, () => {
		expect(endsWithInlineComment(`b: "x"url(http://a/b.png) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: 'x'url(http://a/b.png) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: /*c*/url(http://a/b.png) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: 1px, //c\nurl(http://a/b.png) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: url(x)url(http://a/b.png) 1px; `, LESS)).toBe(false)
	})

	// See #344
	it(`an address whose name is spelled with an escape, whose double slashes open nothing`, () => {
		expect(endsWithInlineComment(`b: u\\rl(http://a/b.png) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: \\75 rl(http://a/b.png) 1px; `, LESS)).toBe(false)
	})

	// A backslash in front of any of the four newlines spells nothing and delimits, so the name behind it stands on its own. The form feed and the bare carriage return used to be read as escaped characters, which made an ordinary call of each and a comment of its protocol's double slashes. See #566
	it(`an address behind a backslash and a newline of any of the four spellings, which the backslash names nothing in front of`, () => {
		expect(endsWithInlineComment(`b: \\\nurl(http://a/b.png) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: \\\r\nurl(http://a/b.png) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: \\\furl(http://a/b.png) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: \\\rurl(http://a/b.png) 1px; `, LESS)).toBe(false)
	})

	it(`a text ending in an unclosed comment of the other kind is no inline comment either`, () => {
		expect(endsWithInlineComment(`1px /* c`)).toBe(false)
	})
})
