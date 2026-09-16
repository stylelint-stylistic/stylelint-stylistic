import { describe, expect, it } from "vitest"

import { endsWithInlineComment } from "./index.ts"

/** Less's reading, which leaves such a comment in the value a rule reads. */
const LESS = { spells: true, keeps: true, answered: true, tokenizes: false, endsOnFormFeed: false }

/** `postcss-scss`'s reading, whose own tokenizer reads such a comment. */
const SCSS = { spells: true, keeps: false, answered: true, tokenizes: true, endsOnFormFeed: true }

/** Plain CSS's reading, which spells no `//` comment. */
const PLAIN_CSS = { spells: false, keeps: false, answered: true, tokenizes: false, endsOnFormFeed: false }

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

	it(`a bare carriage return closing the comment, as Less and Sass read one, and a form feed inside it, which Less reads as its text`, () => {
		expect(endsWithInlineComment(` // one\rcolor`)).toBe(false)
		expect(endsWithInlineComment(` // one\rcolor`, LESS)).toBe(false)
		expect(endsWithInlineComment(` // one\fcolor`)).toBe(true)
		expect(endsWithInlineComment(` // one\fcolor`, LESS)).toBe(true)
		expect(endsWithInlineComment(`// A \f " \n B " // C "`)).toBe(false)
	})

	it(`the same form feed under the syntax that closes a comment on one, where the text behind it is code and can open a comment of its own`, () => {
		expect(endsWithInlineComment(` // one\fcolor`, SCSS)).toBe(false)
		expect(endsWithInlineComment(` // one\fcolor // two`, SCSS)).toBe(true)
		// The two readings part on this one: under Less the quotation marks are the first comment's text, under Sass they open a string the last mark leaves unclosed
		expect(endsWithInlineComment(`// A \f " \n B " // C "`, SCSS)).toBe(true)
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

	// The address closes on the first parenthesis behind it, which is the reading the comment walk was brought onto: neither reading has a compiler behind it, since Less and Sass both refuse the text, and this one is the safe half, a fix held back where the other would write. See #557
	it(`a parenthesis inside a bare address, which closes the address for this reading`, () => {
		expect(endsWithInlineComment(`b: url(a(b)c//d) 1px; `, LESS)).toBe(true)
	})

	// A quoted argument of `url` leaves a double slash behind it opening the comment Sass reads there: the first of these compiles to `a { b: url("a") 1px; }`. The comment walk read those slashes as code until the two readings were made one. See #557
	it(`a double slash beside a quoted address, which opens the comment Sass reads there`, () => {
		expect(endsWithInlineComment(`b: url("a" // c\n) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: url("a" // c`, LESS)).toBe(true)
		expect(endsWithInlineComment(`b: url("a" // c) 1px; `, LESS)).toBe(true)
		expect(endsWithInlineComment(`b: url( "a" // c`, LESS)).toBe(true)
	})

	// All three parsers cut such a comment out of the declaration's value, so the double slashes inside it are its text. See #665
	it(`a double slash inside a block comment whose opening solidus a backslash stands in front of`, () => {
		expect(endsWithInlineComment(`b: red \\/*x // c*/ `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: red \\/*x // c`, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: url( a\\/* ) // c */ ) `, LESS)).toBe(false)
	})

	// `postcss-scss` reads the comment and cuts it out of the value, and the file a fix leaves is read by it again. See #517
	it(`a double slash a backslash stands in front of, under a syntax whose tokenizer reads such a comment`, () => {
		expect(endsWithInlineComment(`b: red \\//x`, SCSS)).toBe(true)
		expect(endsWithInlineComment(`b: red\\//x`, SCSS)).toBe(true)
	})

	// Less reads the escape, and `postcss-less` keeps the slashes in the value. See #517
	it(`the same double slash under a syntax whose tokenizer reads no such comment, and under the default reading`, () => {
		expect(endsWithInlineComment(`b: red \\//x`, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: red \\//x`)).toBe(false)
	})

	// See #517
	it(`the same double slash inside a bare address, which the tokenizer reads whole`, () => {
		expect(endsWithInlineComment(`b: url(a\\//x) `, SCSS)).toBe(false)
	})

	// `postcss-scss` reads no comment inside the parentheses it takes as one token behind the word, and Sass reads the escape there
	it(`the same double slash inside such parentheses behind a name the word ends after an escape, and behind a pair of parentheses inside them`, () => {
		expect(endsWithInlineComment(`b: \\61 url( a\\// c ) 1px`, SCSS)).toBe(false)
		expect(endsWithInlineComment(`b: url( a( b ) \\//c ) 1px`, SCSS)).toBe(false)
	})

	// The tokenizer ends a word at a quotation mark and in front of `/*`, so a `url` behind a string or a comment is a word of its own and opens the token
	it(`the same double slash inside such parentheses behind a string and behind a block comment standing against the word`, () => {
		expect(endsWithInlineComment(`b: 'x'url( a( b ) \\//c ) 1px`, SCSS)).toBe(false)
		expect(endsWithInlineComment(`b: x /*c*/url( a( b ) \\//c ) 1px`, SCSS)).toBe(false)
	})

	// The tokenizer asks only the character behind the parenthesis, so whitespace in front of the quotation mark keeps the token
	it(`the same double slash behind a string opening such parentheses after whitespace`, () => {
		expect(endsWithInlineComment(`b: \\61 url( "a" \\//c ) 1px`, SCSS)).toBe(false)
		expect(endsWithInlineComment(`b: url( 'a' \\// c`, SCSS)).toBe(false)
	})

	// The tokenizer reads a word of its own in `aurl` and ends the token on the parenthesis behind a backslash
	it(`the same double slash where the tokenizer takes no such token, and behind the parenthesis ending one`, () => {
		expect(endsWithInlineComment(`b: aurl(a\\//c) 1px`, SCSS)).toBe(true)
		expect(endsWithInlineComment(`b: \\61 url( a\\) \\//c ) 1px`, SCSS)).toBe(true)
	})

	// The tokenizer reads no string inside the token, so the parenthesis closing the token closes the string, and the comment behind is its own
	it(`the same double slash behind the parenthesis ending such a token inside a string, one behind a backslash included`, () => {
		expect(endsWithInlineComment(`b: \\61 url( a\\//" ) \\//c " 1px`, SCSS)).toBe(true)
		expect(endsWithInlineComment(`b: url( a\\") \\//c 1px`, SCSS)).toBe(true)
	})

	// A line an inline comment ends ends a token, so the word on the next line is one of its own
	it(`the same double slash inside such parentheses on the line behind an inline comment`, () => {
		expect(endsWithInlineComment(`b: // c\nurl(a(b)\\//c) 1px`, SCSS)).toBe(false)
	})

	// See #665
	it(`a double slash standing behind such a comment, which the comment's own delimiter closed`, () => {
		expect(endsWithInlineComment(`b: red \\/*x*/ // c`, LESS)).toBe(true)
	})

	// The double slashes stand in the text of a block comment PostCSS reads there, so the parenthesis closing the address stands behind that comment rather than inside it. See #660
	it(`a double slash inside a block comment the tokenizer's whitespace parts from the parenthesis of an address`, () => {
		expect(endsWithInlineComment(`b: url( a /* ) // c */ ) 1px; `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: url( a /* ) // c */ `, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: url( a /* ) // c `, LESS)).toBe(false)
	})

	// See #660
	it(`the same text with the parenthesis standing against the address, which leaves the comment's delimiters characters of it`, () => {
		expect(endsWithInlineComment(`b: url(a /* ) // c */ ) 1px; `, LESS)).toBe(true)
	})

	// See #661
	it(`the same text under the parser Sass is read by, which reads the parentheses as code and the double slash as text of the block comment`, () => {
		expect(endsWithInlineComment(`b: url(a /* ) // c */ ) 1px; `, SCSS)).toBe(false)
	})

	// See #664
	it(`the same text behind a name spelled other than the word itself, whose parentheses every parser reads as code`, () => {
		expect(endsWithInlineComment(`b: URL(a /* ) // c */ ) 1px; `, LESS)).toBe(false)
	})

	// See #664
	it(`a double slash behind such a name under the parser Sass is read by, where Sass reads an address in front of it`, () => {
		expect(endsWithInlineComment(`b: URL(a/*b) // c */)`, SCSS)).toBe(true)
	})

	// The tokenizer glues a solidus to the name and reads the parentheses as code
	it(`a double slash inside a block comment within an address whose name a solidus is glued to, and one behind the address Sass reads there under its parser`, () => {
		expect(endsWithInlineComment(`b: /url(a/* ) // */) 1px`, LESS)).toBe(false)
		expect(endsWithInlineComment(`b: /url(a/*b) // c */)`, SCSS)).toBe(true)
	})

	// A sign the value parser keeps in the word too makes a call, as a letter does
	it(`a double slash inside the parentheses of a call whose name a dollar sign is glued to`, () => {
		expect(endsWithInlineComment(`b: $url(a // ) 1px`, LESS)).toBe(true)
	})

	// A string inside parentheses whose comments are read hides the delimiter it holds
	it(`a double slash behind an address whose string holds the opening delimiter of a block comment`, () => {
		expect(endsWithInlineComment(`b: url( a "/*") // c`, LESS)).toBe(true)
		expect(endsWithInlineComment(`b: url(a "/*") // c`, SCSS)).toBe(true)
	})

	// A mark nothing closes stays a character of the address, so the comment behind the call is read
	it(`a double slash behind an address holding a quotation mark nothing closes`, () => {
		expect(endsWithInlineComment(`b: url(a'b) 1px // c`, SCSS)).toBe(true)
	})

	it(`a double slash inside parentheses Sass reads as code, whose comment runs past the parenthesis to the end of the text`, () => {
		expect(endsWithInlineComment(`b: url(a // ) c`, SCSS)).toBe(true)
		expect(endsWithInlineComment(`b: url(a // ) c`, LESS)).toBe(false)
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
