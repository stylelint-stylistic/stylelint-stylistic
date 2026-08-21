import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a rule written on one line, with nothing to indent`,
		},
		{
			code: `a,\nb { color: pink; }`,
			description: `a selector list broken after the comma, both selectors at the root`,
		},
		{
			code: `
				a,
				b,
				c { color: pink; }
			`,
			description: `three selectors, each on a line of its own`,
		},
		{
			code: `
				@media print {
				  a,
				  b { color: pink;}
				}
			`,
			description: `a selector list indented inside a media query`,
		},
		{
			code: `
				a {
				  @nest b & ,
				  &.foo {
				    color: pink;
				  }
				}
			`,
			description: `a nested selector list opening with a nesting at-rule`,
		},
		{
			code: `
				a {
				  @at-root b & ,
				  &.foo {
				    color: pink;
				  }
				}
			`,
			description: `the same list opening with an at-root rule`,
		},
		{
			code: `a,\r\nb { color: pink; }`,
			description: `the same two selectors written with a carriage-return line break`,
		},
		{
			code: `a,\r\nb,\r\nc { color: pink; }`,
			description: `the same three selectors written with carriage-return line breaks`,
		},
		{
			code: `@media print {\r\n  a,\r\n  b { color: pink;}\r\n}`,
			description: `the same media query written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  @nest b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same nested list written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  @at-root b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same at-root list written with carriage-return line breaks`,
		},
	],

	reject: [
		{
			code: `a,\n  b { color: pink; }`,
			fixed: `a,\nb { color: pink; }`,
			description: `the second selector indented one level too deep`,

			message: messages.expected(`0 spaces`),
			line: 2,
			column: 3,
		},
		{
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
			description: `the third selector indented by a single space`,

			message: messages.expected(`0 spaces`),
			line: 3,
			column: 2,
		},
		{
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
			description: `the second selector of a list inside a media query, left at the root`,

			message: messages.expected(`2 spaces`),
			line: 3,
			column: 1,
		},
		{
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
			description: `the same selector indented one space too deep`,

			message: messages.expected(`2 spaces`),
			line: 3,
			column: 4,
		},
		{
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
			description: `the first selector of that list indented one space too deep`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 4,
		},
		{
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
			description: `a nested selector list whose nesting at-rule stands at the root`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
		{
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
			description: `the same list opening with an at-root rule`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
		{
			code: `a,\r\n  b { color: pink; }`,
			fixed: `a,\r\nb { color: pink; }`,
			description: `the same two selectors written with a carriage-return line break`,

			message: messages.expected(`0 spaces`),
			line: 2,
			column: 3,
		},
		{
			code: `a,\r\nb,\r\n c { color: pink; }`,
			fixed: `a,\r\nb,\r\nc { color: pink; }`,
			description: `the same three selectors written with carriage-return line breaks`,

			message: messages.expected(`0 spaces`),
			line: 3,
			column: 2,
		},
		{
			code: `@media print {\r\n  a,\r\nb { color: pink;}\r\n}`,
			fixed: `@media print {\r\n  a,\r\n  b { color: pink;}\r\n}`,
			description: `the same media query written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 3,
			column: 1,
		},
		{
			code: `@media print {\r\n  a,\r\n   b { color: pink;}\r\n}`,
			fixed: `@media print {\r\n  a,\r\n  b { color: pink;}\r\n}`,
			description: `the same query with the selector one space too deep`,

			message: messages.expected(`2 spaces`),
			line: 3,
			column: 4,
		},
		{
			code: `@media print {\r\n   a,\r\n  b { color: pink;}\r\n}`,
			fixed: `@media print {\r\n  a,\r\n  b { color: pink;}\r\n}`,
			description: `the same query with the first selector one space too deep`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 4,
		},
		{
			code: `a {\r\n@nest b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `a {\r\n  @nest b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same nested list written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
		{
			code: `a {\r\n@at-root b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `a {\r\n  @at-root b & ,\r\n  &.foo {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same at-root list written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
	],
})
