import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })
let testRuleConfigs = createTestRuleConfig({ ruleName })

const TEST_URL = `somethingsomething something\tsomething`
const TWENTY_ONE_WHITESPACES = Array.from({ length: 21 }).fill(`\u0020`).join(``)

testRule({
	ruleName,
	config: [20],

	accept: [
		{
			description: `a line under the limit`,
			code: `a { color: 0; }`,
		},
		{
			description: `a line under the limit, its spacing loose`,
			code: `a {  color   : 0 ; }`,
		},
		{
			description: `two lines, each under the limit`,
			code: `a { color: 0;\n  top: 0; }`,
		},
		{
			description: `a media query written over five lines`,
			code: `
				@media print {
				  a {
				    color: pink;
				 }
				}
			`,
		},
		{
			description: `a long address inside a url call, which comes off the line`,
			code: `a {\n background: url("${TEST_URL}");\n}`,
		},
		{
			description: `a long address in an import and another in a url call`,
			code: `@import '${TEST_URL}';\na {\n background: url("${TEST_URL}");\n}`,
		},
		{
			description: `the same call written in mixed case`,
			code: `a {\n background: uRl("${TEST_URL}");\n}`,
		},
		{
			description: `the same call written in upper case`,
			code: `a {\n background: URL("${TEST_URL}");\n}`,
		},
		{
			description: `a url call broken over three lines`,
			code: `a {\n  background: url(\n  "${TEST_URL}"\n  );\n}`,
		},
		{
			description: `the same call written in mixed case`,
			code: `a {\n  background: uRl(\n  "${TEST_URL}"\n  );\n}`,
		},
		{
			description: `the same call written in upper case`,
			code: `a {\n  background: URL(\n  "${TEST_URL}"\n  );\n}`,
		},
		{
			description: `two url calls, each broken over three lines`,
			code: `a {\n  background: URL(\n  "${TEST_URL}"\n  );\nbackground: url(\n  "${TEST_URL}"\n);\n}`,
		},
		{
			autoStripIndent: false,
			description: `a line closed by a carriage-return line break`,
			code: `a { margin: 0 2px; }\r\n`,
		},
		{
			autoStripIndent: false,
			description: `two lines, the first of them closed by a carriage-return line break`,
			code: `a { margin: 0 2px; }\r\na { margin: 4px 0; }\n`,
		},
		{
			description: `an import whose address comes off the line, with a media type behind it`,
			code: `@import url("${TEST_URL}") print;`,
		},
		{
			description: `a single-quoted address in an import`,
			code: `@import '${TEST_URL}';`,
		},
		{
			description: `a double-quoted address in an import`,
			code: `@import "${TEST_URL}";`,
		},
		{
			description: `the same address wrapped in a url call`,
			code: `@import url("${TEST_URL}");`,
		},
		{
			description: `an import whose address carries quotes and angle brackets`,
			code: `@import 'svg-something<id="horse">' projection;`,
		},
		{
			description: `exactly 20 whitespaces`,
			code: `a {\n background-image:\nurl(\n${TWENTY_ONE_WHITESPACES.slice(0, 20)}"${TEST_URL}"\n); }`,
		},
		{
			description: `exactly 20 whitespaces`,
			code: `a {\n background-image:\nurl(\n"${TEST_URL}"${TWENTY_ONE_WHITESPACES.slice(0, 20)}\n); }`,
		},
	],

	reject: [
		{
			description: `a line over the limit by its spacing alone`,
			code: `a {   color   : 0  ;}`,
			line: 1,
			column: 21,
			message: messages.expected(20),
		},
		{
			description: `two declarations on one line`,
			code: `a { color: 0; top: 0; }`,
			line: 1,
			column: 23,
			message: messages.expected(20),
		},
		{
			description: `three declarations on the second line`,
			code: `a { color: 0;\n  top: 0; bottom: 0; right: 0; \n  left: 0; }`,
			line: 2,
			column: 31,
			message: messages.expected(20),
		},
		{
			description: `three declarations on the third line`,
			code: `
				a { color: 0;
				  top: 0;
				  left: 0; bottom: 0; right: 0; }
			`,
			line: 3,
			column: 33,
			message: messages.expected(20),
		},
		{
			description: `indentation putting a url call over the limit`,
			code: `a {\n  background: URL(\n  "${TEST_URL}"\n  );\n           background: url(\n  "${TEST_URL}"\n);\n}`,
			line: 5,
			column: 27,
			message: messages.expected(20),
		},
		{
			description: `two declarations on the third line of a media query`,
			code: `
				@media print {
				  a {
				    color: pink; background: orange;
				 }
				}
			`,
			line: 3,
			column: 36,
			message: messages.expected(20),
		},
		{
			description: `a media query over the limit`,
			code: `@media (min-width: 30px) and screen {}`,
			line: 1,
			column: 38,
			message: messages.expected(20),
		},
		{
			autoStripIndent: false,
			description: `a line over the limit, closed by a carriage-return line break`,
			code: `a { margin: 0 2rem; }\r\n`,
			line: 1,
			column: 21,
			message: messages.expected(20),
		},
		{
			description: `an import whose media types put it over the limit`,
			code: `@import url("${TEST_URL}") projection, tv;`,
			line: 1,
			column: 69,
			message: messages.expected(20),
		},
		{
			description: `the same import with a single-quoted address`,
			code: `@import '${TEST_URL}' projection, tv;`,
			line: 1,
			column: 64,
			message: messages.expected(20),
		},
		{
			description: `the same import with a double-quoted address`,
			code: `@import "${TEST_URL}" projection, tv;`,
			line: 1,
			column: 64,
			message: messages.expected(20),
		},
		{
			description: `an import whose address carries quotes and angle brackets, with media types behind it`,
			code: `@import 'svg-something<id="horse">' screens, tv;`,
			line: 1,
			column: 48,
			message: messages.expected(20),
		},
		{
			description: `a url call inside a declaration, whose address comes off the line`,
			code: `a { background-image: url("${TEST_URL}"); }`,
			line: 1,
			column: 70,
			message: messages.expected(20),
		},
		{
			description: `a comment over the limit`,
			code: `
				a {
				    /* Lorem ipsum dolor sit amet. The comment Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium officia fugiat unde deserunt sit, tenetur! Incidunt similique blanditiis placeat ad quia possimus libero, reiciendis excepturi non esse deserunt a odit. */
				}
			`,
			line: 2,
			column: 272,
			message: messages.expected(20),
		},
		{
			description: `more than 20 whitespaces`,
			code: `a {
        background-image:
        url(
        ${TWENTY_ONE_WHITESPACES}"${TEST_URL}"
        );
      }`,
			line: 4,
			column: 69,
			message: messages.expected(20),
		},
		{
			description: `more than 20 whitespaces`,
			code: `a {
        background-image:
        url(
        "${TEST_URL}"${TWENTY_ONE_WHITESPACES}
        );
      }`,
			line: 4,
			column: 69,
			message: messages.expected(20),
		},
		{
			description: `whitespace behind a url address, which is measured where the address is not`,
			code: `@import '${TEST_URL}';\na {\n background: url("${TEST_URL}"${TWENTY_ONE_WHITESPACES});\n}`,
			warnings: [
				{
					line: 3,
					column: 80,
					message: messages.expected(20),
				},
			],
		},
		{
			description: `the same whitespace inside an import`,
			code: `@import url("${TEST_URL}"${TWENTY_ONE_WHITESPACES});`,
			warnings: [
				{
					line: 1,
					column: 75,
					message: messages.expected(20),
				},
			],
		},
		{
			description: `whitespace behind the address of an import and behind that of a url call`,
			code: `@import '${TEST_URL}'${TWENTY_ONE_WHITESPACES};\na {\n background: url("${TEST_URL}"${TWENTY_ONE_WHITESPACES});\n}`,
			warnings: [
				{
					line: 1,
					column: 70,
					message: messages.expected(20),
				},
				{
					line: 3,
					column: 80,
					message: messages.expected(20),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [20],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `a long line of the document, which holds no stylesheet`,
			code: `<div>
<div>Very very very very very very very very very very very very very long line</div>
<style>
a {
  color: red;
}
</style>

</div>`,
		},
	],

	reject: [
		{
			description: `loose spacing inside an embedded stylesheet`,
			code: `<div>
<style>
a {
  color     :      red;
}
</style>

</div>`,
			line: 4,
			column: 23,
			message: messages.expected(20),
		},
		{
			description: `a long line of the document standing in front of an embedded stylesheet`,
			code: `<div>
<div>Very very very very very very very very very very very very very long line</div>
<div>Very very very very very very very very very very very very very long line</div>
<style>
a {
  color     :      red;
}
</style>

</div>`,
			line: 6,
			column: 23,
			message: messages.expected(20),
		},
	],
})

testRule({
	ruleName,
	config: [30],

	accept: [
		{
			description: `three lines, each under a limit of thirty`,
			code: `a { color: 0;\n  top: 0; left: 0; right: 0; \n  bottom: 0; }`,
		},
		{
			description: `an import with a long address and a media type`,
			code: `@import url("somethingsomethingsomethingsomething.css") print;`,
		},
		{
			description: `the same import with two media types`,
			code: `@import url("somethingsomethingsomethingsomething.css") projection, tv;`,
		},
		{
			description: `an import whose address carries a scheme`,
			code: `@import url("chrome://somethingsomethingsomethingsomething/");`,
		},
		{
			description: `an import with a quoted address and two media types`,
			code: `@import "somethingsomethingsomethingsomething.css" screen, projection;`,
		},
	],

	reject: [
		{
			description: `four declarations on the second line`,
			code: `a { color: 0;\n  top: 0; left: 0; right: 0; background: pink; \n  bottom: 0; }`,
			line: 2,
			column: 47,
			message: messages.expected(30),
		},
		{
			description: `an import whose two media types put it over the limit`,
			code: `@import url("somethingsomethingsomethingsomething.css") projection, screen;`,
			line: 1,
			column: 75,
			message: messages.expected(30),
		},
		{
			description: `the same import with three media types`,
			code: `@import "somethingsomethingsomethingsomething.css" screen, projection, tv;`,
			line: 1,
			column: 74,
			message: messages.expected(30),
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignore: `non-comments` }],

	accept: [
		{
			description: `three declarations on one line, which this option does not measure`,
			code: `a { color: 0; top: 0; bottom: 0; }`,
		},
		{
			description: `a comment standing among declarations, none of it measured`,
			code: `a { color: 0; top: 0; /* too long comment here */ bottom: 0; }`,
		},
		{
			description: `a comment under the limit`,
			code: `/* short nuff */`,
		},
		{
			description: `a comment broken over two lines`,
			code: `/* short\nnuff */`,
		},
		{
			description: `a comment whose every line is under the limit`,
			code: `/**\n * each line\n * short nuff\n */`,
		},
		{
			description: `a comment standing between two rules`,
			code: `
				a { color: 0; }
				/* short nuff */
				b {}
			`,
		},
		{
			description: `a comment of several lines standing between two rules`,
			code: `a {}\n/**\n * each line\n * short nuff\n */\nb {}`,
		},
		{
			description: `a comment over the limit sharing its line with a rule, which this option does not measure`,
			code: `a { /* this comment is too long for the max length */ }`,
		},
	],

	reject: [
		{
			description: `a comment over the limit`,
			code: `/* comment that is too long */`,
			line: 1,
			column: 30,
			message: messages.expected(20),
		},
		{
			description: `the same comment indented between two rules`,
			code: `
				a {}
				  /* comment that is too long */
				b {}
			`,
			line: 2,
			column: 32,
			message: messages.expected(20),
		},
		{
			description: `a longer comment over the limit`,
			code: `/* this comment is too long for the max length */`,
			line: 1,
			column: 49,
			message: messages.expected(20),
		},
		{
			description: `one line of a comment over the limit`,
			code: `a {}\n/**\n * each line\n * short nuff\n * except this one which is too long\n */\nb {}`,
			line: 5,
			column: 36,
			message: messages.expected(20),
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignore: `comments` }],

	accept: [
		{
			description: `a comment over the limit, which this option lets stand`,
			code: `/* comment that is too long */`,
		},
		{
			autoStripIndent: false,
			description: `the same comment behind indentation`,
			code: `       /* comment that is too long */`,
		},
		{
			description: `a comment in front of a rule, the line under the limit`,
			code: `/* short */ a { color: 0; }`,
		},
		{
			description: `a comment closed on the line a rule opens`,
			code: `a {}\n/* comment that is too long\n*/ a { color: 0; top: 0; }`,
		},
		{
			description: `a comment whose every line is over the limit`,
			code: `/**\n comment that is too long #1\n comment that is too long #2 */`,
		},
	],

	reject: [
		{
			description: `a comment behind a rule, on a line this option does measure`,
			code: `a { color: 0; } /* comment that is too long */`,
			line: 1,
			column: 46,
			message: messages.expected(20),
		},
		{
			description: `a comment inside a rule, on a line this option does measure`,
			code: `a { /* this comment is too long for the max length */ }`,
			line: 1,
			column: 55,
			message: messages.expected(20),
		},
	],
})

testRule({
	ruleName,
	config: [30, { ignorePattern: `/^my-/` }],

	accept: [
		{
			description: `a declaration whose name the ignore pattern matches`,
			code: `my-property: has-a-really-long-declaration-value-for-some-reason`,
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignorePattern: `/https?://[0-9,a-z]*.*/` }],

	accept: [
		{
			description: `a comment carrying an address the ignore pattern matches`,
			code: `/* ignore urls https://www.example.com */`,
		},
	],

	reject: [
		{
			description: `a comment carrying no address, which the pattern does not match`,
			code: `/* don't ignore lines without urls something something */`,
			line: 1,
			column: 57,
			message: messages.expected(20),
		},
	],
})

testRule({
	ruleName,
	config: [30, { ignorePattern: `/@import\\s+/` }],

	accept: [
		{
			description: `an import the ignore pattern matches`,
			code: `@import "../../../something/something/something/something.css" screen, projection, tv;`,
		},
	],

	reject: [
		{
			description: `a line of declarations the pattern does not match`,
			code: `a { color: 0;\n  top: 0; left: 0; right: 0; background: pink; \n  bottom: 0; }`,
			line: 2,
			column: 47,
			message: messages.expected(30),
		},
		{
			description: `a line of declarations behind an import the pattern matches`,
			code: `@import "../../../something/something/something/something.css";\na { color: 0;\n  top: 0; left: 0; right: 0; background: pink; \n  bottom: 0; }`,
			line: 3,
			column: 47,
			message: messages.expected(30),
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignorePattern: `/(Multiple:.+)|(Should:.+)/` }],

	accept: [
		{
			description: `a comment whose every long line the pattern matches`,
			code: `/*\n Multiple: lines in multiline comments\n Should: be able to be ignored\n*/`,
		},
	],

	reject: [
		{
			description: `a comment line the pattern misses over one letter's case`,
			code: `/*\n multiple: lines in multiline comments\n Should: be able to be ignored\n*/`,
			line: 2,
			column: 38,
			message: messages.expected(20),
		},
	],
})

testRule({
	ruleName,
	config: [30, { ignorePattern: /^my-/u }],

	accept: [
		{
			description: `the same declaration, the pattern given as a regular expression rather than a string`,
			code: `my-property: has-a-really-long-declaration-value-for-some-reason`,
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignorePattern: /(Multiple:.+)|(Should:.+)/u }],

	accept: [
		{
			description: `the same comment, the pattern given as a regular expression rather than a string`,
			code: `/*\n Multiple: lines in multiline comments\n Should: be able to be ignored\n*/`,
		},
	],

	reject: [
		{
			description: `the same missed line, the pattern given as a regular expression rather than a string`,
			code: `/*\n multiple: lines in multiline comments\n Should: be able to be ignored\n*/`,
			line: 2,
			column: 38,
			message: messages.expected(20),
		},
	],
})

// A tab is measured up to the next tab stop, the way an editor with the same tab size shows it.
testRule({
	ruleName,
	config: [20, { tabSize: 4 }],

	accept: [
		{
			description: `a tab reaches the next tab stop rather than adding a whole tab size: 3 + 1 + 14 = 18`,
			code: `a {\tcolor: pink; }`,
		},
		{
			description: `two leading tabs, exactly the limit: 8 + 12 = 20`,
			code: `
				a {
						color: pink;
				}
			`,
		},
		{
			description: `the tab inside the address is excluded at the width it takes there: 16 + 4 = 20`,
			code: `a { cursor: url("${TEST_URL}"); }`,
		},
		{
			description: `a tab after the address is measured where it stands, not where it would stand with the address cut out: 14 + 2 + 1 + 1 = 18`,
			code: `a { mask: url("x");\t}`,
		},
		{
			description: `the carriage return is neither measured nor excluded: 8 + 12 = 20`,
			code: `a {\r\n\t\tcolor: pink;\r\n}`,
		},
	],

	reject: [
		{
			description: `two leading tabs, over the limit by their widths alone: 8 + 13 = 21`,
			code: `
				a {
						color: black;
				}
			`,
			line: 2,
			column: 15,
			message: messages.expected(20),
		},
		{
			description: `the second tab stop is found after the first tab is expanded: 1 + 3 + 1 + 3 + 13 = 21`,
			code: `a\t{\tcolor: pink }`,
			line: 1,
			column: 17,
			message: messages.expected(20),
		},
		{
			description: `the leading tab counts as four while the address is still excluded: 4 + 16 + 2 = 22`,
			code: `
				a {
					background: url("${TEST_URL}");
				}
			`,
			line: 2,
			column: 59,
			message: messages.expected(20),
		},
		{
			description: `two leading tabs in front of a carriage return: 8 + 13 = 21`,
			code: `a {\r\n\t\tcolor: black;\r\n}`,
			line: 2,
			column: 15,
			message: messages.expected(20),
		},
		{
			description: `a comment is measured like any other line: 8 + 20 = 28`,
			code: `
				a {
						/* a comment here */
				}
			`,
			line: 2,
			column: 22,
			message: messages.expected(20),
		},
	],
})

testRule({
	ruleName,
	config: [20, { tabSize: 4, ignore: `comments` }],

	accept: [
		{
			description: `a comment is passed over before it is measured`,
			code: `
				a {
						/* a comment here */
				}
			`,
		},
	],
})

testRule({
	ruleName,
	config: [20, { tabSize: 2 }],

	accept: [
		{
			description: `three leading tabs of two columns each: 6 + 13 = 19`,
			code: `
				a {
							color: black;
				}
			`,
		},
	],

	reject: [
		{
			description: `four leading tabs of two columns each: 8 + 13 = 21`,
			code: `
				a {
								color: black;
				}
			`,
			line: 2,
			column: 17,
			message: messages.expected(20),
		},
	],
})

// The example of issue #10: a line an editor with a tab size of 2 shows as 102 columns wide.
testRule({
	ruleName,
	config: [100, { tabSize: 2 }],

	reject: [
		{
			description: `a value put over the limit by four levels of nesting`,
			code: `
				a {
					b {
						c {
							d {
								--background-color: color-mix(in srgb, var(--button-background-color), var(--link-color) 20%);
							}
						}
					}
				}
			`,
			line: 5,
			column: 98,
			message: messages.expected(100),
		},
	],
})

testRuleConfigs({
	ruleName,

	accept: [
		{
			config: [20, { tabSize: 1 }],
		},
		{
			config: [20, { tabSize: 2 }],
		},
		{
			config: [20, { tabSize: 8 }],
		},
	],

	reject: [
		{
			config: [20, { tabSize: 0 }],
		},
		{
			config: [20, { tabSize: -4 }],
		},
		{
			config: [20, { tabSize: 1.5 }],
		},
		{
			config: [20, { tabSize: `4` }],
		},
		{
			config: [20, { tabSize: true }],
		},
	],
})

// Every excluded substring standing on a line comes off that line, and off no other (see #197).
testRule({
	ruleName,
	config: [20],

	accept: [
		{
			description: `both the import string and the address come off the line: 52 - 17 - 16 = 19`,
			code: `@import "aaaaaaaaaaaaaaa";a{b:url(bbbbbbbbbbbbbbbb)}`,
		},
		{
			description: `the import string holding an address comes off whole: 36 - 16 = 20`,
			code: `@import "aaaaa" url("bb") screen, a;`,
		},
	],

	reject: [
		{
			description: `the address is not taken off the line after the one it stands on`,
			code: `
				@import "a.css" screen; a { background: url(bb) }
				a { color: pink; }
			`,
			warnings: [
				{
					line: 1,
					column: 49,
					message: messages.expected(20),
				},
			],
		},
		{
			description: `the address standing inside the import string is not taken off twice: 37 - 16 = 21`,
			code: `@import "aaaaa" url("bb") screen, ab;`,
			line: 1,
			column: 37,
			message: messages.expected(20),
		},
	],
})

// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/427
// What comes off a line is the address of every `url()` the file spells, found by the walk that finds the comments of a text. The pattern that used to look for one asked nothing about the name in front of the parenthesis, ran to the last parenthesis of the line, read the three letters of the name as characters rather than as a name, and would not take an address of a single character off at all.
testRule({
	ruleName,
	config: [30],

	reject: [
		{
			description: `an address and a call of its own behind it, of which only the address comes off the line`,
			code: `a { background: url(a.png) no-repeat, linear-gradient(red, blue); }`,
			line: 1,
			column: 67,
			message: messages.expected(30),
		},
		{
			description: `an import whose address is wrapped in a url call, with a media query behind it`,
			code: `@import url(a.css) screen and (orientation:landscape);`,
			line: 1,
			column: 54,
			message: messages.expected(30),
		},
		{
			description: `a call whose name merely ends in the three letters of an address, whose arguments stay on the line`,
			code: `a { background: image-url(aaaaaaaaaaaa); }`,
			line: 1,
			column: 42,
			message: messages.expected(30),
		},
		{
			description: `an address written inside a block comment, which opens no call at all`,
			code: `/* a { background: url("http://x/y.png") } */`,
			line: 1,
			column: 45,
			message: messages.expected(30),
		},
	],
})

testRule({
	ruleName,
	config: [24],

	accept: [
		{
			description: `an address of a single character, which comes off the line like any other`,
			code: `bbbbbbbbbbbbbbbb: url(a);`,
		},
		{
			description: `an address whose name is spelled with an escape`,
			code: `a { background: u\\rl(http://x) }`,
		},
	],
})

testRule({
	ruleName,
	config: [20],

	reject: [
		{
			description: `a rule whose selector wraps an address in parentheses of its own, which the address does not reach into`,
			code: `.m(url(a,b)) { c: 2px; }`,
			line: 1,
			column: 24,
			message: messages.expected(20),
		},
	],
})

testRule({
	ruleName,
	config: [60],

	accept: [
		{
			description: `an address written across a form feed, which is whitespace to the tokenizer and no line of its own, so the whole of it still comes off`,
			code: `a { background: url(qqqqqqqqqqqq\fqqqqqqqqqqqq.png) qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq }`,
		},
	],

	reject: [
		{
			description: `a stray parenthesis inside a bare address, whose parentheses close on a line below and which is therefore no address at all`,
			code: `a { background: url(a(b.png) qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq }\n.c { d: e) }`,
			line: 1,
			column: 65,
			message: messages.expected(60),
		},
	],
})

// The reading of a double slash is the file's own syntax's, not the rule's namespace's: what `max-line-length` counts is the text the file spells, where such a comment stands as it was written rather than in the copy a syntax may have rewritten it out of.
testRule({
	ruleName,
	config: [22],

	accept: [
		{
			description: `an address behind a double slash in a file whose syntax spells no comment with one, where the address comes off the line like any other`,
			code: `a { b: 1px //url(bbbbbbbbbbbbbbbbbbbb.png)\n}`,
		},
	],
})
