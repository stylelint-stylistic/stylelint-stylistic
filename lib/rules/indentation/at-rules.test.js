import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `a media query whose rule and declaration each stand a level deeper`,
			code: `
				@media print {
				  a {
				    color: pink;
				  }
				}
			`,
		},
		{
			description: `the same query with its parameters on the line below the name`,
			code: `@media\n  print {\n  a {\n    color: pink;\n  }\n}`,
		},
		{
			description: `two media queries, each indented throughout`,
			code: `
				@media print {
				  a {
				    color: pink;
				  }
				}

				@media screen {
				  b { color: orange; }
				}
			`,
		},
		{
			description: `the same query written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
		},
		{
			description: `the same parameters on the next line, written with carriage-return line breaks`,
			code: `@media\r\n  print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
		},
		{
			description: `the same two queries written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}\r\n\r\n@media screen {\r\n  b { color: orange; }\r\n}`,
		},
	],

	reject: [
		{
			description: `a media query indented at the root`,
			code: `  @media print {\n  a {\n    color: pink;\n  }\n}`,
			fixed: `@media print {\n  a {\n    color: pink;\n  }\n}`,
			line: 1,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the rule inside the query left at the root`,
			code: `
				@media print {
				a {
				    color: pink;
				  }
				}
			`,
			fixed: `
				@media print {
				  a {
				    color: pink;
				  }
				}
			`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the declaration left level with its rule`,
			code: `
				@media print {
				  a {
				  color: pink;
				  }
				}
			`,
			fixed: `
				@media print {
				  a {
				    color: pink;
				  }
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the closing brace of the rule left at the root`,
			code: `
				@media print {
				  a {
				    color: pink;
				}
				}
			`,
			fixed: `
				@media print {
				  a {
				    color: pink;
				  }
				}
			`,
			line: 4,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the closing brace of the query indented by a tab`,
			code: `
				@media print {
				  a {
				    color: pink;
				  }
					}
			`,
			fixed: `
				@media print {
				  a {
				    color: pink;
				  }
				}
			`,
			line: 5,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same query indented at the root, written with carriage-return line breaks`,
			code: `  @media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 1,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same rule left at the root, written with carriage-return line breaks`,
			code: `@media print {\r\na {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same declaration left level with its rule, written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n  color: pink;\r\n  }\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the same closing brace left at the root, written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n}\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 4,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same closing brace indented by a tab, written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n\t}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 5,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `parameters on the next line, indented by a single space`,
			code: `@media\n print {\n  a {\n    color: pink;\n  }\n}`,
			fixed: `@media\n  print {\n  a {\n    color: pink;\n  }\n}`,
			line: 2,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `@media\r\n print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `@media\r\n  print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 2,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`, { except: [`block`] }],

	accept: [
		{
			description: `a query whose block is spaced out and whose contents stand at the root, as this option asks`,
			code: `
				@media print {

				a {
					color: pink;
				}

				}
			`,
		},
		{
			description: `parameters broken over three lines, each indented one level deeper`,
			code: `
				@media print,
					(-webkit-min-device-pixel-ratio: 1.25),
					(min-resolution: 120dpi) {}
			`,
		},
	],

	reject: [
		{
			description: `the rule inside such a block indented a level too deep`,
			code: `
				@media print {

					a {
					color: pink;
				}

				}
			`,
			fixed: `
				@media print {

				a {
					color: pink;
				}

				}
			`,
			line: 3,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the declaration inside such a block left level with its rule`,
			code: `
				@media print {

				a {
				color: pink;
				}

				}
			`,
			fixed: `
				@media print {

				a {
					color: pink;
				}

				}
			`,
			line: 4,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `parameters broken over three lines, indented by two spaces where a tab is asked for`,
			code: `
				@media print,
				  (-webkit-min-device-pixel-ratio: 1.25),
					(min-resolution: 120dpi) {}
			`,
			fixed: `
				@media print,
					(-webkit-min-device-pixel-ratio: 1.25),
					(min-resolution: 120dpi) {}
			`,
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `@media print,\r\n  (-webkit-min-device-pixel-ratio: 1.25),\r\n\t(min-resolution: 120dpi) {}`,
			fixed: `@media print,\r\n\t(-webkit-min-device-pixel-ratio: 1.25),\r\n\t(min-resolution: 120dpi) {}`,
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: [4, { except: [`param`] }],

	accept: [
		{
			description: `parameters broken over three lines, none of them indented, as this option asks`,
			code: `
				@media print,
				(-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
		},
	],

	reject: [
		{
			description: `the same parameters indented two spaces`,
			code: `
				@media print,
				  (-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
			fixed: `
				@media print,
				(-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `@media print,\r\n  (-webkit-min-device-pixel-ratio: 1.25),\r\n(min-resolution: 120dpi) {}`,
			fixed: `@media print,\r\n(-webkit-min-device-pixel-ratio: 1.25),\r\n(min-resolution: 120dpi) {}`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: [`param`] }],

	accept: [
		{
			description: `parameters broken over three lines with no indentation, which this option does not measure`,
			code: `
				@media print,
				(-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
		},
		{
			description: `the same parameters indented unevenly, still not measured`,
			code: `
				@media print,
				  (-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
		},
	],

	reject: [
		{
			description: `a media query indented at the root, whose parameters the option leaves alone`,
			code: `  @media print {\n  a {\n    color: pink;\n  }\n}`,
			fixed: `@media print {\n  a {\n    color: pink;\n  }\n}`,
			line: 1,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [
		2,
		{
			indentClosingBrace: true,
		},
	],

	accept: [
		{
			description: `a query whose closing braces are indented with the blocks they close`,
			code: `
				@media print {
				  a {
				    color: pink;
				    }
				  }
			`,
		},
		{
			description: `two such queries, one behind the other`,
			code: `
				@media print {
				  a {
				    color: pink;
				    }
				  }

				@media screen {
				  b { color: orange; }
				  }
			`,
		},
	],

	reject: [
		{
			description: `the closing brace of the query indented by a single space`,
			code: `
				@media print {
				  a {
				    color: pink;
				    }
				 }
			`,
			fixed: `
				@media print {
				  a {
				    color: pink;
				    }
				  }
			`,
			line: 5,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the closing brace of the rule indented by three spaces`,
			code: `
				@media print {
				  a {
				    color: pink;
				   }
				  }
			`,
			fixed: `
				@media print {
				  a {
				    color: pink;
				    }
				  }
			`,
			line: 4,
			column: 4,
			message: messages.expected(`4 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [1],

	reject: [
		{
			description: `every mis-indented line of the params, and not only one of them`,
			code: `
				@media (min-width: 1px),
							(max-width: 2px),
							(min-height: 3px) {}
			`,
			fixed: `
				@media (min-width: 1px),
				 (max-width: 2px),
				 (min-height: 3px) {}
			`,
			warnings: [
				{
					line: 2,
					column: 4,
					message: messages.expected(`1 space`),
				},
				{
					line: 3,
					column: 4,
					message: messages.expected(`1 space`),
				},
			],
		},
		{
			description: `every mis-indented line, whichever side of the params it falls on`,
			code: `
				@media
						print,
						screen {}
			`,
			fixed: `
				@media
				 print,
				 screen {}
			`,
			warnings: [
				{
					line: 2,
					column: 3,
					message: messages.expected(`1 space`),
				},
				{
					line: 3,
					column: 3,
					message: messages.expected(`1 space`),
				},
			],
		},
		{
			description: `every mis-indented line in front of the params as well`,
			code: `
				@media
						/* a */
						/* b */
						print {}
			`,
			fixed: `
				@media
				 /* a */
				 /* b */
				 print {}
			`,
			warnings: [
				{
					line: 2,
					column: 3,
					message: messages.expected(`1 space`),
				},
				{
					line: 3,
					column: 3,
					message: messages.expected(`1 space`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`1 space`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a Less at-variable keeps the fix written to its params`,
			code: `
				@foo: (
						'a'
				);
			`,
			fixed: `
				@foo: (
				 'a'
				);
			`,
			line: 2,
			column: 3,
			message: messages.expected(`1 space`),
		},
		{
			description: `a Less at-variable keeps every fix written to its params`,
			code: `
				@foo: (
							'a',
							'b'
				);
			`,
			fixed: `
				@foo: (
				 'a',
				 'b'
				);
			`,
			warnings: [
				{
					line: 2,
					column: 4,
					message: messages.expected(`1 space`),
				},
				{
					line: 3,
					column: 4,
					message: messages.expected(`1 space`),
				},
			],
		},
	],
})
