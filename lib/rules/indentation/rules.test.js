import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			code: `/* anything\n    goes\n\t\t\twithin a comment */\n`,
			description: `a comment whose own lines the rule does not measure`,
		},
		{
			code: `a { top: 0; } b { top: 1px; }`,
			description: `two rules on one line`,
		},
		{
			code: `
				a {
				  top: 0;
				}
				b { top: 1px; bottom: 4px; }
			`,
			description: `a rule broken over lines and another written on one`,
		},
		{
			code: `
				a {
				  top: 0;
				} b { top: 1px; }
			`,
			description: `a single-line rule opening on the line the one before it closes`,
		},
		{
			code: `
				a {
				  color: pink;
				}
			`,
			description: `a declaration indented one level`,
		},
		{
			code: `a { color: pink;\n}`,
			description: `a declaration standing on the line the rule opens`,
		},
		{
			code: `
				a {
				  color: pink;
				} b { top: 0; }
			`,
			description: `a rule broken over lines and a single-line one behind it`,
		},
		{
			code: `
				a { color: pink;
				  top: 0; background: orange;
				}
			`,
			description: `two declarations on the line below the one the rule opens`,
		},
		{
			code: `
				a {
				  color: pink;
				}


				b {
				  color: orange
				}
			`,
			description: `two rules separated by blank lines`,
		},
		{
			code: `a {\n  color: pink;}`,
			description: `a closing brace standing behind the declaration`,
		},
		{
			code: `
				a {
				  background-position: top left,
				    top right,
				    bottom left;
				  color: pink;
				}
			`,
			description: `a value broken over three lines, each of its parts a level deeper`,
		},
		{
			code: `a {\n  background-position: top left,\n    top right,\n    bottom left\n  ;\n}`,
			description: `the same value with its semicolon on a line of its own`,
		},
		{
			code: `a {\n  background-position: top left,\n    top right,\n\n    bottom left\n  ;\n}`,

			description: `a blank line standing inside a value broken over lines`,
		},
		{
			code: `
				a {
				  *top: 1px;
				}
			`,
			description: `a declaration whose property carries a star hack`,
		},
		{
			code: `
				a {
				  _top: 1px;
				}
			`,
			description: `a declaration whose property carries an underscore hack`,
		},
		{
			code: `* { top: 0; }`,
			description: `a universal selector on one line`,
		},
		{
			code: `
				@media print {
				  * { color: pink; }
				}
			`,
			description: `a universal selector indented inside a media query`,
		},
		{
			code: `
				a {
				  @media print { color: pink; }
				}
			`,
			description: `a media query nested inside a rule`,
		},
		{
			code: `/* anything\r\n    goes\r\n\t\t\twithin a comment */\r\n`,
			description: `the same comment written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  top: 0;\r\n}\r\nb { top: 1px; bottom: 4px; }`,
			description: `the same two rules written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  top: 0;\r\n} b { top: 1px; }`,
			description: `the same pair of rules written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  color: pink;\r\n}`,
			description: `the same declaration written with carriage-return line breaks`,
		},
		{
			code: `a { color: pink;\r\n}`,
			description: `the same rule opening with its declaration, written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  color: pink;\r\n} b { top: 0; }`,
			description: `the same pair written with carriage-return line breaks`,
		},
		{
			code: `a { color: pink;\r\n  top: 0; background: orange;\r\n}`,
			description: `the same two declarations written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  color: pink;\r\n}\r\n\r\n\r\nb {\r\n  color: orange\r\n}`,
			description: `the same rules separated by blank lines, written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  color: pink;}`,
			description: `the same closing brace written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  background-position: top left,\r\n    top right,\r\n    bottom left;\r\n  color: pink;\r\n}`,
			description: `the same broken value written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  background-position: top left,\r\n    top right,\r\n    bottom left\r\n  ;\r\n}`,
			description: `the same value with its own semicolon line, written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  background-position: top left,\r\n    top right,\r\n\r\n    bottom left\r\n  ;\r\n}`,

			description: `the same blank line inside a value, written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  *top: 1px;\r\n}`,
			description: `the same star hack written with carriage-return line breaks`,
		},
		{
			code: `a {\r\n  _top: 1px;\r\n}`,
			description: `the same underscore hack written with carriage-return line breaks`,
		},
		{
			code: `@media print {\r\n  * { color: pink; }\r\n}`,
			description: `the same universal selector in a media query, written with carriage-return line breaks`,
		},
		{
			code: `
				.a[disabled],
				.b {
				  color: pink;
				}
			`,
			description: `a selector list whose second selector opens the line`,
		},
		{
			code: `
				:not(.enabled
				) {
				  color: pink;
				}
			`,
			description: `a selector broken inside the parentheses of a pseudo-class`,
		},
	],

	reject: [
		{
			code: `\ta {\n  color: pink;\n}`,
			fixed: `a {\n  color: pink;\n}`,
			description: `a rule indented by a tab at the root`,

			message: messages.expected(`0 spaces`),
			line: 1,
			column: 2,
		},
		{
			code: `
				a {
				  color: pink;
				  }
			`,
			fixed: `
				a {
				  color: pink;
				}
			`,
			description: `a closing brace indented one level`,

			message: messages.expected(`0 spaces`),
			line: 3,
			column: 3,
		},
		{
			code: `
				a,
				b {
				  color: pink;
				  }
			`,
			fixed: `
				a,
				b {
				  color: pink;
				}
			`,
			description: `the same closing brace under a selector list`,

			message: messages.expected(`0 spaces`),
			line: 4,
			column: 3,
		},
		{
			code: `a { color: pink;\n  }`,
			fixed: `a { color: pink;\n}`,
			description: `a closing brace indented under a rule that opens with its declaration`,

			message: messages.expected(`0 spaces`),
			line: 2,
			column: 3,
		},
		{
			code: `
				a {
				  color: pink
				}
				 b {
				  color: orange
				}
			`,
			fixed: `
				a {
				  color: pink
				}
				b {
				  color: orange
				}
			`,
			description: `the second rule indented by a space`,

			message: messages.expected(`0 spaces`),
			line: 4,
			column: 2,
		},
		{
			code: `
				a {
				  color: pink
				}
				b {
				  color: orange
				 }
			`,
			fixed: `
				a {
				  color: pink
				}
				b {
				  color: orange
				}
			`,
			description: `the closing brace of the second rule indented by a space`,

			message: messages.expected(`0 spaces`),
			line: 6,
			column: 2,
		},
		{
			code: `
				a {
				color: pink;
				}
			`,
			fixed: `
				a {
				  color: pink;
				}
			`,
			description: `a declaration left at the left margin`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
		{
			code: `
				a {
					color: pink;
				}
			`,
			fixed: `
				a {
				  color: pink;
				}
			`,
			description: `a declaration indented by a tab where spaces are asked for`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 2,
		},
		{
			code: `
				a {
				  color: pink;
				 background: orange;
				}
			`,
			fixed: `
				a {
				  color: pink;
				  background: orange;
				}
			`,
			description: `the second declaration indented by a single space`,

			message: messages.expected(`2 spaces`),
			line: 3,
			column: 2,
		},
		{
			code: `
				a {
				  background-position: top left,
				  top right,
				    bottom left;
				  color: pink;
				}
			`,
			fixed: `
				a {
				  background-position: top left,
				    top right,
				    bottom left;
				  color: pink;
				}
			`,
			description: `the second part of a broken value left one level short`,

			message: messages.expected(`4 spaces`),
			line: 3,
			column: 3,
		},
		{
			code: `
				a {
				  background-position: top left,
				    top right,
				  bottom left;
				  color: pink;
				}
			`,
			fixed: `
				a {
				  background-position: top left,
				    top right,
				    bottom left;
				  color: pink;
				}
			`,
			description: `its last part left one level short`,

			message: messages.expected(`4 spaces`),
			line: 4,
			column: 3,
		},
		{
			code: `
				@media print {
				   * { color: pink; }
				}
			`,
			fixed: `
				@media print {
				  * { color: pink; }
				}
			`,
			description: `a universal selector indented three spaces inside a media query`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 4,
		},
		{
			code: `
				a {
				 @media print { color: pink; }
				}
			`,
			fixed: `
				a {
				  @media print { color: pink; }
				}
			`,
			description: `a media query indented by a single space inside a rule`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 2,
		},
		{
			code: `\ta {\r\n  color: pink;\r\n}`,
			fixed: `a {\r\n  color: pink;\r\n}`,
			description: `the same rule indented by a tab, written with carriage-return line breaks`,

			message: messages.expected(`0 spaces`),
			line: 1,
			column: 2,
		},
		{
			code: `a {\r\n  color: pink;\r\n  }`,
			fixed: `a {\r\n  color: pink;\r\n}`,
			description: `the same closing brace written with carriage-return line breaks`,

			message: messages.expected(`0 spaces`),
			line: 3,
			column: 3,
		},
		{
			code: `a,\r\nb {\r\n  color: pink;\r\n  }`,
			fixed: `a,\r\nb {\r\n  color: pink;\r\n}`,
			description: `the same closing brace under a selector list, written with carriage-return line breaks`,

			message: messages.expected(`0 spaces`),
			line: 4,
			column: 3,
		},
		{
			code: `a { color: pink;\r\n  }`,
			fixed: `a { color: pink;\r\n}`,
			description: `the same closing brace under a rule that opens with its declaration`,

			message: messages.expected(`0 spaces`),
			line: 2,
			column: 3,
		},
		{
			code: `a {\r\n  color: pink\r\n}\r\n b {\r\n  color: orange\r\n}`,
			fixed: `a {\r\n  color: pink\r\n}\r\nb {\r\n  color: orange\r\n}`,
			description: `the same second rule indented by a space, written with carriage-return line breaks`,

			message: messages.expected(`0 spaces`),
			line: 4,
			column: 2,
		},
		{
			code: `a {\r\n  color: pink\r\n}\r\nb {\r\n  color: orange\r\n }`,
			fixed: `a {\r\n  color: pink\r\n}\r\nb {\r\n  color: orange\r\n}`,
			description: `the same closing brace indented by a space, written with carriage-return line breaks`,

			message: messages.expected(`0 spaces`),
			line: 6,
			column: 2,
		},
		{
			code: `a {\r\ncolor: pink;\r\n}`,
			fixed: `a {\r\n  color: pink;\r\n}`,
			description: `the same declaration at the left margin, written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
		{
			code: `a {\r\n\tcolor: pink;\r\n}`,
			fixed: `a {\r\n  color: pink;\r\n}`,
			description: `the same declaration indented by a tab, written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 2,
		},
		{
			code: `a {\r\n  color: pink;\r\n background: orange;\r\n}`,
			fixed: `a {\r\n  color: pink;\r\n  background: orange;\r\n}`,
			description: `the same second declaration, written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 3,
			column: 2,
		},
		{
			code: `a {\r\n  background-position: top left,\r\n  top right,\r\n    bottom left;\r\n  color: pink;\r\n}`,
			fixed: `a {\r\n  background-position: top left,\r\n    top right,\r\n    bottom left;\r\n  color: pink;\r\n}`,
			description: `the same short second part of a value, written with carriage-return line breaks`,

			message: messages.expected(`4 spaces`),
			line: 3,
			column: 3,
		},
		{
			code: `a {\r\n  background-position: top left,\r\n    top right,\r\n  bottom left;\r\n  color: pink;\r\n}`,
			fixed: `a {\r\n  background-position: top left,\r\n    top right,\r\n    bottom left;\r\n  color: pink;\r\n}`,
			description: `the same short last part, written with carriage-return line breaks`,

			message: messages.expected(`4 spaces`),
			line: 4,
			column: 3,
		},
		{
			code: `@media print {\r\n   * { color: pink; }\r\n}`,
			fixed: `@media print {\r\n  * { color: pink; }\r\n}`,
			description: `the same universal selector, written with carriage-return line breaks`,

			message: messages.expected(`2 spaces`),
			line: 2,
			column: 4,
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],

	accept: [
		{
			code: ``,
			description: `an empty stylesheet`,
		},
		{
			code: `a {color: pink;}`,
			description: `a rule written on one line`,
		},
		{
			code: `
				a {
					color: pink;
				}
			`,
			description: `a declaration indented by a tab`,
		},
		{
			code: `
				a {
					color: pink;
				}

				b {
					color: orange
				}
			`,
			description: `two rules, each indented by a tab`,
		},
		{
			code: `a {\n\tcolor: pink;}`,
			description: `a closing brace standing behind the declaration`,
		},
	],

	reject: [
		{
			code: `\ta {\n\tcolor: pink;\n}`,
			fixed: `a {\n\tcolor: pink;\n}`,
			description: `a rule indented by a tab at the root`,

			message: messages.expected(`0 tabs`),
			line: 1,
			column: 2,
		},
		{
			code: `
				a {
					color: pink;
				  }
			`,
			fixed: `
				a {
					color: pink;
				}
			`,
			description: `a closing brace indented by spaces`,

			message: messages.expected(`0 tabs`),
			line: 3,
			column: 3,
		},
		{
			code: `
				a {
					color: pink
				}
				 b {
					color: orange
				}
			`,
			fixed: `
				a {
					color: pink
				}
				b {
					color: orange
				}
			`,
			description: `the second rule indented by a space`,

			message: messages.expected(`0 tabs`),
			line: 4,
			column: 2,
		},
		{
			code: `
				a {
					color: pink
				}
				b {
					color: orange
				 }
			`,
			fixed: `
				a {
					color: pink
				}
				b {
					color: orange
				}
			`,
			description: `the closing brace of the second rule indented by a space`,

			message: messages.expected(`0 tabs`),
			line: 6,
			column: 2,
		},
		{
			code: `
				a {
				color: pink;
				}
			`,
			fixed: `
				a {
					color: pink;
				}
			`,
			description: `a declaration left at the left margin`,

			message: messages.expected(`1 tab`),
			line: 2,
			column: 1,
		},
		{
			code: `
				a {
				  color: pink;
				}
			`,
			fixed: `
				a {
					color: pink;
				}
			`,
			description: `a declaration indented by spaces where tabs are asked for`,

			message: messages.expected(`1 tab`),
			line: 2,
			column: 3,
		},
		{
			code: `
				a {
					color: pink;
				 background: orange;
				}
			`,
			fixed: `
				a {
					color: pink;
					background: orange;
				}
			`,
			description: `the second declaration indented by a single space`,

			message: messages.expected(`1 tab`),
			line: 3,
			column: 2,
		},
		{
			code: `
				a { color: pink;
				top: 0; background: orange;
				}
			`,
			fixed: `
				a { color: pink;
					top: 0; background: orange;
				}
			`,
			description: `a declaration at the left margin under a rule that opens with one`,

			message: messages.expected(`1 tab`),
			line: 2,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [2, { except: [`value`] }],

	accept: [
		{
			code: `
				a {
				  background-position: top left, top right, bottom left;
				  color: pink;
				}
			`,
			description: `a value written on one line, which this option does not measure`,
		},
		{
			code: `
				a {
				  background-position: top left,
				  top right,
				  bottom left;
				  color: pink;
				}
			`,
			description: `a value broken over lines with none of its parts indented, as this option asks`,
		},
	],

	reject: [
		{
			code: `
				a {
				  background-position: top left,
				    top right,
				  bottom left;
				  color: pink;
				}
			`,
			fixed: `
				a {
				  background-position: top left,
				  top right,
				  bottom left;
				  color: pink;
				}
			`,
			description: `the second part of the value indented a level deeper`,

			message: messages.expected(`2 spaces`),
			line: 3,
			column: 5,
		},
		{
			code: `
				a {
				  background-position: top left,
				  top right,
				    bottom left;
				  color: pink;
				}
			`,
			fixed: `
				a {
				  background-position: top left,
				  top right,
				  bottom left;
				  color: pink;
				}
			`,
			description: `its last part indented a level deeper`,

			message: messages.expected(`2 spaces`),
			line: 4,
			column: 5,
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: [`value`] }],

	accept: [
		{
			code: `
				a {
				  background-position: top left, top right, bottom left;
				  color: pink;
				}
			`,
			description: `a value written on one line, which this option leaves alone`,
		},
		{
			code: `
				a {
				  background-position: top left,
				  top right,
				  bottom left;
				  color: pink;
				}
			`,
			description: `the same value broken over lines with no indentation`,
		},
		{
			code: `
				a {
				  background-position: top left,
				    top right,
				  bottom left;
				  color: pink;
				}
			`,
			description: `the same value with its second part indented`,
		},
		{
			code: `
				a {
				  background-position: top left,
				  top right,
				    bottom left;
				  color: pink;
				}
			`,
			description: `the same value with its last part indented`,
		},
	],

	reject: [
		{
			code: `\ta {\n  color: pink;\n}`,
			fixed: `a {\n  color: pink;\n}`,
			description: `a rule indented by a tab at the root, which the option does not spare`,

			message: messages.expected(`0 spaces`),
			line: 1,
			column: 2,
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
				a {
				  color: pink;
				  }
			`,
			description: `a closing brace indented with the block it closes, as this option asks`,
		},
		{
			code: `
				a {
				  color: pink;
				  & b {
				    top: 0;
				    }
				  }
			`,
			description: `a nested rule whose closing braces are indented with their blocks`,
		},
	],

	reject: [
		{
			code: `
				a {
				  color: pink;
				}
			`,
			fixed: `
				a {
				  color: pink;
				  }
			`,
			description: `a closing brace left at the left margin`,
			message: messages.expected(`2 spaces`),
			line: 3,
			column: 1,
		},
		{
			code: `
				a {
				  color: pink;
				  & b {
				    top: 0;
				   }
				  }
			`,
			fixed: `
				a {
				  color: pink;
				  & b {
				    top: 0;
				    }
				  }
			`,
			description: `the closing brace of the nested rule indented one space short`,
			message: messages.expected(`4 spaces`),
			line: 5,
			column: 4,
		},
	],
})
