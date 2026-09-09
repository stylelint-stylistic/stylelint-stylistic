import { createRule } from "../../../../rules/max-line-length/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [20],

	accept: [
		// See #552
		{
			description: `an import whose name opens with an escape, the one escaped spelling PostCSS refuses and the Sass parser reads, and which dart-sass 1.104.0 compiles to an import: 23 - 7 = 16`,
			code: `@\\69 mport "a.css"; a{}`,
		},
	],

	reject: [
		{
			description: `an end-of-line comment over the limit`,
			code: `
				a {
				    // Lorem ipsum dolor sit amet. The comment Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium officia fugiat unde deserunt sit, tenetur! Incidunt similique blanditiis placeat ad quia possimus libero, reiciendis excepturi non esse deserunt a odit.
				}
			`,
			line: 2,
			column: 269,
			message: messages.expected(20),
		},
	],
})
