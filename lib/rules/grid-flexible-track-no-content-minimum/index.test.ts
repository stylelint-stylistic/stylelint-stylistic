import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })
let testRuleConfigs = createTestRuleConfig({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			description: `a flexible track written with a minimum of zero`,
			code: `a { grid-template-columns: minmax(0, 1fr); }`,
		},
		{
			description: `a flexible track written with a length for its minimum`,
			code: `a { grid-template-columns: minmax(100px, 1fr); }`,
		},
		{
			description: `a flexible track written with a percentage for its minimum`,
			code: `a { grid-template-columns: minmax(10%, 1fr); }`,
		},
		{
			description: `a flexible track whose minimum is a call, which the rule cannot call content-sized`,
			code: `a { grid-template-columns: minmax(calc(100% / 3), 1fr); }`,
		},
		{
			description: `a flexible track whose minimum is a variable`,
			code: `a { grid-template-columns: minmax(var(--min), 1fr); }`,
		},
		{
			description: `a repeated flexible track written with a length for its minimum`,
			code: `a { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }`,
		},
		{
			description: `a track list holding no flexible track`,
			code: `a { grid-template-columns: 200px auto; }`,
		},
		{
			description: `a track list written in a variable`,
			code: `a { grid-template-columns: var(--columns); }`,
		},
		{
			description: `a flexible track standing in the fallback of a variable, which the rule does not read`,
			code: `a { grid-template-columns: var(--columns, 1fr); }`,
		},
		{
			description: `a track sized to its content by name, which is no flexible track`,
			code: `a { grid-template-columns: fit-content(200px); }`,
		},
		{
			description: `a subgrid`,
			code: `a { grid-template-columns: subgrid [a] [b]; }`,
		},
		{
			description: `the keyword spelling no track at all`,
			code: `a { grid-template-columns: none; }`,
		},
		{
			description: `a custom property, which is no property this rule reads`,
			code: `a { --columns: 1fr; }`,
		},
		{
			description: `a flexible length in a property spelling no track list`,
			code: `a { flex: 1fr; }`,
		},
		{
			description: `a grid line spelled with a flexible length, which is no track either`,
			code: `a { grid-area: 1 / 1fr; }`,
		},
		{
			description: `the named areas of a grid`,
			code: `a { grid-template-areas: "a a"; }`,
		},
		{
			description: `a flexible track written in the text of a comment`,
			code: `a { grid-template-columns: minmax(0, 1fr) /* 1fr */; }`,
		},
		{
			description: `a flexible length written as a minimum, which spells no track the rule reads`,
			code: `a { grid-template-columns: minmax(1fr, 1fr); }`,
		},
		{
			description: `a flexible track between named lines`,
			code: `a { grid-template-columns: [a] minmax(0, 1fr) [b]; }`,
		},
	],

	reject: [
		{
			description: `a bare flexible track`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `a { grid-template-columns: minmax(0, 1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `a bare flexible track whose unit is written in upper case, which is written back as it stands`,
			code: `a { grid-template-columns: 2FR; }`,
			fixed: `a { grid-template-columns: minmax(0, 2FR); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`2FR`, `minmax(0, 2FR)`),
		},
		{
			description: `a bare flexible track written as a fraction`,
			code: `a { grid-template-columns: .5fr; }`,
			fixed: `a { grid-template-columns: minmax(0, .5fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(`.5fr`, `minmax(0, .5fr)`),
		},
		{
			description: `a repeated bare flexible track`,
			code: `a { grid-template-columns: repeat(12, 1fr); }`,
			fixed: `a { grid-template-columns: repeat(12, minmax(0, 1fr)); }`,
			line: 1,
			column: 39,
			endLine: 1,
			endColumn: 42,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `a flexible track whose minimum is written out as the one a bare track has`,
			code: `a { grid-template-columns: minmax(auto, 1fr); }`,
			fixed: `a { grid-template-columns: minmax(0, 1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 45,
			message: messages.expected(`minmax(auto, 1fr)`, `minmax(0, 1fr)`),
		},
		{
			description: `a flexible track whose minimum is the smallest its content allows`,
			code: `a { grid-template-columns: minmax(min-content, 1fr); }`,
			fixed: `a { grid-template-columns: minmax(0, 1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 52,
			message: messages.expected(`minmax(min-content, 1fr)`, `minmax(0, 1fr)`),
		},
		{
			description: `a flexible track whose minimum is the largest its content asks for, both written in upper case`,
			code: `a { grid-template-columns: minmax(MAX-CONTENT, 1FR); }`,
			fixed: `a { grid-template-columns: minmax(0, 1FR); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 52,
			message: messages.expected(`minmax(MAX-CONTENT, 1FR)`, `minmax(0, 1FR)`),
		},
		{
			description: `a content-sized minimum spaced by its author, whose spacing the fix keeps`,
			code: `a { grid-template-columns: minmax( auto , 1fr ); }`,
			fixed: `a { grid-template-columns: minmax( 0 , 1fr ); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 48,
			message: messages.expected(`minmax( auto , 1fr )`, `minmax( 0 , 1fr )`),
		},
		{
			description: `two bare flexible tracks among fixed ones, both written in one run`,
			code: `a { grid-template-columns: 300px 1fr 2fr 400px; }`,
			fixed: `a { grid-template-columns: 300px minmax(0, 1fr) minmax(0, 2fr) 400px; }`,
			warnings: [
				{
					line: 1,
					column: 34,
					endLine: 1,
					endColumn: 37,
					message: messages.expected(`1fr`, `minmax(0, 1fr)`),
				},
				{
					line: 1,
					column: 38,
					endLine: 1,
					endColumn: 41,
					message: messages.expected(`2fr`, `minmax(0, 2fr)`),
				},
			],
		},
		{
			description: `a bare flexible track between named lines`,
			code: `a { grid-template-columns: [a] 1fr [b]; }`,
			fixed: `a { grid-template-columns: [a] minmax(0, 1fr) [b]; }`,
			line: 1,
			column: 32,
			endLine: 1,
			endColumn: 35,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `a bare flexible track sizing a row`,
			code: `a { grid-template-rows: 1fr; }`,
			fixed: `a { grid-template-rows: minmax(0, 1fr); }`,
			line: 1,
			column: 25,
			endLine: 1,
			endColumn: 28,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `a bare flexible track sizing the implicit columns`,
			code: `a { grid-auto-columns: 1fr; }`,
			fixed: `a { grid-auto-columns: minmax(0, 1fr); }`,
			line: 1,
			column: 24,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `a bare flexible track sizing the implicit rows`,
			code: `a { grid-auto-rows: 1fr; }`,
			fixed: `a { grid-auto-rows: minmax(0, 1fr); }`,
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `the property written in upper case, which names the same property`,
			code: `a { GRID-TEMPLATE-COLUMNS: 1fr; }`,
			fixed: `a { GRID-TEMPLATE-COLUMNS: minmax(0, 1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `the shorthand of the template, sizing a row in front of its solidus and two columns behind it`,
			code: `a { grid-template: "a a" 1fr / 1fr 2fr; }`,
			fixed: `a { grid-template: "a a" minmax(0, 1fr) / minmax(0, 1fr) minmax(0, 2fr); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					endLine: 1,
					endColumn: 29,
					message: messages.expected(`1fr`, `minmax(0, 1fr)`),
				},
				{
					line: 1,
					column: 32,
					endLine: 1,
					endColumn: 35,
					message: messages.expected(`1fr`, `minmax(0, 1fr)`),
				},
				{
					line: 1,
					column: 36,
					endLine: 1,
					endColumn: 39,
					message: messages.expected(`2fr`, `minmax(0, 2fr)`),
				},
			],
		},
		{
			description: `the shorthand of the whole grid, sizing the implicit rows in front of its solidus and a column behind it`,
			code: `a { grid: auto-flow 1fr / minmax(auto, 1fr); }`,
			fixed: `a { grid: auto-flow minmax(0, 1fr) / minmax(0, 1fr); }`,
			warnings: [
				{
					line: 1,
					column: 21,
					endLine: 1,
					endColumn: 24,
					message: messages.expected(`1fr`, `minmax(0, 1fr)`),
				},
				{
					line: 1,
					column: 27,
					endLine: 1,
					endColumn: 44,
					message: messages.expected(`minmax(auto, 1fr)`, `minmax(0, 1fr)`),
				},
			],
		},
		{
			description: `the shorthand of the template spelling no solidus, whose tracks all size rows`,
			code: `a { grid-template: "a" 1fr "b" 2fr; }`,
			fixed: `a { grid-template: "a" minmax(0, 1fr) "b" minmax(0, 2fr); }`,
			warnings: [
				{
					line: 1,
					column: 24,
					endLine: 1,
					endColumn: 27,
					message: messages.expected(`1fr`, `minmax(0, 1fr)`),
				},
				{
					line: 1,
					column: 32,
					endLine: 1,
					endColumn: 35,
					message: messages.expected(`2fr`, `minmax(0, 2fr)`),
				},
			],
		},
		{
			description: `two bare flexible tracks on lines of their own with a comment between them, which the fix leaves where it stands`,
			code: `
				a {
					grid-template-columns:
						1fr /* c */
						2fr;
				}
			`,
			fixed: `
				a {
					grid-template-columns:
						minmax(0, 1fr) /* c */
						minmax(0, 2fr);
				}
			`,
			warnings: [
				{
					line: 3,
					column: 3,
					endLine: 3,
					endColumn: 6,
					message: messages.expected(`1fr`, `minmax(0, 1fr)`),
				},
				{
					line: 4,
					column: 3,
					endLine: 4,
					endColumn: 6,
					message: messages.expected(`2fr`, `minmax(0, 2fr)`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [true, { ignore: [`rows`] }],

	accept: [
		{
			description: `a bare flexible track sizing a row`,
			code: `a { grid-template-rows: 1fr; }`,
		},
		{
			description: `a bare flexible track sizing the implicit rows`,
			code: `a { grid-auto-rows: 1fr; }`,
		},
		{
			description: `the shorthand of the template, whose bare track stands in front of the solidus`,
			code: `a { grid-template: 1fr / minmax(0, 1fr); }`,
		},
		{
			description: `the shorthand of the whole grid, whose bare track sizes the implicit rows`,
			code: `a { grid: auto-flow 1fr / 200px; }`,
		},
		{
			description: `the shorthand of the template spelling no solidus, whose tracks all size rows`,
			code: `a { grid-template: "a" 1fr "b" 2fr; }`,
		},
	],

	reject: [
		{
			description: `a bare flexible track sizing a column`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `a { grid-template-columns: minmax(0, 1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `the shorthand of the template, of which the track behind the solidus alone is read`,
			code: `a { grid-template: 1fr / 1fr; }`,
			fixed: `a { grid-template: 1fr / minmax(0, 1fr); }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
		{
			description: `the shorthand of the whole grid, of which the column alone is read`,
			code: `a { grid: auto-flow 1fr / 1fr; }`,
			fixed: `a { grid: auto-flow 1fr / minmax(0, 1fr); }`,
			line: 1,
			column: 27,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
	],
})

testRuleConfigs({
	ruleName,

	accept: [
		{
			config: [true],
		},
		{
			config: [true, { ignore: [`rows`] }],
		},
	],

	reject: [
		{
			config: [false],
		},
		{
			config: [`always`],
		},
		{
			config: [true, { ignore: [`columns`] }],
		},
		{
			config: [true, { rows: true }],
		},
	],
})
