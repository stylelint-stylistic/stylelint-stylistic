import { messages, ruleName } from "./index.ts"

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
			description: `a stray semicolon in front of a declaration on its line, which stands on the line and is no indentation`,
			code: `a {\n  color: pink;\n  ; top: 1px;\n}`,
		},
		{
			description: `a rule behind a free semicolon on its line, the semicolon standing behind the closing brace of the rule in front`,
			code: `a {\n  b {}\n  ; c {}\n}`,
		},
		{
			// A free semicolon alone on its line stands where a declaration of the block does
			description: `a free semicolon alone on its line at the level of the block's statements`,
			code: `a {\n  b {}\n  ;\n  color: pink;\n  ;\n}\n;\n`,
		},
		{
			// The stray semicolon stands on the brace's line and is no part of the run the brace's level is read off
			description: `a closing brace standing at its level behind a stray semicolon on its line`,
			code: `a {\n  color: pink;\n;}`,
		},
		{
			// The same line inside a nested rule, where the brace stands a level in
			description: `a closing brace of a nested rule standing at its level behind a stray semicolon on its line`,
			code: `a {\n  b {\n    color: pink;\n  ;}\n}`,
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
			description: `a stray semicolon in front of a declaration on a line indented a level too deep, whose run in front of the semicolon the fix writes`,
			code: `a {\n  color: pink;\n    ; top: 1px;\n}`,
			fixed: `a {\n  color: pink;\n  ; top: 1px;\n}`,
			line: 3,
			column: 7,
			message: messages.expected(`2 spaces`),
		},
		{
			// Behind a rule's brace the semicolon and the run in front of it are the rule's own raw, and the next node's raw holds no break, so the line went unmeasured
			description: `a rule behind a free semicolon on a line indented a level too deep, the semicolon standing behind the closing brace of the rule in front`,
			code: `a {\n  b {}\n    ; c {}\n}`,
			fixed: `a {\n  b {}\n  ; c {}\n}`,
			line: 3,
			column: 7,
			message: messages.expected(`2 spaces`),
		},
		{
			// A free semicolon alone on its line was measured by nobody, wherever the parser filed it
			description: `a free semicolon alone on a line indented a level too deep, in the run in front of a closing brace`,
			code: `a {\n  color: pink;\n    ;\n}`,
			fixed: `a {\n  color: pink;\n  ;\n}`,
			line: 3,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same line in the run in front of a node`,
			code: `a {\n  color: pink;\n    ;\n  top: 1px;\n}`,
			fixed: `a {\n  color: pink;\n  ;\n  top: 1px;\n}`,
			line: 3,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `a free semicolon alone on a line indented too shallow behind the closing brace of a rule, which keeps the semicolon in a raw of its own`,
			code: `a {\n  b {}\n;\n  c {}\n}`,
			fixed: `a {\n  b {}\n  ;\n  c {}\n}`,
			line: 3,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same line closing the stylesheet`,
			code: `@import "a";\n  ;`,
			fixed: `@import "a";\n;`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same line at the root, the node standing right behind the semicolon`,
			code: `a {}\n  ;b {}`,
			fixed: `a {}\n;b {}`,
			line: 2,
			column: 4,
			message: messages.expected(`0 spaces`),
		},
		{
			// The run in front of the stray semicolon is the brace's indentation, and the fix writes it alone
			description: `a closing brace indented a level too deep behind a stray semicolon on its line`,
			code: `a {\n  color: pink;\n  ;}`,
			fixed: `a {\n  color: pink;\n;}`,
			line: 3,
			column: 4,
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
			description: `a closing brace indented a level too deep with a stray semicolon behind it, marked on the brace rather than on the semicolon PostCSS prints behind it`,
			code: `a {\n\tcolor: pink;\n\t\t};`,
			fixed: `a {\n\tcolor: pink;\n};`,
			line: 3,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the same brace closing a block whose last node is an at-rule with neither block nor semicolon of its own, which reaches the brace since #509`,
			code: `a {\n\t@include m\n\t\t};`,
			fixed: `a {\n\t@include m\n};`,
			line: 3,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			// The escape is masked in the copy the breaks are found over, its closing break left standing
			description: `a value continued on the line behind the line break closing a hexadecimal escape, which is a line of the file`,
			code: `
				a {
					b: 1\\2c
				c;
				}
			`,
			fixed: `
				a {
					b: 1\\2c
						c;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
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
		{
			description: `a closing brace indented by spaces, standing behind a custom property with no semicolon, whose value the parser keeps that indentation in rather than the block`,
			code: `
				a {
					--b: red
				  }
			`,
			fixed: `
				a {
					--b: red
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			// The flag's line is in `raws.important`, which the writer wrote nothing to: its indentation landed at the end of the value and the value grew every run
			description: `an important flag standing on a line of its own behind a value broken over lines`,
			code: `a {\n\tbackground-position: top left,\n\t\ttop right\n!important;\n}\n`,
			fixed: `a {\n\tbackground-position: top left,\n\t\ttop right\n\t\t!important;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same flag broken between its bang and its word, whose run the same raw holds`,
			code: `a {\n\tbackground-position: top left,\n\t\ttop right !\nimportant;\n}\n`,
			fixed: `a {\n\tbackground-position: top left,\n\t\ttop right !\n\t\timportant;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
		{
			// The break stands in the flag's raw alone, where the guard used to ask only the value and the run in front of it
			description: `the same flag behind a value written on one line, whose break is the declaration's only one`,
			code: `a {\n\tcolor: pink\n!important;\n}\n`,
			fixed: `a {\n\tcolor: pink\n\t\t!important;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same flag broken between its bang and its word, over a value written on one line`,
			code: `a {\n\tcolor: pink !\nimportant;\n}\n`,
			fixed: `a {\n\tcolor: pink !\n\t\timportant;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
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
		{
			description: `the lines inside a parenthesis the value opens at the end of a line, which that parenthesis indents whatever the option says about the value itself`,
			code: `
				a {
				  b: (
				  1px
				  );
				}
			`,
			fixed: `
				a {
				  b: (
				    1px
				  );
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
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

testRule({
	ruleName,
	config: [`tab`],

	accept: [
		{
			description: `a semicolon standing alone on the line behind the value, at the declaration's level`,
			code: `a {\n\tcolor: pink\n\t;\n}\n`,
		},
		{
			description: `the same semicolon behind an empty line, which is not this rule's`,
			code: `a {\n\tcolor: pink\n\n\t;\n}\n`,
		},
		{
			description: `a vertical tab in front of the semicolon, a word of the value standing on a line of the value`,
			code: `a {\n\tcolor: pink\n\t\t\v;\n}\n`,
		},
	],

	reject: [
		{
			description: `a semicolon alone on its line, indented two levels past the declaration it closes: the line is the declaration's, asked for the declaration's level`,
			code: `a {\n\tcolor: pink\n\t\t\t;\n}\n`,
			fixed: `a {\n\tcolor: pink\n\t;\n}\n`,
			line: 3,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same line behind a custom property, whose value keeps the run`,
			code: `a {\n\t--x: pink\n\t\t\t;\n}\n`,
			fixed: `a {\n\t--x: pink\n\t;\n}\n`,
			line: 3,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same line behind a bang, whose raw keeps the run, with no indentation at all`,
			code: `a {\n\tcolor: pink !important\n;\n}\n`,
			fixed: `a {\n\tcolor: pink !important\n\t;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same line closing a declaration in the middle of the block`,
			code: `a {\n\tcolor: pink\n;\n\ttop: 0;\n}\n`,
			fixed: `a {\n\tcolor: pink\n\t;\n\ttop: 0;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same line in a nested rule, asked for that rule's level`,
			code: `a {\n\tb {\n\t\tcolor: pink\n\t;\n\t}\n}\n`,
			fixed: `a {\n\tb {\n\t\tcolor: pink\n\t\t;\n\t}\n}\n`,
			line: 4,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `a whitespace-only line in front of the semicolon's, left as it stands while the semicolon's line is written`,
			code: `a {\n\tcolor: pink\n\t\t\t\n\t\t\t;\n}\n`,
			fixed: `a {\n\tcolor: pink\n\t\t\t\n\t;\n}\n`,
			line: 4,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a value broken over lines, whose own line stands a level deeper while the semicolon's line stands at the declaration's level`,
			code: `a {\n\tcolor:\n\t\tpink\n\t\t;\n}\n`,
			fixed: `a {\n\tcolor:\n\t\tpink\n\t;\n}\n`,
			line: 4,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same line behind a Windows break, which the fix keeps`,
			code: `a {\r\n\tcolor: pink\r\n\t\t\t;\r\n}\r\n`,
			fixed: `a {\r\n\tcolor: pink\r\n\t;\r\n}\r\n`,
			line: 3,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a bare carriage return opening the semicolon's line, read as indentation and written over`,
			code: `a {\n\tcolor: pink\n\r\t;\n}\n`,
			fixed: `a {\n\tcolor: pink\n\t;\n}\n`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a form feed opening the semicolon's line, read the same way`,
			code: `a {\n\tcolor: pink\n\f\t;\n}\n`,
			fixed: `a {\n\tcolor: pink\n\t;\n}\n`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same line behind a custom property of the root, asked for the first column`,
			code: `--x: 1\n\t;\na {}\n`,
			fixed: `--x: 1\n;\na {}\n`,
			line: 2,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
	],
})

testRule({
	ruleName,
	config: [2],

	reject: [
		{
			description: `a semicolon alone on its line, indented by a tab where the declaration stands at two spaces`,
			code: `a {\n  color: pink\n\t;\n}\n`,
			fixed: `a {\n  color: pink\n  ;\n}\n`,
			line: 3,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [2, { except: [`value`] }],

	reject: [
		{
			description: `a semicolon alone on its line behind a value the option leaves at the declaration's level: the semicolon's line is asked for that level too`,
			code: `a {\n  color:\n  pink\n    ;\n}\n`,
			fixed: `a {\n  color:\n  pink\n  ;\n}\n`,
			line: 4,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: [`value`] }],

	reject: [
		{
			description: `a semicolon alone on its line behind a value the option does not measure: the semicolon's line is no line of the value, and is measured`,
			code: `a {\n  color:\n      pink\n    ;\n}\n`,
			fixed: `a {\n  color:\n      pink\n  ;\n}\n`,
			line: 4,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],

	accept: [
		{
			description: `a value opening on the line behind its colon, a level deeper than the declaration`,
			code: `a {\n\tcolor:\n\t\tpink;\n}\n`,
		},
	],

	reject: [
		{
			description: `a value opening on the line behind its colon with no indentation, the break standing in the declaration's \`raws.between\``,
			code: `a {\n\tcolor:\n pink;\n}\n`,
			fixed: `a {\n\tcolor:\n\t\tpink;\n}\n`,
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same line indented a level too deep`,
			code: `a {\n\tcolor:\n\t\t\tpink;\n}\n`,
			fixed: `a {\n\tcolor:\n\t\tpink;\n}\n`,
			line: 3,
			column: 4,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same line behind a comment standing after the colon`,
			code: `a {\n\tcolor: /* c */\npink;\n}\n`,
			fixed: `a {\n\tcolor: /* c */\n\t\tpink;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the colon's own line behind a property it is broken from, a line of the declaration measured as the value's`,
			code: `a {\n\tcolor\n: pink;\n}\n`,
			fixed: `a {\n\tcolor\n\t\t: pink;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same line behind a custom property, whose value keeps no break of its own`,
			code: `a {\n\t--x:\npink;\n}\n`,
			fixed: `a {\n\t--x:\n\t\tpink;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `two lines standing in \`raws.between\`, a comment's and the value's, both written in one run`,
			code: `a {\n\tcolor:\n/* c */\npink\n\t\tpink;\n}\n`,
			fixed: `a {\n\tcolor:\n\t\t/* c */\n\t\tpink\n\t\tpink;\n}\n`,
			warnings: [
				{ line: 3, column: 1, message: messages.expected(`2 tabs`) },
				{ line: 4, column: 1, message: messages.expected(`2 tabs`) },
			],
		},
		{
			description: `the same line behind a Windows break, which the fix keeps`,
			code: `a {\r\n\tcolor:\r\npink;\r\n}\r\n`,
			fixed: `a {\r\n\tcolor:\r\n\t\tpink;\r\n}\r\n`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`, { except: [`value`] }],

	reject: [
		{
			description: `a value opening on the line behind its colon under the option, asked for the declaration's level`,
			code: `a {\n\tcolor:\n\t\tpink;\n}\n`,
			fixed: `a {\n\tcolor:\n\tpink;\n}\n`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`, { ignore: [`value`] }],

	accept: [
		{
			description: `a value opening on the line behind its colon under the option, which does not measure it`,
			code: `a {\n\tcolor:\npink;\n}\n`,
		},
	],
})
