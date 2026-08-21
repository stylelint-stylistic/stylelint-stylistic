import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `a comment whose own lines the rule does not measure`,
			code: `/* anything\n    goes\n\t\t\twithin a comment */\n`,
		},
		{
			description: `two rules on one line`,
			code: `a { top: 0; } b { top: 1px; }`,
		},
		{
			description: `a rule broken over lines and another written on one`,
			code: `
				a {
				  top: 0;
				}
				b { top: 1px; bottom: 4px; }
			`,
		},
		{
			description: `a single-line rule opening on the line the one before it closes`,
			code: `
				a {
				  top: 0;
				} b { top: 1px; }
			`,
		},
		{
			description: `a declaration indented one level`,
			code: `
				a {
				  color: pink;
				}
			`,
		},
		{
			description: `a declaration standing on the line the rule opens`,
			code: `a { color: pink;\n}`,
		},
		{
			description: `a rule broken over lines and a single-line one behind it`,
			code: `
				a {
				  color: pink;
				} b { top: 0; }
			`,
		},
		{
			description: `two declarations on the line below the one the rule opens`,
			code: `
				a { color: pink;
				  top: 0; background: orange;
				}
			`,
		},
		{
			description: `two rules separated by blank lines`,
			code: `
				a {
				  color: pink;
				}


				b {
				  color: orange
				}
			`,
		},
		{
			description: `a closing brace standing behind the declaration`,
			code: `a {\n  color: pink;}`,
		},
		{
			description: `a value broken over three lines, each of its parts a level deeper`,
			code: `
				a {
				  background-position: top left,
				    top right,
				    bottom left;
				  color: pink;
				}
			`,
		},
		{
			description: `the same value with its semicolon on a line of its own`,
			code: `a {\n  background-position: top left,\n    top right,\n    bottom left\n  ;\n}`,
		},
		{
			description: `a blank line standing inside a value broken over lines`,
			code: `a {\n  background-position: top left,\n    top right,\n\n    bottom left\n  ;\n}`,
		},
		{
			description: `a declaration whose property carries a star hack`,
			code: `
				a {
				  *top: 1px;
				}
			`,
		},
		{
			description: `a declaration whose property carries an underscore hack`,
			code: `
				a {
				  _top: 1px;
				}
			`,
		},
		{
			description: `a universal selector on one line`,
			code: `* { top: 0; }`,
		},
		{
			description: `a universal selector indented inside a media query`,
			code: `
				@media print {
				  * { color: pink; }
				}
			`,
		},
		{
			description: `a media query nested inside a rule`,
			code: `
				a {
				  @media print { color: pink; }
				}
			`,
		},
		{
			description: `the same comment written with carriage-return line breaks`,
			code: `/* anything\r\n    goes\r\n\t\t\twithin a comment */\r\n`,
		},
		{
			description: `the same two rules written with carriage-return line breaks`,
			code: `a {\r\n  top: 0;\r\n}\r\nb { top: 1px; bottom: 4px; }`,
		},
		{
			description: `the same pair of rules written with carriage-return line breaks`,
			code: `a {\r\n  top: 0;\r\n} b { top: 1px; }`,
		},
		{
			description: `the same declaration written with carriage-return line breaks`,
			code: `a {\r\n  color: pink;\r\n}`,
		},
		{
			description: `the same rule opening with its declaration, written with carriage-return line breaks`,
			code: `a { color: pink;\r\n}`,
		},
		{
			description: `the same pair written with carriage-return line breaks`,
			code: `a {\r\n  color: pink;\r\n} b { top: 0; }`,
		},
		{
			description: `the same two declarations written with carriage-return line breaks`,
			code: `a { color: pink;\r\n  top: 0; background: orange;\r\n}`,
		},
		{
			description: `the same rules separated by blank lines, written with carriage-return line breaks`,
			code: `a {\r\n  color: pink;\r\n}\r\n\r\n\r\nb {\r\n  color: orange\r\n}`,
		},
		{
			description: `the same closing brace written with carriage-return line breaks`,
			code: `a {\r\n  color: pink;}`,
		},
		{
			description: `the same broken value written with carriage-return line breaks`,
			code: `a {\r\n  background-position: top left,\r\n    top right,\r\n    bottom left;\r\n  color: pink;\r\n}`,
		},
		{
			description: `the same value with its own semicolon line, written with carriage-return line breaks`,
			code: `a {\r\n  background-position: top left,\r\n    top right,\r\n    bottom left\r\n  ;\r\n}`,
		},
		{
			description: `the same blank line inside a value, written with carriage-return line breaks`,
			code: `a {\r\n  background-position: top left,\r\n    top right,\r\n\r\n    bottom left\r\n  ;\r\n}`,
		},
		{
			description: `the same star hack written with carriage-return line breaks`,
			code: `a {\r\n  *top: 1px;\r\n}`,
		},
		{
			description: `the same underscore hack written with carriage-return line breaks`,
			code: `a {\r\n  _top: 1px;\r\n}`,
		},
		{
			description: `the same universal selector in a media query, written with carriage-return line breaks`,
			code: `@media print {\r\n  * { color: pink; }\r\n}`,
		},
		{
			description: `a selector list whose second selector opens the line`,
			code: `
				.a[disabled],
				.b {
				  color: pink;
				}
			`,
		},
		{
			description: `a selector broken inside the parentheses of a pseudo-class`,
			code: `
				:not(.enabled
				) {
				  color: pink;
				}
			`,
		},
	],

	reject: [
		{
			description: `a rule indented by a tab at the root`,
			code: `\ta {\n  color: pink;\n}`,
			fixed: `a {\n  color: pink;\n}`,
			line: 1,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `a closing brace indented one level`,
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
			line: 3,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same closing brace under a selector list`,
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
			line: 4,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `a closing brace indented under a rule that opens with its declaration`,
			code: `a { color: pink;\n  }`,
			fixed: `a { color: pink;\n}`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the second rule indented by a space`,
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
			line: 4,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the closing brace of the second rule indented by a space`,
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
			line: 6,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `a declaration left at the left margin`,
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
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `a declaration indented by a tab where spaces are asked for`,
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
			line: 2,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the second declaration indented by a single space`,
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
			line: 3,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the second part of a broken value left one level short`,
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
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `its last part left one level short`,
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
			line: 4,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `a universal selector indented three spaces inside a media query`,
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
			line: 2,
			column: 4,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `a media query indented by a single space inside a rule`,
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
			line: 2,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same rule indented by a tab, written with carriage-return line breaks`,
			code: `\ta {\r\n  color: pink;\r\n}`,
			fixed: `a {\r\n  color: pink;\r\n}`,
			line: 1,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same closing brace written with carriage-return line breaks`,
			code: `a {\r\n  color: pink;\r\n  }`,
			fixed: `a {\r\n  color: pink;\r\n}`,
			line: 3,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same closing brace under a selector list, written with carriage-return line breaks`,
			code: `a,\r\nb {\r\n  color: pink;\r\n  }`,
			fixed: `a,\r\nb {\r\n  color: pink;\r\n}`,
			line: 4,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same closing brace under a rule that opens with its declaration`,
			code: `a { color: pink;\r\n  }`,
			fixed: `a { color: pink;\r\n}`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same second rule indented by a space, written with carriage-return line breaks`,
			code: `a {\r\n  color: pink\r\n}\r\n b {\r\n  color: orange\r\n}`,
			fixed: `a {\r\n  color: pink\r\n}\r\nb {\r\n  color: orange\r\n}`,
			line: 4,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same closing brace indented by a space, written with carriage-return line breaks`,
			code: `a {\r\n  color: pink\r\n}\r\nb {\r\n  color: orange\r\n }`,
			fixed: `a {\r\n  color: pink\r\n}\r\nb {\r\n  color: orange\r\n}`,
			line: 6,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same declaration at the left margin, written with carriage-return line breaks`,
			code: `a {\r\ncolor: pink;\r\n}`,
			fixed: `a {\r\n  color: pink;\r\n}`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same declaration indented by a tab, written with carriage-return line breaks`,
			code: `a {\r\n\tcolor: pink;\r\n}`,
			fixed: `a {\r\n  color: pink;\r\n}`,
			line: 2,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same second declaration, written with carriage-return line breaks`,
			code: `a {\r\n  color: pink;\r\n background: orange;\r\n}`,
			fixed: `a {\r\n  color: pink;\r\n  background: orange;\r\n}`,
			line: 3,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same short second part of a value, written with carriage-return line breaks`,
			code: `a {\r\n  background-position: top left,\r\n  top right,\r\n    bottom left;\r\n  color: pink;\r\n}`,
			fixed: `a {\r\n  background-position: top left,\r\n    top right,\r\n    bottom left;\r\n  color: pink;\r\n}`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the same short last part, written with carriage-return line breaks`,
			code: `a {\r\n  background-position: top left,\r\n    top right,\r\n  bottom left;\r\n  color: pink;\r\n}`,
			fixed: `a {\r\n  background-position: top left,\r\n    top right,\r\n    bottom left;\r\n  color: pink;\r\n}`,
			line: 4,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the same universal selector, written with carriage-return line breaks`,
			code: `@media print {\r\n   * { color: pink; }\r\n}`,
			fixed: `@media print {\r\n  * { color: pink; }\r\n}`,
			line: 2,
			column: 4,
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],

	accept: [
		{
			description: `an empty stylesheet`,
			code: ``,
		},
		{
			description: `a rule written on one line`,
			code: `a {color: pink;}`,
		},
		{
			description: `a declaration indented by a tab`,
			code: `
				a {
					color: pink;
				}
			`,
		},
		{
			description: `two rules, each indented by a tab`,
			code: `
				a {
					color: pink;
				}

				b {
					color: orange
				}
			`,
		},
		{
			description: `a closing brace standing behind the declaration`,
			code: `a {\n\tcolor: pink;}`,
		},
	],

	reject: [
		{
			description: `a rule indented by a tab at the root`,
			code: `\ta {\n\tcolor: pink;\n}`,
			fixed: `a {\n\tcolor: pink;\n}`,
			line: 1,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `a closing brace indented by spaces`,
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
			line: 3,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the second rule indented by a space`,
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
			line: 4,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the closing brace of the second rule indented by a space`,
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
			line: 6,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `a declaration left at the left margin`,
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
			line: 2,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a declaration indented by spaces where tabs are asked for`,
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
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the second declaration indented by a single space`,
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
			line: 3,
			column: 2,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a declaration at the left margin under a rule that opens with one`,
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
			line: 2,
			column: 1,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: [2, { except: [`value`] }],

	accept: [
		{
			description: `a value written on one line, which this option does not measure`,
			code: `
				a {
				  background-position: top left, top right, bottom left;
				  color: pink;
				}
			`,
		},
		{
			description: `a value broken over lines with none of its parts indented, as this option asks`,
			code: `
				a {
				  background-position: top left,
				  top right,
				  bottom left;
				  color: pink;
				}
			`,
		},
	],

	reject: [
		{
			description: `the second part of the value indented a level deeper`,
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
			line: 3,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `its last part indented a level deeper`,
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
			line: 4,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: [`value`] }],

	accept: [
		{
			description: `a value written on one line, which this option leaves alone`,
			code: `
				a {
				  background-position: top left, top right, bottom left;
				  color: pink;
				}
			`,
		},
		{
			description: `the same value broken over lines with no indentation`,
			code: `
				a {
				  background-position: top left,
				  top right,
				  bottom left;
				  color: pink;
				}
			`,
		},
		{
			description: `the same value with its second part indented`,
			code: `
				a {
				  background-position: top left,
				    top right,
				  bottom left;
				  color: pink;
				}
			`,
		},
		{
			description: `the same value with its last part indented`,
			code: `
				a {
				  background-position: top left,
				  top right,
				    bottom left;
				  color: pink;
				}
			`,
		},
	],

	reject: [
		{
			description: `a rule indented by a tab at the root, which the option does not spare`,
			code: `\ta {\n  color: pink;\n}`,
			fixed: `a {\n  color: pink;\n}`,
			line: 1,
			column: 2,
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
			description: `a closing brace indented with the block it closes, as this option asks`,
			code: `
				a {
				  color: pink;
				  }
			`,
		},
		{
			description: `a nested rule whose closing braces are indented with their blocks`,
			code: `
				a {
				  color: pink;
				  & b {
				    top: 0;
				    }
				  }
			`,
		},
	],

	reject: [
		{
			description: `a closing brace left at the left margin`,
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
			line: 3,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the closing brace of the nested rule indented one space short`,
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
			line: 5,
			column: 4,
			message: messages.expected(`4 spaces`),
		},
	],
})
