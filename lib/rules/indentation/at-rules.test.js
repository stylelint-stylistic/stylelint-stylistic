import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			code: `
				@media print {
				  a {
				    color: pink;
				  }
				}
			`,
			description: `a media query whose rule and declaration each stand a level deeper`,
		},
		{
			code: `@media\n  print {\n  a {\n    color: pink;\n  }\n}`,
			description: `the same query with its parameters on the line below the name`,
		},
		{
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
			description: `two media queries, each indented throughout`,
		},
		{
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same query written with carriage-return line breaks`,
		},
		{
			code: `@media\r\n  print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same parameters on the next line, written with carriage-return line breaks`,
		},
		{
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}\r\n\r\n@media screen {\r\n  b { color: orange; }\r\n}`,
			description: `the same two queries written with carriage-return line breaks`,
		},
	],

	reject: [
		{
			code: `  @media print {\n  a {\n    color: pink;\n  }\n}`,
			fixed: `@media print {\n  a {\n    color: pink;\n  }\n}`,
			description: `a media query indented at the root`,

			message: messages.expected(`0 spaces`),
			line: 1,
			column: 3,
		},
		{
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
			description: `the rule inside the query left at the root`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
		{
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
			description: `the declaration left level with its rule`,

			message: messages.expected(`4 spaces`),
			line: 3,
			column: 3,
		},
		{
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
			description: `the closing brace of the rule left at the root`,

			message: messages.expected(`2 spaces`),
			line: 4,
			column: 1,
		},
		{
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
			description: `the closing brace of the query indented by a tab`,

			message: messages.expected(`0 spaces`),
			line: 5,
			column: 2,
		},
		{
			code: `  @media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same query indented at the root, written with carriage-return line breaks`,

			message: messages.expected(`0 spaces`),
			line: 1,
			column: 3,
		},
		{
			code: `@media print {\r\na {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same rule left at the root, written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
		{
			code: `@media print {\r\n  a {\r\n  color: pink;\r\n  }\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same declaration left level with its rule, written with carriage-return line breaks`,

			message: messages.expected(`4 spaces`),
			line: 3,
			column: 3,
		},
		{
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n}\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same closing brace left at the root, written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 4,
			column: 1,
		},
		{
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n\t}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same closing brace indented by a tab, written with carriage-return line breaks`,

			message: messages.expected(`0 spaces`),
			line: 5,
			column: 2,
		},
		{
			code: `@media\n print {\n  a {\n    color: pink;\n  }\n}`,
			fixed: `@media\n  print {\n  a {\n    color: pink;\n  }\n}`,
			description: `parameters on the next line, indented by a single space`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 2,
		},
		{
			code: `@media\r\n print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `@media\r\n  print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			description: `the same written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [`tab`, { except: [`block`] }],

	accept: [
		{
			code: `
				@media print {

				a {
					color: pink;
				}

				}
			`,
			description: `a query whose block is spaced out and whose contents stand at the root, as this option asks`,
		},
		{
			code: `
				@media print,
					(-webkit-min-device-pixel-ratio: 1.25),
					(min-resolution: 120dpi) {}
			`,
			description: `parameters broken over three lines, each indented one level deeper`,
		},
	],

	reject: [
		{
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
			description: `the rule inside such a block indented a level too deep`,

			message: messages.expected(`0 tabs`),
			line: 3,
			column: 2,
		},
		{
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
			description: `the declaration inside such a block left level with its rule`,

			message: messages.expected(`1 tab`),
			line: 4,
			column: 1,
		},
		{
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

			description: `parameters broken over three lines, indented by two spaces where a tab is asked for`,
			message: messages.expected(`1 tab`),
			line: 2,
			column: 3,
		},
		{
			code: `@media print,\r\n  (-webkit-min-device-pixel-ratio: 1.25),\r\n\t(min-resolution: 120dpi) {}`,
			fixed: `@media print,\r\n\t(-webkit-min-device-pixel-ratio: 1.25),\r\n\t(min-resolution: 120dpi) {}`,

			description: `the same written with carriage-return line breaks`,
			message: messages.expected(`1 tab`),
			line: 2,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [4, { except: [`param`] }],

	accept: [
		{
			code: `
				@media print,
				(-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
			description: `parameters broken over three lines, none of them indented, as this option asks`,
		},
	],

	reject: [
		{
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

			description: `the same parameters indented two spaces`,
			message: messages.expected(`0 spaces`),
			line: 2,
			column: 3,
		},
		{
			code: `@media print,\r\n  (-webkit-min-device-pixel-ratio: 1.25),\r\n(min-resolution: 120dpi) {}`,
			fixed: `@media print,\r\n(-webkit-min-device-pixel-ratio: 1.25),\r\n(min-resolution: 120dpi) {}`,

			description: `the same written with carriage-return line breaks`,
			message: messages.expected(`0 spaces`),
			line: 2,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: [`param`] }],

	accept: [
		{
			code: `
				@media print,
				(-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
			description: `parameters broken over three lines with no indentation, which this option does not measure`,
		},
		{
			code: `
				@media print,
				  (-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
			description: `the same parameters indented unevenly, still not measured`,
		},
	],

	reject: [
		{
			code: `  @media print {\n  a {\n    color: pink;\n  }\n}`,
			fixed: `@media print {\n  a {\n    color: pink;\n  }\n}`,
			description: `a media query indented at the root, whose parameters the option leaves alone`,

			message: messages.expected(`0 spaces`),
			line: 1,
			column: 3,
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
			code: `
				@media print {
				  a {
				    color: pink;
				    }
				  }
			`,
			description: `a query whose closing braces are indented with the blocks they close`,
		},
		{
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
			description: `two such queries, one behind the other`,
		},
	],

	reject: [
		{
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
			description: `the closing brace of the query indented by a single space`,

			message: messages.expected(`2 spaces`),
			line: 5,
			column: 2,
		},
		{
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
			description: `the closing brace of the rule indented by three spaces`,

			message: messages.expected(`4 spaces`),
			line: 4,
			column: 4,
		},
	],
})

testRule({
	ruleName,
	config: [1],

	reject: [
		{
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
			description: `every mis-indented line of the params, and not only one of them`,

			warnings: [
				{
					message: messages.expected(`1 space`),
					line: 2,
					column: 4,
				},
				{
					message: messages.expected(`1 space`),
					line: 3,
					column: 4,
				},
			],
		},
		{
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
			description: `every mis-indented line, whichever side of the params it falls on`,

			warnings: [
				{
					message: messages.expected(`1 space`),
					line: 2,
					column: 3,
				},
				{
					message: messages.expected(`1 space`),
					line: 3,
					column: 3,
				},
			],
		},
		{
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
			description: `every mis-indented line in front of the params as well`,

			warnings: [
				{
					message: messages.expected(`1 space`),
					line: 2,
					column: 3,
				},
				{
					message: messages.expected(`1 space`),
					line: 3,
					column: 3,
				},
				{
					message: messages.expected(`1 space`),
					line: 4,
					column: 3,
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
			description: `a Less at-variable keeps the fix written to its params`,

			message: messages.expected(`1 space`),
			line: 2,
			column: 3,
		},
		{
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
			description: `a Less at-variable keeps every fix written to its params`,

			warnings: [
				{
					message: messages.expected(`1 space`),
					line: 2,
					column: 4,
				},
				{
					message: messages.expected(`1 space`),
					line: 3,
					column: 4,
				},
			],
		},
	],
})
