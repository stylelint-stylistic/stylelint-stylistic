import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-html`,
	autoStripIndent: false,

	accept: [
		{
			description: `a stylesheet indented one level inside the style element`,
			code: `
<style>
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
		{
			description: `a stylesheet standing at the left margin`,
			code: `
<style>
a {
\tdisplay:block;
}
</style>`,
		},
		{
			description: `a stylesheet opening on the line of the style tag`,
			code: `
<style>a {
\tdisplay:block;
}
</style>`,
		},
		{
			description: `a style attribute, whose declarations stand on one line`,
			code: `<a style="display:block; color:red;"></a>`,
		},
	],

	reject: [
		{
			description: `a declaration left level with its selector`,
			code: `
<style>
\ta {
\tdisplay:block;
\t}
</style>`,
			fixed: `
<style>
\ta {
\t\tdisplay:block;
\t}
</style>`,
			line: 4,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `a stylesheet indented with spaces where the option asks for tabs`,
			code: `
<style>
  a {
      display:block;
    }
</style>`,
			fixed: `
<style>
\ta {
\t\tdisplay:block;
\t}
</style>`,
			warnings: [
				{
					line: 3,
					column: 3,
					message: messages.expected(`1 tab`),
				},
				{
					line: 5,
					column: 5,
					message: messages.expected(`1 tab`),
				},
				{
					line: 4,
					column: 7,
					message: messages.expected(`2 tabs`),
				},
			],
		},
		{
			description: `a stylesheet with no indentation at all`,
			code: `
<style>
a {
display:block;
}
</style>`,
			fixed: `
<style>
a {
\tdisplay:block;
}
</style>`,
			line: 4,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a declaration level with its selector, both indented with spaces`,
			code: `
<style>
  a {
  display:block;
  }
</style>`,
			fixed: `
<style>
\ta {
\t\tdisplay:block;
\t}
</style>`,
			warnings: [
				{
					line: 3,
					column: 3,
					message: messages.expected(`1 tab`),
				},
				{
					line: 5,
					column: 3,
					message: messages.expected(`1 tab`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`2 tabs`),
				},
			],
		},
		{
			description: `two rules indented with spaces inside an indented style element`,
			code: `
\t<style>
    a {
        display:block;
    }
    b {
      display:block;
    }
\t</style>`,
			fixed: `
\t<style>
\ta {
\t\tdisplay:block;
\t}
\tb {
\t\tdisplay:block;
\t}
\t</style>`,
			warnings: [
				{
					line: 3,
					column: 5,
					message: messages.expected(`1 tab`),
				},
				{
					line: 5,
					column: 5,
					message: messages.expected(`1 tab`),
				},
				{
					line: 4,
					column: 9,
					message: messages.expected(`2 tabs`),
				},
				{
					line: 6,
					column: 5,
					message: messages.expected(`1 tab`),
				},
				{
					line: 8,
					column: 5,
					message: messages.expected(`1 tab`),
				},
				{
					line: 7,
					column: 7,
					message: messages.expected(`2 tabs`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-html`,
	autoStripIndent: false,

	accept: [
		{
			description: `a stylesheet indented two spaces inside the style element`,
			code: `
<style>
  a {
    display:block;
  }
</style>`,
		},
		{
			description: `a stylesheet standing at the left margin`,
			code: `
<style>
a {
  display:block;
}
</style>`,
		},
		{
			description: `a stylesheet opening on the line of the style tag`,
			code: `
<style>a {
  display:block;
}
</style>`,
		},
	],
	reject: [
		{
			description: `a declaration indented by a single space`,
			code: `
<style>a {
 display:block;
}
</style>`,
			fixed: `
<style>a {
  display:block;
}
</style>`,
			line: 3,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [
		`tab`,
		{
			baseIndentLevel: 1,
		},
	],
	customSyntax: `postcss-html`,
	autoStripIndent: false,

	accept: [
		{
			description: `a stylesheet indented one level, which the base level asks for`,
			code: `
<style>
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
		{
			description: `an indented style element whose stylesheet follows it a level deeper`,
			code: `
\t<style>
\t\ta {
\t\t\tdisplay:block;
\t\t}
\t</style>`,
		},
		{
			description: `a style element carrying a language and a nonce`,
			code: `
<style lang="less" nonce="1">
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
		{
			description: `the same attributes each on a line of its own`,
			code: `
<style
\tlang="less"
\tnonce="1">
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
		{
			description: `the same attributes indented deeper, the closing bracket on its own line`,
			code: `
<style
\t\tlang="less"
\t\tnonce="1"
>
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
		{
			description: `the same element indented, its attributes deeper still`,
			code: `
\t<style
\t\tlang="less"
\t\tnonce="1"
\t>
\t\ta {
\t\t\tdisplay:block;
\t\t}
</style>`,
		},
		{
			description: `the same attributes indented unevenly`,
			code: `
<style
\tlang="less"
\t\tnonce="1">
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
	],
	reject: [
		{
			description: `a stylesheet at the left margin where the base level asks for one`,
			code: `
<style>
a {
\tdisplay:block;
}
</style>`,
			fixed: `
<style>
\ta {
\t\tdisplay:block;
\t}
</style>`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(`1 tab`),
				},
				{
					line: 5,
					column: 1,
					message: messages.expected(`1 tab`),
				},
				{
					line: 4,
					column: 2,
					message: messages.expected(`2 tabs`),
				},
			],
		},
		{
			description: `an indented style element whose stylesheet is level with it`,
			code: `
\t<style>
\ta {
\t\tdisplay:block;
\t}
\t</style>`,
			fixed: `
\t<style>
\t\ta {
\t\t\tdisplay:block;
\t\t}
\t</style>`,
			warnings: [
				{
					line: 3,
					column: 2,
					message: messages.expected(`2 tabs`),
				},
				{
					line: 5,
					column: 2,
					message: messages.expected(`2 tabs`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`3 tabs`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [
		`tab`,
		{
			baseIndentLevel: 0,
		},
	],
	customSyntax: `postcss-html`,
	autoStripIndent: false,

	accept: [
		{
			description: `a stylesheet at the left margin, which a base level of none asks for`,
			code: `
<style>
a {
\tdisplay:block;
}
</style>`,
		},
		{
			description: `an indented style element whose stylesheet is level with it`,
			code: `
\t<style>
\ta {
\t\tdisplay:block;
\t}
\t</style>`,
		},
	],
	reject: [
		{
			description: `a stylesheet indented one level where the base level asks for none`,
			code: `
<style>
\ta {
\t\tdisplay:block;
\t}
</style>`,
			fixed: `
<style>
a {
\tdisplay:block;
}
</style>`,
			warnings: [
				{
					line: 3,
					column: 2,
					message: messages.expected(`0 tabs`),
				},
				{
					line: 5,
					column: 2,
					message: messages.expected(`0 tabs`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`1 tab`),
				},
			],
		},
		{
			description: `an indented style element whose stylesheet stands a level deeper`,
			code: `
\t<style>
\t\ta {
\t\t\tdisplay:block;
\t\t}
\t</style>`,
			fixed: `
\t<style>
\ta {
\t\tdisplay:block;
\t}
\t</style>`,
			warnings: [
				{
					line: 3,
					column: 3,
					message: messages.expected(`1 tab`),
				},
				{
					line: 5,
					column: 3,
					message: messages.expected(`1 tab`),
				},
				{
					line: 4,
					column: 4,
					message: messages.expected(`2 tabs`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [
		2,
		{
			baseIndentLevel: 1,
		},
	],
	customSyntax: `postcss-html`,
	autoStripIndent: false,

	accept: [
		{
			description: `a stylesheet indented two spaces, which the base level asks for`,
			code: `
<style>
  a {
    display:block;
  }
</style>`,
		},
		{
			description: `an indented style element whose stylesheet follows it a level deeper`,
			code: `
  <style>
    a {
      display:block;
    }
  </style>`,
		},
		{
			description: `a style element carrying a language and a nonce`,
			code: `
<style lang="less" nonce="1">
  a {
    display:block;
  }
</style>`,
		},
		{
			description: `the same attributes each on a line of its own`,
			code: `
<style
  lang="less"
  nonce="1">
  a {
    display:block;
  }
</style>`,
		},
		{
			description: `the same attributes indented deeper, the closing bracket on its own line`,
			code: `
<style
    lang="less"
    nonce="1"
>
  a {
    display:block;
  }
</style>`,
		},
		{
			description: `the same element indented, its attributes deeper still`,
			code: `
  <style
    lang="less"
    nonce="1"
  >
    a {
      display:block;
    }
</style>`,
		},
		{
			description: `the same attributes indented unevenly`,
			code: `
<style
  lang="less"
    nonce="1">
  a {
    display:block;
  }
</style>`,
		},
	],
	reject: [
		{
			description: `a stylesheet at the left margin where the base level asks for one`,
			code: `
<style>
a {
  display:block;
}
</style>`,
			fixed: `
<style>
  a {
    display:block;
  }
</style>`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(`2 spaces`),
				},
				{
					line: 5,
					column: 1,
					message: messages.expected(`2 spaces`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`4 spaces`),
				},
			],
		},
		{
			description: `an indented style element whose stylesheet stands two levels too deep`,
			code: `
  <style
    lang="less">
      a {
        display:block;
      }
  </style>`,
			fixed: `
  <style
    lang="less">
    a {
      display:block;
    }
  </style>`,
			warnings: [
				{
					line: 4,
					column: 7,
					message: messages.expected(`4 spaces`),
				},
				{
					line: 6,
					column: 7,
					message: messages.expected(`4 spaces`),
				},
				{
					line: 5,
					column: 9,
					message: messages.expected(`6 spaces`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [
		2,
		{
			baseIndentLevel: 1,
		},
	],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `a style element inside a head element, the stylesheet indented under both`,
			code: `
				<html>
				  <head>
				    <style>
				      a {
				        display: block;
				      }
				    </style>
				  </head>
				</html>
			`,
		},
		{
			description: `a style element inside a div, the stylesheet indented under it`,
			code: `
				<div>
				  <style>
				    a {
				      color: pink;
				    }
				  </style>
				</div>
			`,
		},
	],

	reject: [
		{
			description: `the same page with the rule left level with the style element`,
			code: `
				<html>
				  <head>
				    <style>
				    a {
					display: block;
				      }
				    </style>
				  </head>
				</html>
			`,
			fixed: `
				<html>
				  <head>
				    <style>
				      a {
				        display: block;
				      }
				    </style>
				  </head>
				</html>
			`,
			warnings: [
				{
					line: 4,
					column: 5,
					message: messages.expected(`6 spaces`),
				},
				{
					line: 5,
					column: 2,
					message: messages.expected(`8 spaces`),
				},
			],
		},
		{
			description: `the same div with the stylesheet at the left margin`,
			code: `
				<div>
				  <style>
				a {
				  color: pink;
					}
				  </style>
				</div>
			`,
			fixed: `
				<div>
				  <style>
				    a {
				      color: pink;
				    }
				  </style>
				</div>
			`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(`4 spaces`),
				},
				{
					line: 5,
					column: 2,
					message: messages.expected(`4 spaces`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`6 spaces`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [
		`tab`,
		{
			baseIndentLevel: 1,
		},
	],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `the same page indented with tabs`,
			code: `
				<html>
					<head>
						<style>
							a {
								display: block;
							}
						</style>
					</head>
				</html>
			`,
		},
		{
			description: `the same div indented with tabs`,
			code: `
				<div>
					<style>
						a {
							color: pink;
						}
					</style>
				</div>
			`,
		},
	],

	reject: [
		{
			description: `the same page with the rule left level with the style element`,
			code: `
				<html>
					<head>
						<style>
						a {
						display: block;
					     }
						</style>
					</head>
				</html>
			`,
			fixed: `
				<html>
					<head>
						<style>
							a {
								display: block;
							}
						</style>
					</head>
				</html>
			`,
			warnings: [
				{
					line: 4,
					column: 3,
					message: messages.expected(`3 tabs`),
				},
				{
					line: 6,
					column: 7,
					message: messages.expected(`3 tabs`),
				},
				{
					line: 5,
					column: 3,
					message: messages.expected(`4 tabs`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [
		`tab`,
		{
			baseIndentLevel: 3,
		},
	],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `a stylesheet indented three levels, which the base level asks for`,
			code: `
				<html>
					<head>
						<style>
									a {
										display: block;
									}
						</style>
					</head>
				</html>
			`,
		},
		{
			description: `a style element at the left margin whose stylesheet is indented three levels`,
			code: `
				<style>
							a {
								color: pink;
							}
				</style>
			`,
		},
	],

	reject: [
		{
			description: `a stylesheet left level with the style element where three levels are asked for`,
			code: `
				<style>
				a {
				color: pink;
				}
				</style>
			`,
			fixed: `
				<style>
							a {
								color: pink;
							}
				</style>
			`,
			warnings: [
				{
					line: 2,
					column: 1,
					message: messages.expected(`3 tabs`),
				},
				{
					line: 4,
					column: 1,
					message: messages.expected(`3 tabs`),
				},
				{
					line: 3,
					column: 1,
					message: messages.expected(`4 tabs`),
				},
			],
		},
	],
})
