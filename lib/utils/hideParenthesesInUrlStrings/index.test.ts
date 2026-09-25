import { describe, expect, it } from "vitest"

import { findCommentSpans } from "../findCommentSpans/index.ts"

import { hideParenthesesInUrlStrings } from "./index.ts"

describe(`hideParenthesesInUrlStrings`, () => {
	it(`a string holding a closing parenthesis behind the whitespace of an address`, () => {
		expect(hideParenthesesInUrlStrings(`url( a ")" b ) 1px`)).toBe(`url( a "?" b ) 1px`)
	})

	it(`a string of either kind holding two, behind a form feed`, () => {
		expect(hideParenthesesInUrlStrings(`url(\fa ')/)' ) 1px`)).toBe(`url(\fa '?/?' ) 1px`)
	})

	it(`two strings, of which the second holds the parenthesis the parser reads on to once the first is masked`, () => {
		expect(hideParenthesesInUrlStrings(`url( a ")" ")" .5 ) 1px`)).toBe(`url( a "?" "?" .5 ) 1px`)
	})

	it(`a string holding an escaped mark in front of its parenthesis`, () => {
		expect(hideParenthesesInUrlStrings(`url( a "\\")" b ) 1px`)).toBe(`url( a "\\"?" b ) 1px`)
	})

	// The walk for comments steps over the string and finds the comment behind it
	it(`a comment behind such a string, which the walk for comments finds`, () => {
		let text = `url( a ")" /* ) */ b ) 1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(`url( a "?" /* ? */ b ) 1px`)
	})

	it(`the same comment where the spans handed in do not hold it`, () => {
		expect(hideParenthesesInUrlStrings(`url( a ")" /* ) */ b ) 1px`, [])).toBe(`url( a "?" /* ? */ b ) 1px`)
	})

	it(`a comment the caller knows holding the parenthesis, and a string holding the one the parser reads on to`, () => {
		let text = `url( a /* ) */ ")" ) 1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(`url( a /* ? */ "?" ) 1px`)
	})

	it(`a comment holding a parenthesis inside the parentheses of a call`, () => {
		let text = `f(url( $a /* ) */))`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(`f(url( $a /* ? */))`)
	})

	it(`the same comment behind a name glued to a comma`, () => {
		let text = `f(1,url($a /* ) */))`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(`f(1,url($a /* ? */))`)
	})

	it(`an inline comment holding a parenthesis where the parser reads one, which the break closes`, () => {
		let text = `f(url( a // )\n))`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text, { spells: true, tokenizes: true, endsOnFormFeed: false }))).toBe(`f(url( a // ?\n))`)
	})

	it(`an inline comment no break closes, which runs to the end of the text past every parenthesis`, () => {
		let text = `( c: url( "a" // c ) )`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text, { spells: true, tokenizes: true, endsOnFormFeed: false }))).toBe(text)
	})

	it(`the same comment behind an address with no whitespace, which the tokenizer takes to the first parenthesis`, () => {
		let text = `f(url(a /* ) */))`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(text)
	})

	it(`a backslash in front of a break, which spells nothing and leaves the name behind the break its own`, () => {
		expect(hideParenthesesInUrlStrings(`\\\nurl(a)`)).toBe(`?\nurl(a)`)
		expect(hideParenthesesInUrlStrings(`\\\rurl(a)`)).toBe(`?\rurl(a)`)
		expect(hideParenthesesInUrlStrings(`\\\furl(a)`)).toBe(`?\furl(a)`)
	})

	it(`two dividers opening the name, both of which are masked`, () => {
		expect(hideParenthesesInUrlStrings(`\\\n\\\nurl(a)`)).toBe(`?\n?\nurl(a)`)
	})

	// The mask is no boundary to the parser, so behind a character of a word it would read as a character of that word, and a rule writing the word would write it into the file
	it(`a divider behind a character of a word, which takes a space ending the word`, () => {
		expect(hideParenthesesInUrlStrings(`a\\\nurl(b)`)).toBe(`a \nurl(b)`)
		expect(hideParenthesesInUrlStrings(`#FFF\\\nurl(a.png)`)).toBe(`#FFF \nurl(a.png)`)
		expect(hideParenthesesInUrlStrings(`\\\\\\\nurl(a)`)).toBe(`\\\\ \nurl(a)`)
	})

	it(`dividers behind a word and in front of it, of which only the opening run takes the mask`, () => {
		expect(hideParenthesesInUrlStrings(`\\\na\\\n\\\rurl(b)`)).toBe(`?\na \n \rurl(b)`)
	})

	it(`a divider behind a character of a word in front of another name`, () => {
		expect(hideParenthesesInUrlStrings(`a\\\nf(b)`)).toBe(`a\\\nf(b)`)
		expect(hideParenthesesInUrlStrings(`a\\\nurl\\\nf(b)`)).toBe(`a\\\nurl\\\nf(b)`)
	})

	// The parser hands the divider back inside the word in front, since the whitespace closing the hexadecimal escape divides the value to it, and the name is read welded across that whitespace
	it(`a divider in front of a hexadecimal escape closed by whitespace, which the parser keeps in a word of its own in front of the call`, () => {
		expect(hideParenthesesInUrlStrings(`\\\n\\75 rl(a(b).png)`)).toBe(`?\n\\75 rl(a(b).png)`)
		expect(hideParenthesesInUrlStrings(`a\\\n\\75 rl(a(b).png) f(1px)`)).toBe(`a \n\\75 rl(a(b).png) f(1px)`)
		expect(hideParenthesesInUrlStrings(`#FFF\\\n\\75 rl(1PX)`)).toBe(`#FFF \n\\75 rl(1PX)`)
	})

	// The parser reads an address behind the call it names `url`, where CSS reads a call named `aurl`
	it(`the first letter of a url a hexadecimal escape in front welds into a name other than url, which takes the weld`, () => {
		expect(hideParenthesesInUrlStrings(`\\61 url(a"b"c)`)).toBe(`\\61 _rl(a"b"c)`)
		expect(hideParenthesesInUrlStrings(`\\61\r\nurl(a"b"c)`)).toBe(`\\61\r\n_rl(a"b"c)`)
		expect(hideParenthesesInUrlStrings(`\\61 \\62 url(a,"b")`)).toBe(`\\61 \\62 _rl(a,"b")`)
		expect(hideParenthesesInUrlStrings(`x\\9 url(a) f(\\61\turl(b))`)).toBe(`x\\9 _rl(a) f(\\61\t_rl(b))`)
	})

	it(`the same url where the name stays url, the parser reads no address, or the call would close on another parenthesis or leave a string open, which takes none`, () => {
		expect(hideParenthesesInUrlStrings(`\\75 rl(a)`)).toBe(`\\75 rl(a)`)
		expect(hideParenthesesInUrlStrings(`\\61  url(a)`)).toBe(`\\61  url(a)`)
		expect(hideParenthesesInUrlStrings(`x\\\\9 url(a)`)).toBe(`x\\\\9 url(a)`)
		expect(hideParenthesesInUrlStrings(`\\61 url("a")`)).toBe(`\\61 url("a")`)
		expect(hideParenthesesInUrlStrings(`\\61 URL(a)`)).toBe(`\\61 URL(a)`)
		expect(hideParenthesesInUrlStrings(`\\61 url(a(b).png)`)).toBe(`\\61 url(a(b).png)`)
		expect(hideParenthesesInUrlStrings(`\\61 url(a(b.png)`)).toBe(`\\61 url(a(b.png)`)
		expect(hideParenthesesInUrlStrings(`\\61 url(a"b.png)`)).toBe(`\\61 url(a"b.png)`)
	})

	it(`the same url behind an escape a double-slash comment holds, which the break closing the comment leaves a name of its own`, () => {
		let text = `c // \\61\nurl(a,"b")`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(text)
	})

	it(`such a divider in front of an escape that spells a name of its own, and one dividing the escapes of a name, behind which the tail spells no address`, () => {
		expect(hideParenthesesInUrlStrings(`\\\n\\61 rl(a(b).png)`)).toBe(`\\\n\\61 rl(a(b).png)`)
		expect(hideParenthesesInUrlStrings(`\\\n\\75 \\\n\\72 l(a(b).png)`)).toBe(`\\\n\\75 \\\n\\72 l(a(b).png)`)
	})

	it(`a divider behind an address whose string holds a parenthesis, which the parser reads as text of that address until the parenthesis is masked`, () => {
		expect(hideParenthesesInUrlStrings(`url( a ")" b ) \\\nurl(c)`)).toBe(`url( a "?" b ) ?\nurl(c)`)
	})

	it(`a divider behind a bare address holding a quotation mark, which the parser reads as opening a string until the divider in front of that address is masked`, () => {
		expect(hideParenthesesInUrlStrings(`\\\nurl(a"b) \\\nurl(c) "e"`)).toBe(`?\nurl(a"b) ?\nurl(c) "e"`)
	})

	it(`a divider whose backslash ends a \`//\` comment the break closes, in front of a name that is code`, () => {
		let text = `1px // c \\\nurl(a(b)c.png) f(x)`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(`1px // c ?\nurl(a(b)c.png) f(x)`)
	})

	it(`the same divider in front of a name an escape spells a letter of`, () => {
		expect(hideParenthesesInUrlStrings(`\\\nu\\rl(a)`)).toBe(`?\nu\\rl(a)`)
	})

	it(`the same divider in front of an address whose string holds a parenthesis, which is masked once the name is read`, () => {
		expect(hideParenthesesInUrlStrings(`\\\nurl( a ")" b )`)).toBe(`?\nurl( a "?" b )`)
	})

	it(`a Windows pair behind the backslash, whose line feed the parser divides the name on itself`, () => {
		expect(hideParenthesesInUrlStrings(`\\\r\nurl(a)`)).toBe(`\\\r\nurl(a)`)
	})

	it(`a space or a tab behind the backslash, which close no divider and spell a character of the name`, () => {
		expect(hideParenthesesInUrlStrings(`\\ url(a)`)).toBe(`\\ url(a)`)
		expect(hideParenthesesInUrlStrings(`\\\turl(a)`)).toBe(`\\\turl(a)`)
	})

	it(`a divider in front of another name`, () => {
		expect(hideParenthesesInUrlStrings(`\\\nimage-url(a)`)).toBe(`\\\nimage-url(a)`)
		expect(hideParenthesesInUrlStrings(`\\\nf(a)`)).toBe(`\\\nf(a)`)
	})

	it(`a string holding no parenthesis`, () => {
		expect(hideParenthesesInUrlStrings(`url( a "b" c ) 1px`)).toBe(`url( a "b" c ) 1px`)
	})

	it(`a string behind an address with no whitespace, which the tokenizer takes to the first parenthesis as well`, () => {
		expect(hideParenthesesInUrlStrings(`url(a ")" b) 1px`)).toBe(`url(a ")" b) 1px`)
	})

	it(`a string behind a vertical tab, which is no whitespace to the tokenizer`, () => {
		expect(hideParenthesesInUrlStrings(`url(\va ")" b) 1px`)).toBe(`url(\va ")" b) 1px`)
	})

	it(`a name behind a comma, which the tokenizer glues to the word in front of it`, () => {
		expect(hideParenthesesInUrlStrings(`1,url(a ")" b) 1px`)).toBe(`1,url(a "?" b) 1px`)
	})

	it(`a name behind a solidus, which ends a word of the tokenizer's only in front of a star`, () => {
		expect(hideParenthesesInUrlStrings(`1/url(a ")/b" c) 2px`)).toBe(`1/url(a "?/b" c) 2px`)
	})

	it(`a name behind a vertical tab, which is whitespace to the parser and a word to the tokenizer`, () => {
		expect(hideParenthesesInUrlStrings(`1\vurl(a ")" b) 1px`)).toBe(`1\vurl(a "?" b) 1px`)
	})

	it(`the same name behind whitespace the tokenizer reads, which leaves it a word of its own`, () => {
		expect(hideParenthesesInUrlStrings(`1, url(a ")" b) 1px`)).toBe(`1, url(a ")" b) 1px`)
	})

	it(`a name behind a comment, which ends a word of the tokenizer's`, () => {
		let text = `1/*c*/url(a ")" b) 1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(text)
	})

	it(`a name behind a colon, which both readers end a word on`, () => {
		expect(hideParenthesesInUrlStrings(`1:url(a ")" b) 1px`)).toBe(`1:url(a ")" b) 1px`)
	})

	it(`a name behind an opening parenthesis, likewise`, () => {
		expect(hideParenthesesInUrlStrings(`1(url(a ")" b) 1px`)).toBe(`1(url(a ")" b) 1px`)
	})

	it(`a name behind the closing parenthesis of a call, likewise`, () => {
		expect(hideParenthesesInUrlStrings(`f(1)url(a ")" b) 1px`)).toBe(`f(1)url(a ")" b) 1px`)
	})

	it(`a quoted address, which the parser reads as a string`, () => {
		expect(hideParenthesesInUrlStrings(`url( ")" ) 1px`)).toBe(`url( ")" ) 1px`)
	})

	it(`a call of another name, which the parser reads as code`, () => {
		expect(hideParenthesesInUrlStrings(`URL( a ")" b ) 1px`)).toBe(`URL( a ")" b ) 1px`)
	})

	it(`an escaped mark behind the whitespace, which opens no string`, () => {
		expect(hideParenthesesInUrlStrings(`url( a \\")" b ) 1px`)).toBe(`url( a \\")" b ) 1px`)
	})

	it(`a comment behind the parenthesis the caller has blanked to spaces, which the tokenizer reads as part of a bare address`, () => {
		expect(hideParenthesesInUrlStrings(`url(    a ")" x) 1px`, [{ start: 4, end: 8, isInline: false }])).toBe(`url(    a ")" x) 1px`)
	})

	it(`an address inside an inline comment`, () => {
		let text = `// url( a ")" b )\n1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(text)
	})

	it(`an address inside a comment`, () => {
		let text = `/* url( a ")" b ) */ 1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(text)
	})
})
