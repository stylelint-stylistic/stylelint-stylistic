import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `a rule written on one line, with nothing to indent`,
			code: `a { color: pink; }`,
		},
		{
			description: `a selector list broken after the comma, both selectors at the root`,
			code: `a,\nb { color: pink; }`,
		},
		{
			description: `three selectors, each on a line of its own`,
			code: `
				a,
				b,
				c { color: pink; }
			`,
		},
		{
			description: `a selector list indented inside a media query`,
			code: `
				@media print {
				  a,
				  b { color: pink;}
				}
			`,
		},
		{
			description: `a nested selector list opening with a nesting at-rule`,
			code: `
				a {
				  @nest b & ,
				  &.foo {
				    color: pink;
				  }
				}
			`,
		},
		{
			description: `the same list opening with an at-root rule`,
			code: `
				a {
				  @at-root b & ,
				  &.foo {
				    color: pink;
				  }
				}
			`,
		},
		{
			description: `the same two selectors written with a carriage-return line break`,
			code: `a,\r\nb { color: pink; }`,
		},
		{
			description: `the same three selectors written with carriage-return line breaks`,
			code: `a,\r\nb,\r\nc { color: pink; }`,
		},
		{
			description: `the same media query written with carriage-return line breaks`,
			code: `@media print {\r\n  a,\r\n  b { color: pink;}\r\n}`,
		},
		{
			description: `the same nested list written with carriage-return line breaks`,
			code: `a {\r\n  @nest b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
		},
		{
			description: `the same at-root list written with carriage-return line breaks`,
			code: `a {\r\n  @at-root b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
		},
	],

	reject: [
		{
			description: `the second selector indented one level too deep`,
			code: `a,\n  b { color: pink; }`,
			fixed: `a,\nb { color: pink; }`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the third selector indented by a single space`,
			code: `
				a,
				b,
				 c { color: pink; }
			`,
			fixed: `
				a,
				b,
				c { color: pink; }
			`,
			line: 3,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the second selector of a list inside a media query, left at the root`,
			code: `
				@media print {
				  a,
				b { color: pink;}
				}
			`,
			fixed: `
				@media print {
				  a,
				  b { color: pink;}
				}
			`,
			line: 3,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same selector indented one space too deep`,
			code: `
				@media print {
				  a,
				   b { color: pink;}
				}
			`,
			fixed: `
				@media print {
				  a,
				  b { color: pink;}
				}
			`,
			line: 3,
			column: 4,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the first selector of that list indented one space too deep`,
			code: `
				@media print {
				   a,
				  b { color: pink;}
				}
			`,
			fixed: `
				@media print {
				  a,
				  b { color: pink;}
				}
			`,
			line: 2,
			column: 4,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `a nested selector list whose nesting at-rule stands at the root`,
			code: `
				a {
				@nest b & ,
				  &.foo {
				    color: pink;
				  }
				}
			`,
			fixed: `
				a {
				  @nest b & ,
				  &.foo {
				    color: pink;
				  }
				}
			`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same list opening with an at-root rule`,
			code: `
				a {
				@at-root b & ,
				  &.foo {
				    color: pink;
				  }
				}
			`,
			fixed: `
				a {
				  @at-root b & ,
				  &.foo {
				    color: pink;
				  }
				}
			`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same two selectors written with a carriage-return line break`,
			code: `a,\r\n  b { color: pink; }`,
			fixed: `a,\r\nb { color: pink; }`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same three selectors written with carriage-return line breaks`,
			code: `a,\r\nb,\r\n c { color: pink; }`,
			fixed: `a,\r\nb,\r\nc { color: pink; }`,
			line: 3,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same media query written with carriage-return line breaks`,
			code: `@media print {\r\n  a,\r\nb { color: pink;}\r\n}`,
			fixed: `@media print {\r\n  a,\r\n  b { color: pink;}\r\n}`,
			line: 3,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same query with the selector one space too deep`,
			code: `@media print {\r\n  a,\r\n   b { color: pink;}\r\n}`,
			fixed: `@media print {\r\n  a,\r\n  b { color: pink;}\r\n}`,
			line: 3,
			column: 4,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same query with the first selector one space too deep`,
			code: `@media print {\r\n   a,\r\n  b { color: pink;}\r\n}`,
			fixed: `@media print {\r\n  a,\r\n  b { color: pink;}\r\n}`,
			line: 2,
			column: 4,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same nested list written with carriage-return line breaks`,
			code: `a {\r\n@nest b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `a {\r\n  @nest b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same at-root list written with carriage-return line breaks`,
			code: `a {\r\n@at-root b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `a {\r\n  @at-root b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
	],
})
