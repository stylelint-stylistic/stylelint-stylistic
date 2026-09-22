import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo,bar,baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0,0,0; }`,
		},
		{
			description: `spaces on both sides of the comma`,
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			description: `a space behind the comma`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a nested call, each comma with the space behind it`,
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
		},
		{
			description: `a data URI, whose commas belong to the data rather than to a call`,
			code: `a { background: url(data:image/svg+xml;charset=utf8,%3Csvg%20xmlns); }`,
		},
		{
			description: `a space behind the comma, a comment behind the space and an argument abutting the comment`,
			code: `a { transform: translate(1, /* comment */1); }`,
		},
		{
			// See #153
			description: `a bare address inside each argument, whose double slash opens no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x, url(//cdn/b.png) 2x); }`,
		},
		{
			// See #214
			description: `two comments, the first of which code follows straight away: the second is no continuation of it`,
			code: `a { b: translate(1px/*k*/, /*c*/ 2px); }`,
		},
		{
			// See #275
			description: `a comma inside the text of a comment the value parser closes early, which is no comma of the value`,
			code: `a { b: f(x/*/*q,w*/y); }`,
		},
		{
			// The run behind the comma is the one in front of the comment, not the break standing behind it
			description: `a single space behind the comma and a comment closing the line behind the space`,
			code: `a { b: f(1, /* c */\n2); }`,
		},
	],

	reject: [
		{
			// See #560
			description: `the comma behind a quoted address, which parts the arguments of a call as any comma does`,
			code: `a { b: url("x",f(1,2)); }`,
			fixed: `a { b: url("x", f(1, 2)); }`,
			warnings: [
				{
					line: 1,
					column: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 19,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// See #560
			description: `the same comma behind a comment standing behind the address`,
			code: `a { b: url("x" /* c */,f(1)); }`,
			fixed: `a { b: url("x" /* c */, f(1)); }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			// The space standing behind the comment is another run, so the comma carries none
			description: `a comment abutting the comma, with the space behind the comment`,
			code: `a { b: f(1,/* c */ 2); }`,
			fixed: `a { b: f(1, /* c */ 2); }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `arguments abutting the comma`,
			code: `a { transform: translate(1,1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the comma`,
			code: `a { transform: translate(1,  1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `a break behind the comma`,
			code: `a { transform: translate(1,\n1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1,\r\n1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the comma`,
			code: `a { transform: translate(1,\t1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `the last comma of a nested call abutting its argument`,
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			line: 1,
			column: 32,
			message: messages.expectedAfter(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: color(lightness(50%) rgb(0 , 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			line: 1,
			column: 47,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment abutting the comma`,
			code: `a { transform: translate(1,/* comment */1); }`,
			fixed: `a { transform: translate(1, /* comment */1); }`,
			message: messages.expectedAfter(),
		},
		{
			description: `a colour whose every comma abuts its argument`,
			code: `a { color: rgba(0,0,0,0); }`,
			fixed: `a { color: rgba(0, 0, 0, 0); }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 20,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 22,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a gradient whose every comma abuts its argument`,
			code: `a { background: linear-gradient(45deg,rgba(0,0,0,1),red); }`,
			fixed: `a { background: linear-gradient(45deg, rgba(0, 0, 0, 1), red); }`,
			warnings: [
				{
					line: 1,
					column: 38,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 52,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 45,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 47,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 49,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// See #153
			description: `a comma between two bare addresses, whose double slashes open no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x,url(//cdn/b.png) 2x); }`,
			fixed: `a { background: image-set(url(//cdn/a.png) 1x, url(//cdn/b.png) 2x); }`,
			line: 1,
			column: 46,
			message: messages.expectedAfter(),
		},
		{
			// See #214
			description: `a run inside a string that spells the delimiters of a comment lures the reading across no comma: the comma at 24 has its space and only the one at 33 has none`,
			code: `a { b: translate("a/*b", "c*/ d",1px); }`,
			fixed: `a { b: translate("a/*b", "c*/ d", 1px); }`,
			line: 1,
			column: 33,
			message: messages.expectedAfter(),
		},
		{
			// See #238
			description: `a call standing behind a comment the value parser does not give back as it read it`,
			code: `a { b: x/*/*a,b*/f(1,2)c; }`,
			fixed: `a { b: x/*/*a,b*/f(1, 2)c; }`,
			line: 1,
			column: 21,
			message: messages.expectedAfter(),
		},
		{
			// See #275
			description: `a comma of the value behind a comment the value parser closes early: the one inside the comment's text is passed over and this one is placed`,
			code: `a { b: f(x/*/*q,w*/y,2); }`,
			fixed: `a { b: f(x/*/*q,w*/y, 2); }`,
			line: 1,
			column: 21,
			message: messages.expectedAfter(),
		},
		{
			// See #508
			description: `a comma in front of a comment holding one quotation mark, and the same text inside a string behind that comment: the mark the comment holds opens no string, so the string the file spells is one, and the comma its text holds is no comma of the arguments`,
			code: `a { b: f(1,2) /*/ " */ "f(1,2)"; }`,
			fixed: `a { b: f(1, 2) /*/ " */ "f(1,2)"; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads its parentheses
			description: `a comma glued to the name of a bare address holding a string with a closing parenthesis, which a written run would make the tokenizer close inside the string`,
			code: `a { b: f(1,url(a ")" b)); }`,
			fixed: `a { b: f(1,url(a ")" b)); }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo, bar, baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo, bar, baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0, 0, 0; }`,
		},
		{
			description: `a space in front of the comma and none behind it`,
			code: `a { transform: translate(1 ,1); }`,
		},
		{
			description: `a comma abutting the arguments on both sides`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `a nested call whose commas abut their arguments`,
			code: `a { transform: color(rgb(0 ,0,0) lightness(50%)); }`,
		},
		{
			description: `a comment abutting the comma`,
			code: `a { transform: translate(1,/* comment */1); }`,
		},
		{
			// See #275
			description: `a space behind a comma inside the text of a comment the value parser closes early, neither of them the value's`,
			code: `a { b: f(x/*/*q, w*/y,2); }`,
		},
	],

	reject: [
		{
			// See #588
			description: `an address whose name a backslash and a break divide from what stands in front, standing beside a call`,
			code: `a { b: \\\nurl(c, d) f(1px, 2px); }`,
			fixed: `a { b: \\\nurl(c, d) f(1px,2px); }`,
			line: 2,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			// An address whose divider is glued to a number reads as a plain address
			description: `the same address with a number glued in front of the backslash, which the backslash ends`,
			code: `a { b: 1px\\\nurl(c, d) f(1px, 2px); }`,
			fixed: `a { b: 1px\\\nurl(c, d) f(1px,2px); }`,
			line: 2,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space behind the comma`,
			code: `a { transform: translate(1, 1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces behind the comma`,
			code: `a { transform: translate(1,  1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the comma`,
			code: `a { transform: translate(1,\n1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1,\r\n1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab behind the comma`,
			code: `a { transform: translate(1,\t1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `the last comma of a nested call with a space behind it`,
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			line: 1,
			column: 28,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: lightness(50%) color(rgb(0 , 0 ,0) ); }`,
			fixed: `a { transform: lightness(50%) color(rgb(0 ,0 ,0) ); }`,
			line: 1,
			column: 43,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comment behind a space, with the comma in front of the space`,
			code: `a { transform: translate(1, /* comment */1); }`,
			fixed: `a { transform: translate(1,/* comment */1); }`,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment with a space behind it too, which is a run of its own`,
			code: `a { transform: translate(1, /* comment */ 1); }`,
			fixed: `a { transform: translate(1,/* comment */ 1); }`,
			message: messages.rejectedAfter(),
		},
		{
			description: `three comments behind the comma, the first on a line of its own, whose runs are none of the comma's`,
			code: `a { transform: translate(1, /* 1 */\n/* 2 */ /* 3 */ 1); }`,
			fixed: `a { transform: translate(1,/* 1 */\n/* 2 */ /* 3 */ 1); }`,
			message: messages.rejectedAfter(),
		},
		{
			description: `a gradient whose every comma carries spaces`,
			code: `a { background: linear-gradient(45deg , rgba(0 , 0 , 0 , 1) , red); }`,
			fixed: `a { background: linear-gradient(45deg ,rgba(0 ,0 ,0 ,1) ,red); }`,
			warnings: [
				{
					line: 1,
					column: 39,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 61,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 48,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 52,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 56,
					message: messages.rejectedAfter(),
				},
			],
		},
		{
			// See #214
			description: `a run inside a string that spells the delimiters of a comment lures the reading across no comma`,
			code: `a { b: translate("a/*b", "c*/ d",1px); }`,
			fixed: `a { b: translate("a/*b","c*/ d",1px); }`,
			line: 1,
			column: 24,
			message: messages.rejectedAfter(),
		},
		{
			// See #275
			description: `a comma of the value carrying the whitespace this option takes away, behind a comment the value parser closes early whose text carries whitespace of its own: only the value's is taken`,
			code: `a { b: f(x/*/*q, w*/y, 2); }`,
			fixed: `a { b: f(x/*/*q, w*/y,2); }`,
			line: 1,
			column: 22,
			message: messages.rejectedAfter(),
		},
		{
			// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads its parentheses
			description: `a run between a comma and the name of a bare address holding a quotation mark nothing closes, which taking the run away would make the tokenizer read as a string`,
			code: `a { b: f(1, url(a"b)); }`,
			fixed: `a { b: f(1, url(a"b)); }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo,bar,baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0,0,0; }`,
		},
		{
			description: `spaces on both sides of the comma`,
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			description: `a space behind the comma`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a nested call, each comma with the space behind it`,
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
		},
		{
			description: `a break behind the comma, which makes the call multi-line`,
			code: `a { transform: translate(1,\n1); }`,
		},
		{
			description: `a break in front of the comma, which does the same`,
			code: `a { transform: translate(1\n,1); }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1,\r\n1); }`,
		},
		{
			description: `a colour broken in front of its last comma`,
			code: `a { color: rgba(0,0\n,0); }`,
		},
		{
			description: `the same colour broken in front of its first`,
			code: `a { color: rgba(0\n,0,0); }`,
		},
		{
			description: `a gradient broken in front of each of its outer commas`,
			code: `a { background: linear-gradient(45deg\n,rgba(0, 0, 0, 1)\n,red); }`,
		},
		{
			// See #275
			description: `a comma inside the text of a comment the value parser closes early, which is no comma of the value`,
			code: `a { b: f(x/*/*q,w*/y); }`,
		},
	],

	reject: [
		{
			description: `the last comma of a single-line nested call abutting its argument`,
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			line: 1,
			column: 32,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: color(lightness(50%) rgb(0 , 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			line: 1,
			column: 47,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a comma of a single-line call inside a value broken across lines`,
			code: `a { background: linear-gradient(45deg\n,rgba(0, 0,0, 1),red); }`,
			fixed: `a { background: linear-gradient(45deg\n,rgba(0, 0, 0, 1),red); }`,
			line: 2,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo, bar, baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo, bar, baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0, 0, 0; }`,
		},
		{
			description: `a space in front of the comma and none behind it`,
			code: `a { transform: translate(1 ,1); }`,
		},
		{
			description: `a comma abutting the arguments on both sides`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `a nested call whose commas abut their arguments`,
			code: `a { transform: color(rgb(0 ,0,0) lightness(50%)); }`,
		},
		{
			description: `a break behind the comma, which makes the call multi-line`,
			code: `a { transform: translate(1,\n1); }`,
		},
		{
			description: `a break in front of the comma, which does the same`,
			code: `a { transform: translate(1\n, 1); }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1\r\n, 1); }`,
		},
		{
			description: `a colour broken in front of its last comma`,
			code: `a { color: rgba(0, 0\n, 0); }`,
		},
		{
			description: `the same colour broken in front of its first`,
			code: `a { color: rgba(0\n, 0, 0); }`,
		},
		{
			// See #275
			description: `a space behind a comma inside the text of a comment the value parser closes early, neither of them the value's`,
			code: `a { b: f(x/*/*q, w*/y,2); }`,
		},
	],

	reject: [
		{
			description: `the last comma of a single-line nested call with a space behind it`,
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			line: 1,
			column: 28,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: lightness(50%) color(rgb(0 , 0 ,0) ); }`,
			fixed: `a { transform: lightness(50%) color(rgb(0 ,0 ,0) ); }`,
			line: 1,
			column: 43,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same pair with a break between the two calls`,
			code: `a { transform: lightness(50%)\ncolor(rgb(0 , 0 ,0) ); }`,
			fixed: `a { transform: lightness(50%)\ncolor(rgb(0 ,0 ,0) ); }`,
			line: 2,
			column: 13,
			message: messages.rejectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreFunctions: [`translate`, `/^rgba?$/`, /^hsl$/u] }],

	accept: [
		{
			description: `a call named in the option as a plain string`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `a call matched by the pattern given as a string`,
			code: `a { color: rgb(0,0,0); }`,
		},
		{
			description: `the same pattern matching another name`,
			code: `a { color: rgba(0,0,0,1); }`,
		},
		{
			description: `a call matched by the pattern given as a regular expression`,
			code: `a { color: hsl(0,0%,0%); }`,
		},
		{
			description: `a call nested inside an ignored one, which is passed over with it`,
			code: `a { transform: translate(min(1px,2px),1); }`,
		},
		{
			description: `a call the option does not name, with no comma in it to check`,
			code: `a { transform: scale(1, 1); }`,
		},
	],

	reject: [
		{
			description: `a call the option does not name`,
			code: `a { transform: scale(1,1); }`,
			fixed: `a { transform: scale(1, 1); }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `the same call carrying two commas`,
			code: `a { background: linear-gradient(45deg,red,blue); }`,
			fixed: `a { background: linear-gradient(45deg, red, blue); }`,
			warnings: [
				{
					line: 1,
					column: 38,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 42,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `an ignored call nested inside one the option does not name`,
			code: `a { background: linear-gradient(45deg,rgba(0,0,0,1)); }`,
			fixed: `a { background: linear-gradient(45deg, rgba(0,0,0,1)); }`,
			line: 1,
			column: 38,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { ignoreFunctions: [`translate`] }],

	accept: [
		{
			description: `an ignored call whose commas carry spaces`,
			code: `a { transform: translate(1, 1); }`,
		},
	],

	reject: [
		{
			description: `a call the option does not name, whose comma carries a space`,
			code: `a { transform: scale(1, 1); }`,
			fixed: `a { transform: scale(1,1); }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfter(),
		},
	],
})

// The run between a comma closing the arguments and the closing parenthesis is the parentheses rules' to judge and write, as the run in front of a closing brace is the brace rules' and not the semicolon rules'; a comma rule judging it beside a parentheses rule asking the opposite left a warning no `--fix` could take away (1790021150, undoing that part of #349)
testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a comma closing the arguments with nothing behind it, and one with a break behind it, whose run to the closing parenthesis is not this rule's`,
			code: `a { b: f(a,); c: f(a,\n); }`,
		},
		{
			description: `the same comma with two spaces behind it, and the empty fallback of a custom property`,
			code: `a { b: f(a,  ); c: var(--x,); }`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a comma closing the arguments with a space behind it, which the run to the closing parenthesis holds, and one with a break`,
			code: `a { b: f(a, ); c: f(a,\n); }`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a comma closing the arguments of a single-line call with a run of tabs behind it`,
			code: `a { b: f(a,\t\t); }`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a comma closing the arguments of a single-line call with a space behind it`,
			code: `a { b: f(a, ); }`,
		},
	],
})

// The pair that used to leave a warning standing whatever the order: the comma rule now leaves the run to the parentheses rule, which writes its space
testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/function-parentheses-space-inside": `always` },

	reject: [
		{
			description: `the empty fallback of a custom property with no whitespace inside the parentheses, which the parentheses rule spaces on both sides while this rule says nothing of the comma closing the arguments`,
			code: `a { b: var(--x,); }`,
			fixed: `a { b: var( --x, ); }`,
			warnings: [
				{
					line: 1,
					column: 12,
					message: `Expected single space after "(" (@stylistic/function-parentheses-space-inside)`,
				},
				{
					line: 1,
					column: 15,
					message: `Expected single space before ")" (@stylistic/function-parentheses-space-inside)`,
				},
			],
		},
	],
})
