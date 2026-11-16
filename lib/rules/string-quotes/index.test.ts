import { CHARSET_RULE_MESSAGE } from "../../utils/asksForTheCharsetRule/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`single`],

	accept: [
		{
			description: `an empty stylesheet`,
			code: ``,
		},
		{
			description: `a rule with no string in it`,
			code: `a {}`,
		},
		{
			description: `a bare address inside a url call, which is no string`,
			code: `@import url(foo.css);`,
		},
		{
			description: `a declaration with no string in it`,
			code: `a { color: pink; }`,
		},
		{
			description: `a single-quoted value`,
			code: `a::before { content: 'foo'; }`,
		},
		{
			description: `a single-quoted address`,
			code: `a { background: url('foo'); }`,
		},
		{
			description: `a single-quoted attribute value`,
			code: `a[id='foo'] {}`,
		},
		{
			description: `double quotes standing inside a single-quoted value`,
			code: `a::before { content: 'foo"horse"cow'; }`,
		},
		{
			description: `double quotes standing inside a single-quoted at-rule parameter`,
			code: `@import 'foo"horse"cow.css'`,
		},
		{
			description: `double quotes standing inside a single-quoted attribute value`,
			code: `a[foo='foo"horse"cow'] {}`,
		},
		{
			description: `double quotes inside a comment, which the rule does not read`,
			code: `a { /* "horse" */ }`,
		},
		{
			description: `an attribute selector the parser cannot read, standing beside one it can`,
			code: `a[b=#{c}][d="e"] { }`,
		},
	],

	reject: [
		{
			// The value parser opens an address on the name spelled `url` alone, and reads the quotation marks inside every other spelling as a string
			description: `a quotation mark inside a bare address whose name is written in capitals, which is a character of the address, beside a double-quoted value`,
			code: `a { b: URL(a"b"c); c: "d" }`,
			fixed: `a { b: URL(a"b"c); c: 'd' }`,
			line: 1,
			column: 23,
			message: messages.expected(`single`),
		},
		{
			// The rule walks a copy with the comment blanked to spaces, where the string is the first node of the call; to the CSS tokenizer the comment is no whitespace, so lightningcss reads a bad url token in either spelling of the name and Less refuses the file
			description: `a comment between the parenthesis and the quotation mark of an address whose name is written in capitals, beside a double-quoted value`,
			code: `a { b: URL(/*c*/"a"); c: "d" }`,
			fixed: `a { b: URL(/*c*/"a"); c: 'd' }`,
			line: 1,
			column: 26,
			message: messages.expected(`single`),
		},
		{
			// The value parser passes a control character over in front of the string as whitespace, the tokenizer takes the parentheses behind it as one token, and the compilers refuse the file
			description: `a vertical tab between the parenthesis and the quotation mark of an address, beside a double-quoted value`,
			code: `a { b: url(\v"a"); c: "d" }`,
			fixed: `a { b: url(\v"a"); c: 'd' }`,
			line: 1,
			column: 22,
			message: messages.expected(`single`),
		},
		{
			description: `the same address with a letter of its name escaped`,
			code: `a { b: u\\rl(a"b"c); c: "d" }`,
			fixed: `a { b: u\\rl(a"b"c); c: 'd' }`,
			line: 1,
			column: 24,
			message: messages.expected(`single`),
		},
		{
			description: `a quoted address whose name opens with a hexadecimal escape, which is a string`,
			code: `a { b: \\75 rl("a"); }`,
			fixed: `a { b: \\75 rl('a'); }`,
			line: 1,
			column: 15,
			message: messages.expected(`single`),
		},
		{
			// The space closing the escape is part of it, so the escaped letter and the name are one name, which CSS reads as `aurl`, a call whose parentheses hold a string
			description: `a string inside the parentheses of a call whose name a hexadecimal escape in front welds into a name other than url`,
			code: `a { b: \\61 url(a"b"c); }`,
			fixed: `a { b: \\61 url(a'b'c); }`,
			line: 1,
			column: 17,
			message: messages.expected(`single`),
		},
		{
			description: `the same call with a line break closing the escape`,
			code: `a { b: \\61\nurl(a"b"c); }`,
			fixed: `a { b: \\61\nurl(a'b'c); }`,
			line: 2,
			column: 6,
			message: messages.expected(`single`),
		},
		{
			description: `an attribute value spelling a preprocessor construct, which is text rather than syntax`,
			code: `[title=":extend(x)"] {}`,
			fixed: `[title=':extend(x)'] {}`,
			line: 1,
			column: 8,
			message: messages.expected(`single`),
		},
		{
			description: `an attribute value spelling an interpolation, which is text rather than syntax`,
			code: `[title="#{a}"] {}`,
			fixed: `[title='#{a}'] {}`,
			line: 1,
			column: 8,
			message: messages.expected(`single`),
		},
		{
			description: `a double-quoted value`,
			code: `a::before { content: "foo"; }`,
			fixed: `a::before { content: 'foo'; }`,
			line: 1,
			column: 22,
			message: messages.expected(`single`),
		},
		{
			description: `the same declaration written over three lines`,
			code: `
				a::before
				{
				  content: "foo";
				}
			`,
			fixed: `
				a::before
				{
				  content: 'foo';
				}
			`,
			line: 3,
			column: 12,
			message: messages.expected(`single`),
		},
		{
			description: `a double-quoted attribute value`,
			code: `a[id="foo"] {}`,
			fixed: `a[id='foo'] {}`,
			line: 1,
			column: 6,
			message: messages.expected(`single`),
		},
		{
			description: `a comment standing in the selector, which the fix leaves where the author put it, the warning at the quote it is about`,
			code: `.foo /* x */ [title="y"] {}`,
			fixed: `.foo /* x */ [title='y'] {}`,
			line: 1,
			column: 21,
			message: messages.expected(`single`),
		},
		{
			description: `the same, with the comment behind the attribute`,
			code: `[title="y"] /* x */ {}`,
			fixed: `[title='y'] /* x */ {}`,
			line: 1,
			column: 8,
			message: messages.expected(`single`),
		},
		{
			description: `a comment in either selector of a list, both kept`,
			code: `.foo /* x */ [title="y"], .bar /* z */ [id="w"] {}`,
			fixed: `.foo /* x */ [title='y'], .bar /* z */ [id='w'] {}`,
			warnings: [
				{
					line: 1,
					column: 21,
					message: messages.expected(`single`),
				},
				{
					line: 1,
					column: 44,
					message: messages.expected(`single`),
				},
			],
		},
		{
			description: `a double-quoted attribute value with spaces inside the brackets`,
			code: `a[ id="foo" ] {}`,
			fixed: `a[ id='foo' ] {}`,
			line: 1,
			column: 7,
			message: messages.expected(`single`),
		},
		{
			description: `a double-quoted address, in a rule written over two lines`,
			code: `a\n{ background: url("foo"); }`,
			fixed: `a\n{ background: url('foo'); }`,
			line: 2,
			column: 19,
			message: messages.expected(`single`),
		},
		{
			description: `a double slash opens no comment where the syntax has none`,
			code: `a { --config: //cdn.example.com/a.png "fallback"; }`,
			fixed: `a { --config: //cdn.example.com/a.png 'fallback'; }`,
			line: 1,
			column: 39,
			message: messages.expected(`single`),
		},
		{
			description: `a double-quoted at-rule parameter`,
			code: `@import "base.css"`,
			fixed: `@import 'base.css'`,
			line: 1,
			column: 9,
			message: messages.expected(`single`),
		},
		{
			description: `a string opening such parentheses, which keeps them code to the tokenizer`,
			code: `a { b: url ("a") }`,
			fixed: `a { b: url ('a') }`,
			line: 1,
			column: 13,
			message: messages.expected(`single`),
		},
		{
			description: `the same parentheses behind a name the tokenizer reads as one longer word, which leaves them code and the marks strings`,
			code: `a { b: aurl (a"b"c); }`,
			fixed: `a { b: aurl (a'b'c); }`,
			line: 1,
			column: 15,
			message: messages.expected(`single`),
		},
		{
			// Sass and lightningcss read the parentheses as code and the pair as the string it is, and the tokenizer holds the parentheses opaque, so rewriting both marks changes only the text inside them
			description: `a pair of marks standing wholly inside such a token, which Sass and lightningcss read as the string it is`,
			code: `a { b: url (a"b"c); }`,
			fixed: `a { b: url (a'b'c); }`,
			line: 1,
			column: 14,
			message: messages.expected(`single`),
		},
		{
			description: `a pair standing wholly inside that same token, which is rewritten as one inside a token the text's own word opened`,
			code: `a { b: url } @media (c"d"e) { f: g }`,
			fixed: `a { b: url } @media (c'd'e) { f: g }`,
			line: 1,
			column: 23,
			message: messages.expected(`single`),
		},
		{
			description: `a charset in every spelling, which the rule passes over, the file getting the one warning asking for the core rule instead`,
			code: `@charset "utf-8";\n@CHARSET 'utf-8';\n@charset  "utf-8" ;`,
			fixed: `@charset "utf-8";\n@CHARSET 'utf-8';\n@charset  "utf-8" ;`,
			line: 1,
			column: 1,
			message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
		},
	],
})

testRule({
	ruleName,
	config: [`double`],

	accept: [
		{
			description: `an empty stylesheet`,
			code: ``,
		},
		{
			description: `a rule with no string in it`,
			code: `a {}`,
		},
		{
			description: `a bare address inside a url call, which is no string`,
			code: `@import url(foo.css);`,
		},
		{
			description: `a declaration with no string in it`,
			code: `a { color: pink; }`,
		},
		{
			description: `a double-quoted value`,
			code: `a::before { content: "foo"; }`,
		},
		{
			description: `a double-quoted address`,
			code: `a { background: url("foo"); }`,
		},
		{
			description: `a double-quoted attribute value`,
			code: `a[id="foo"] {}`,
		},
		{
			description: `single quotes standing inside a double-quoted value`,
			code: `a::before { content: "foo'horse'cow"; }`,
		},
		{
			description: `single quotes standing inside a double-quoted at-rule parameter`,
			code: `@import "foo'horse'cow.css"`,
		},
		{
			description: `single quotes standing inside a double-quoted attribute value`,
			code: `a[foo="foo'horse'cow"] {}`,
		},
		{
			description: `single quotes inside a comment, which the rule does not read`,
			code: `a { /* 'horse' */ }`,
		},
	],

	reject: [
		{
			description: `a single-quoted value`,
			code: `a::before { content: 'foo'; }`,
			fixed: `a::before { content: "foo"; }`,
			line: 1,
			column: 22,
			message: messages.expected(`double`),
		},
		{
			description: `the same declaration written over three lines`,
			code: `
				a::before
				{
				  content: 'foo';
				}
			`,
			fixed: `
				a::before
				{
				  content: "foo";
				}
			`,
			line: 3,
			column: 12,
			message: messages.expected(`double`),
		},
		{
			description: `a single-quoted attribute value`,
			code: `a[id='foo'] {}`,
			fixed: `a[id="foo"] {}`,
			line: 1,
			column: 6,
			message: messages.expected(`double`),
		},
		{
			description: `a single-quoted address`,
			code: `a { background: url('foo'); }`,
			fixed: `a { background: url("foo"); }`,
			line: 1,
			column: 21,
			message: messages.expected(`double`),
		},
		{
			// The value parser opens an address on the name spelled `url` alone, and reads the quotation marks inside every other spelling as a string
			description: `a quotation mark inside a bare address whose name opens with a hexadecimal escape, which is a character of the address, beside a single-quoted value`,
			code: `a { b: \\75 rl(a'b'c); c: 'd' }`,
			fixed: `a { b: \\75 rl(a'b'c); c: "d" }`,
			line: 1,
			column: 26,
			message: messages.expected(`double`),
		},
		{
			description: `a single-quoted at-rule parameter`,
			code: `@import 'base.css'`,
			fixed: `@import "base.css"`,
			line: 1,
			column: 9,
			message: messages.expected(`double`),
		},
		{
			description: `accurate positions on both sides of a comment inside the value`,
			code: `
				a {
					content: 'x' /* c */ 'y';
				}
			`,
			fixed: `
				a {
					content: "x" /* c */ "y";
				}
			`,
			warnings: [
				{
					line: 2,
					column: 11,
					message: messages.expected(`double`),
				},
				{
					line: 2,
					column: 23,
					message: messages.expected(`double`),
				},
			],
		},
		{
			description: `accurate position after a comment inside at-rule params`,
			code: `@import 'x' /* c */ screen;`,
			fixed: `@import "x" /* c */ screen;`,
			line: 1,
			column: 9,
			message: messages.expected(`double`),
		},
		{
			description: `a string standing beside a comment opening with a solidus, a star and a solidus, whose text spells a string of its own that the value parser hands back as one`,
			code: `a { b: 'a' /*/ 'x' */ 3; }`,
			fixed: `a { b: "a" /*/ 'x' */ 3; }`,
			line: 1,
			column: 8,
			message: messages.expected(`double`),
		},
		{
			description: `the same comment between the parameters of an at-rule`,
			code: `@import 'a' /*/ 'x' */ 'b';`,
			fixed: `@import "a" /*/ 'x' */ "b";`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expected(`double`),
				},
				{
					line: 1,
					column: 24,
					message: messages.expected(`double`),
				},
			],
		},
		{
			description: `such a comment standing beside a quoted address inside its parentheses, which is a comment to every tokenizer`,
			code: `a { b: url("a" /*/ 'x' */) 'y'; }`,
			fixed: `a { b: url("a" /*/ 'x' */) "y"; }`,
			line: 1,
			column: 28,
			message: messages.expected(`double`),
		},
	],
})

// No fix: true here because styles which require escaping aren't autofixed, only reported.
testRule({
	ruleName,
	config: [`single`, { avoidEscape: false }],
	reject: [
		{
			description: `double quotes around a value that carries single ones, which the option no longer spares`,
			code: `a::before { content: "foo'horse'cow"; }`,
			line: 1,
			column: 22,
			message: messages.expected(`single`),
		},
		{
			description: `double quotes around an at-rule parameter that carries single ones`,
			code: `@import "foo'horse'cow.css";`,
			line: 1,
			column: 9,
			message: messages.expected(`single`),
		},
		{
			description: `double quotes around an attribute value that carries single ones`,
			code: `a[foo="foo'horse'cow"] {}`,
			line: 1,
			column: 7,
			message: messages.expected(`single`),
		},
	],
})

// No fix: true here because styles which require escaping aren't autofixed, only reported.
testRule({
	ruleName,
	config: [`double`, { avoidEscape: false }],
	reject: [
		{
			description: `single quotes around a value that carries double ones, which the option no longer spares`,
			code: `a::before { content: 'foo"horse"cow'; }`,
			line: 1,
			column: 22,
			message: messages.expected(`double`),
		},
		{
			description: `single quotes around an at-rule parameter that carries double ones`,
			code: `@import 'foo"horse"cow.css';`,
			line: 1,
			column: 9,
			message: messages.expected(`double`),
		},
		{
			description: `single quotes around an attribute value that carries double ones`,
			code: `a[foo='foo"horse"cow'] {}`,
			line: 1,
			column: 7,
			message: messages.expected(`double`),
		},
	],
})
