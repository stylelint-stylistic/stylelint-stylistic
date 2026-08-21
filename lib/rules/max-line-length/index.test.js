import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })
const testRuleConfigs = createTestRuleConfig({ ruleName })

let testUrl = `somethingsomething something\tsomething`
let twentyOneWhitespaces = Array.from({ length: 21 }).fill(`\u0020`).join(``)

testRule({
	ruleName,
	config: [20],

	accept: [
		{
			code: `a { color: 0; }`,
			description: `a line under the limit`,
		},
		{
			code: `a {  color   : 0 ; }`,
			description: `a line under the limit, its spacing loose`,
		},
		{
			code: `a { color: 0;\n  top: 0; }`,
			description: `two lines, each under the limit`,
		},
		{
			code: `@media print {\n  a {\n    color: pink;\n }\n}`,
			description: `a media query written over five lines`,
		},
		{
			code: `a {\n background: url("${testUrl}");\n}`,
			description: `a long address inside a url call, which comes off the line`,
		},
		{
			code: `@import '${testUrl}';\na {\n background: url("${testUrl}");\n}`,
			description: `a long address in an import and another in a url call`,
		},
		{
			code: `a {\n background: uRl("${testUrl}");\n}`,
			description: `the same call written in mixed case`,
		},
		{
			code: `a {\n background: URL("${testUrl}");\n}`,
			description: `the same call written in upper case`,
		},
		{
			code: `a {\n  background: url(\n  "${testUrl}"\n  );\n}`,
			description: `a url call broken over three lines`,
		},
		{
			code: `a {\n  background: uRl(\n  "${testUrl}"\n  );\n}`,
			description: `the same call written in mixed case`,
		},
		{
			code: `a {\n  background: URL(\n  "${testUrl}"\n  );\n}`,
			description: `the same call written in upper case`,
		},
		{
			code: `a {\n  background: URL(\n  "${testUrl}"\n  );\nbackground: url(\n  "${testUrl}"\n);\n}`,
			description: `two url calls, each broken over three lines`,
		},
		{
			autoStripIndent: false,
			code: `a { margin: 0 2px; }\r\n`,
			description: `a line closed by a carriage-return line break`,
		},
		{
			autoStripIndent: false,
			code: `a { margin: 0 2px; }\r\na { margin: 4px 0; }\n`,
			description: `two lines, the first of them closed by a carriage-return line break`,
		},
		{
			code: `@import url("${testUrl}") print;`,
			description: `an import whose address comes off the line, with a media type behind it`,
		},
		{
			code: `@import '${testUrl}';`,
			description: `a single-quoted address in an import`,
		},
		{
			code: `@import "${testUrl}";`,
			description: `a double-quoted address in an import`,
		},
		{
			code: `@import url("${testUrl}");`,
			description: `the same address wrapped in a url call`,
		},
		{
			code: `@import 'svg-something<id="horse">' projection;`,
			description: `an import whose address carries quotes and angle brackets`,
		},
		{
			code: `a {\n background-image:\nurl(\n${twentyOneWhitespaces.slice(0, 20)}"${testUrl}"\n); }`,
			description: `exactly 20 whitespaces`,
		},
		{
			code: `a {\n background-image:\nurl(\n"${testUrl}"${twentyOneWhitespaces.slice(0, 20)}\n); }`,
			description: `exactly 20 whitespaces`,
		},
	],

	reject: [
		{
			code: `a {   color   : 0  ;}`,
			description: `a line over the limit by its spacing alone`,
			message: messages.expected(20),
			line: 1,
			column: 21,
		},
		{
			code: `a { color: 0; top: 0; }`,
			description: `two declarations on one line`,
			message: messages.expected(20),
			line: 1,
			column: 23,
		},
		{
			code: `a { color: 0;\n  top: 0; bottom: 0; right: 0; \n  left: 0; }`,
			description: `three declarations on the second line`,
			message: messages.expected(20),
			line: 2,
			column: 31,
		},
		{
			code: `a { color: 0;\n  top: 0;\n  left: 0; bottom: 0; right: 0; }`,
			description: `three declarations on the third line`,
			message: messages.expected(20),
			line: 3,
			column: 33,
		},
		{
			code: `a {\n  background: URL(\n  "${testUrl}"\n  );\n           background: url(\n  "${testUrl}"\n);\n}`,
			description: `indentation putting a url call over the limit`,
			message: messages.expected(20),
			line: 5,
			column: 27,
		},
		{
			code: `@media print {\n  a {\n    color: pink; background: orange;\n }\n}`,
			description: `two declarations on the third line of a media query`,
			message: messages.expected(20),
			line: 3,
			column: 36,
		},
		{
			code: `@media (min-width: 30px) and screen {}`,
			description: `a media query over the limit`,
			message: messages.expected(20),
			line: 1,
			column: 38,
		},
		{
			autoStripIndent: false,
			code: `a { margin: 0 2rem; }\r\n`,
			description: `a line over the limit, closed by a carriage-return line break`,
			message: messages.expected(20),
			line: 1,
			column: 21,
		},
		{
			code: `@import url("${testUrl}") projection, tv;`,
			description: `an import whose media types put it over the limit`,
			message: messages.expected(20),
			line: 1,
			column: 69,
		},
		{
			code: `@import '${testUrl}' projection, tv;`,
			description: `the same import with a single-quoted address`,
			message: messages.expected(20),
			line: 1,
			column: 64,
		},
		{
			code: `@import "${testUrl}" projection, tv;`,
			description: `the same import with a double-quoted address`,
			message: messages.expected(20),
			line: 1,
			column: 64,
		},
		{
			code: `@import 'svg-something<id="horse">' screens, tv;`,
			description: `an import whose address carries quotes and angle brackets, with media types behind it`,
			message: messages.expected(20),
			line: 1,
			column: 48,
		},
		{
			code: `a { background-image: url("${testUrl}"); }`,
			description: `a url call inside a declaration, whose address comes off the line`,
			message: messages.expected(20),
			line: 1,
			column: 70,
		},
		{
			code: `a {\n    /* Lorem ipsum dolor sit amet. The comment Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium officia fugiat unde deserunt sit, tenetur! Incidunt similique blanditiis placeat ad quia possimus libero, reiciendis excepturi non esse deserunt a odit. */\n}`,
			description: `a comment over the limit`,
			message: messages.expected(20),
			line: 2,
			column: 272,
		},
		{
			code: `a {
        background-image:
        url(
        ${twentyOneWhitespaces}"${testUrl}"
        );
      }`,
			description: `more than 20 whitespaces`,
			message: messages.expected(20),
			line: 4,
			column: 69,
		},
		{
			code: `a {
        background-image:
        url(
        "${testUrl}"${twentyOneWhitespaces}
        );
      }`,
			description: `more than 20 whitespaces`,
			message: messages.expected(20),
			line: 4,
			column: 69,
		},
		{
			code: `@import '${testUrl}';\na {\n background: url("${testUrl}"${twentyOneWhitespaces});\n}`,
			description: `whitespace behind a url address, which is measured where the address is not`,
			warnings: [
				{
					message: messages.expected(20),
					line: 3,
					column: 80,
				},
			],
		},
		{
			code: `@import url("${testUrl}"${twentyOneWhitespaces});`,
			description: `the same whitespace inside an import`,
			warnings: [
				{
					message: messages.expected(20),
					line: 1,
					column: 75,
				},
			],
		},
		{
			code: `@import '${testUrl}'${twentyOneWhitespaces};\na {\n background: url("${testUrl}"${twentyOneWhitespaces});\n}`,
			description: `whitespace behind the address of an import and behind that of a url call`,
			warnings: [
				{
					message: messages.expected(20),
					line: 1,
					column: 70,
				},
				{
					message: messages.expected(20),
					line: 3,
					column: 80,
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
			code: `<div>
<div>Very very very very very very very very very very very very very long line</div>
<style>
a {
  color: red;
}
</style>

</div>`,
			description: `a long line of the document, which holds no stylesheet`,
		},
	],

	reject: [
		{
			code: `<div>
<style>
a {
  color     :      red;
}
</style>

</div>`,
			description: `loose spacing inside an embedded stylesheet`,
			message: messages.expected(20),
			line: 4,
			column: 23,
		},
		{
			code: `<div>
<div>Very very very very very very very very very very very very very long line</div>
<div>Very very very very very very very very very very very very very long line</div>
<style>
a {
  color     :      red;
}
</style>

</div>`,
			description: `a long line of the document standing in front of an embedded stylesheet`,
			message: messages.expected(20),
			line: 6,
			column: 23,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [20],

	reject: [
		{
			code: `a {\n    // Lorem ipsum dolor sit amet. The comment Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium officia fugiat unde deserunt sit, tenetur! Incidunt similique blanditiis placeat ad quia possimus libero, reiciendis excepturi non esse deserunt a odit.\n}`,
			description: `an end-of-line comment over the limit`,
			message: messages.expected(20),
			line: 2,
			column: 269,
		},
	],
})

testRule({
	ruleName,
	config: [30],

	accept: [
		{
			code: `a { color: 0;\n  top: 0; left: 0; right: 0; \n  bottom: 0; }`,
			description: `three lines, each under a limit of thirty`,
		},
		{
			code: `@import url("somethingsomethingsomethingsomething.css") print;`,
			description: `an import with a long address and a media type`,
		},
		{
			code: `@import url("somethingsomethingsomethingsomething.css") projection, tv;`,
			description: `the same import with two media types`,
		},
		{
			code: `@import url("chrome://somethingsomethingsomethingsomething/");`,
			description: `an import whose address carries a scheme`,
		},
		{
			code: `@import "somethingsomethingsomethingsomething.css" screen, projection;`,
			description: `an import with a quoted address and two media types`,
		},
	],

	reject: [
		{
			code: `a { color: 0;\n  top: 0; left: 0; right: 0; background: pink; \n  bottom: 0; }`,
			description: `four declarations on the second line`,
			message: messages.expected(30),
			line: 2,
			column: 47,
		},
		{
			code: `@import url("somethingsomethingsomethingsomething.css") projection, screen;`,
			description: `an import whose two media types put it over the limit`,
			message: messages.expected(30),
			line: 1,
			column: 75,
		},
		{
			code: `@import "somethingsomethingsomethingsomething.css" screen, projection, tv;`,
			description: `the same import with three media types`,
			message: messages.expected(30),
			line: 1,
			column: 74,
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignore: `non-comments` }],

	accept: [
		{
			code: `a { color: 0; top: 0; bottom: 0; }`,
			description: `three declarations on one line, which this option does not measure`,
		},
		{
			code: `a { color: 0; top: 0; /* too long comment here */ bottom: 0; }`,
			description: `a comment standing among declarations, none of it measured`,
		},
		{
			code: `/* short nuff */`,
			description: `a comment under the limit`,
		},
		{
			code: `/* short\nnuff */`,
			description: `a comment broken over two lines`,
		},
		{
			code: `/**\n * each line\n * short nuff\n */`,
			description: `a comment whose every line is under the limit`,
		},
		{
			code: `a { color: 0; }\n/* short nuff */\nb {}`,
			description: `a comment standing between two rules`,
		},
		{
			code: `a {}\n/**\n * each line\n * short nuff\n */\nb {}`,
			description: `a comment of several lines standing between two rules`,
		},
		{
			code: `a { /* this comment is too long for the max length */ }`,
			description: `a comment over the limit sharing its line with a rule, which this option does not measure`,
		},
	],

	reject: [
		{
			code: `/* comment that is too long */`,
			description: `a comment over the limit`,
			message: messages.expected(20),
			line: 1,
			column: 30,
		},
		{
			code: `a {}\n  /* comment that is too long */\nb {}`,
			description: `the same comment indented between two rules`,
			message: messages.expected(20),
			line: 2,
			column: 32,
		},
		{
			code: `/* this comment is too long for the max length */`,
			description: `a longer comment over the limit`,
			message: messages.expected(20),
			line: 1,
			column: 49,
		},
		{
			code: `a {}\n/**\n * each line\n * short nuff\n * except this one which is too long\n */\nb {}`,
			description: `one line of a comment over the limit`,
			message: messages.expected(20),
			line: 5,
			column: 36,
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignore: `comments` }],

	accept: [
		{
			code: `/* comment that is too long */`,
			description: `a comment over the limit, which this option lets stand`,
		},
		{
			autoStripIndent: false,
			code: `       /* comment that is too long */`,
			description: `the same comment behind indentation`,
		},
		{
			code: `/* short */ a { color: 0; }`,
			description: `a comment in front of a rule, the line under the limit`,
		},
		{
			code: `a {}\n/* comment that is too long\n*/ a { color: 0; top: 0; }`,
			description: `a comment closed on the line a rule opens`,
		},
		{
			code: `/**\n comment that is too long #1\n comment that is too long #2 */`,
			description: `a comment whose every line is over the limit`,
		},
	],

	reject: [
		{
			code: `a { color: 0; } /* comment that is too long */`,
			description: `a comment behind a rule, on a line this option does measure`,
			message: messages.expected(20),
			line: 1,
			column: 46,
		},
		{
			code: `a { /* this comment is too long for the max length */ }`,
			description: `a comment inside a rule, on a line this option does measure`,
			message: messages.expected(20),
			line: 1,
			column: 55,
		},
	],
})

testRule({
	ruleName,
	config: [30, { ignorePattern: `/^my-/` }],

	accept: [
		{
			code: `my-property: has-a-really-long-declaration-value-for-some-reason`,
			description: `a declaration whose name the ignore pattern matches`,
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignorePattern: `/https?://[0-9,a-z]*.*/` }],

	accept: [
		{
			code: `/* ignore urls https://www.example.com */`,
			description: `a comment carrying an address the ignore pattern matches`,
		},
	],

	reject: [
		{
			code: `/* don't ignore lines without urls something something */`,
			description: `a comment carrying no address, which the pattern does not match`,
			message: messages.expected(20),
			line: 1,
			column: 57,
		},
	],
})

testRule({
	ruleName,
	config: [30, { ignorePattern: `/@import\\s+/` }],

	accept: [
		{
			code: `@import "../../../something/something/something/something.css" screen, projection, tv;`,
			description: `an import the ignore pattern matches`,
		},
	],

	reject: [
		{
			code: `a { color: 0;\n  top: 0; left: 0; right: 0; background: pink; \n  bottom: 0; }`,
			description: `a line of declarations the pattern does not match`,
			message: messages.expected(30),
			line: 2,
			column: 47,
		},
		{
			code: `@import "../../../something/something/something/something.css";\na { color: 0;\n  top: 0; left: 0; right: 0; background: pink; \n  bottom: 0; }`,
			description: `a line of declarations behind an import the pattern matches`,
			message: messages.expected(30),
			line: 3,
			column: 47,
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignorePattern: `/(Multiple:.+)|(Should:.+)/` }],

	accept: [
		{
			code: `/*\n Multiple: lines in multiline comments\n Should: be able to be ignored\n*/`,
			description: `a comment whose every long line the pattern matches`,
		},
	],

	reject: [
		{
			code: `/*\n multiple: lines in multiline comments\n Should: be able to be ignored\n*/`,
			description: `a comment line the pattern misses over one letter's case`,
			message: messages.expected(20),
			line: 2,
			column: 38,
		},
	],
})

testRule({
	ruleName,
	config: [30, { ignorePattern: /^my-/u }],

	accept: [
		{
			code: `my-property: has-a-really-long-declaration-value-for-some-reason`,
			description: `the same declaration, the pattern given as a regular expression rather than a string`,
		},
	],
})

testRule({
	ruleName,
	config: [20, { ignorePattern: /(Multiple:.+)|(Should:.+)/u }],

	accept: [
		{
			code: `/*\n Multiple: lines in multiline comments\n Should: be able to be ignored\n*/`,
			description: `the same comment, the pattern given as a regular expression rather than a string`,
		},
	],

	reject: [
		{
			code: `/*\n multiple: lines in multiline comments\n Should: be able to be ignored\n*/`,
			description: `the same missed line, the pattern given as a regular expression rather than a string`,
			message: messages.expected(20),
			line: 2,
			column: 38,
		},
	],
})

// A tab is measured up to the next tab stop, the way an editor with the same tab size shows it.
testRule({
	ruleName,
	config: [20, { tabSize: 4 }],

	accept: [
		{
			code: `a {\tcolor: pink; }`,
			description: `a tab reaches the next tab stop rather than adding a whole tab size: 3 + 1 + 14 = 18`,
		},
		{
			code: `
				a {
						color: pink;
				}
			`,
			description: `two leading tabs, exactly the limit: 8 + 12 = 20`,
		},
		{
			code: `a { cursor: url("${testUrl}"); }`,
			description: `the tab inside the url() argument is excluded at the width it takes there: 16 + 4 = 20`,
		},
		{
			code: `a { mask: url("x");\t}`,
			description: `a tab after the url() argument is measured where it stands, not where it would stand with the argument cut out: 14 + 2 + 1 + 1 = 18`,
		},
		{
			code: `a {\r\n\t\tcolor: pink;\r\n}`,
			description: `the carriage return is neither measured nor excluded: 8 + 12 = 20`,
		},
	],

	reject: [
		{
			code: `
				a {
						color: black;
				}
			`,
			description: `two leading tabs, over the limit by their widths alone: 8 + 13 = 21`,
			message: messages.expected(20),
			line: 2,
			column: 15,
		},
		{
			code: `a\t{\tcolor: pink }`,
			description: `the second tab stop is found after the first tab is expanded: 1 + 3 + 1 + 3 + 13 = 21`,
			message: messages.expected(20),
			line: 1,
			column: 17,
		},
		{
			code: `
				a {
					background: url("${testUrl}");
				}
			`,
			description: `the leading tab counts as four while the url() argument is still excluded: 4 + 16 + 2 = 22`,
			message: messages.expected(20),
			line: 2,
			column: 59,
		},
		{
			code: `a {\r\n\t\tcolor: black;\r\n}`,
			description: `two leading tabs in front of a carriage return: 8 + 13 = 21`,
			message: messages.expected(20),
			line: 2,
			column: 15,
		},
		{
			code: `
				a {
						/* a comment here */
				}
			`,
			description: `a comment is measured like any other line: 8 + 20 = 28`,
			message: messages.expected(20),
			line: 2,
			column: 22,
		},
	],
})

testRule({
	ruleName,
	config: [20, { tabSize: 4, ignore: `comments` }],

	accept: [
		{
			code: `
				a {
						/* a comment here */
				}
			`,
			description: `a comment is passed over before it is measured`,
		},
	],
})

testRule({
	ruleName,
	config: [20, { tabSize: 2 }],

	accept: [
		{
			code: `
				a {
							color: black;
				}
			`,
			description: `three leading tabs of two columns each: 6 + 13 = 19`,
		},
	],

	reject: [
		{
			code: `
				a {
								color: black;
				}
			`,
			description: `four leading tabs of two columns each: 8 + 13 = 21`,
			message: messages.expected(20),
			line: 2,
			column: 17,
		},
	],
})

// The example of issue #10: a line an editor with a tab size of 2 shows as 102 columns wide.
testRule({
	ruleName,
	config: [100, { tabSize: 2 }],

	reject: [
		{
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
			description: `a value put over the limit by four levels of nesting`,
			message: messages.expected(100),
			line: 5,
			column: 98,
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
			code: `@import "aaaaaaaaaaaaaaa";a{b:url(bbbbbbbbbbbbbbbb)}`,
			description: `both the import string and the url() argument come off the line: 52 - 17 - 16 = 19`,
		},
		{
			code: `@import "aaaaa" url("bb") screen, a;`,
			description: `the import string holding a url() argument comes off whole: 36 - 16 = 20`,
		},
	],

	reject: [
		{
			code: `
				@import "a.css" screen; a { background: url(bb) }
				a { color: pink; }
			`,
			description: `the url() argument is not taken off the line after the one it stands on`,
			warnings: [
				{
					message: messages.expected(20),
					line: 1,
					column: 49,
				},
			],
		},
		{
			code: `@import "aaaaa" url("bb") screen, ab;`,
			description: `the url() argument standing inside the import string is not taken off twice: 37 - 16 = 21`,
			message: messages.expected(20),
			line: 1,
			column: 37,
		},
	],
})
