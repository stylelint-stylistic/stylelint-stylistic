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

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [10],

	accept: [
		{
			// See #656
			description: `a use whose line is its module's address and little more, which Sass loads as an import loads its file: 37 - 31 = 6`,
			code: `@use "aaaaaaaaaaaaaaaaaaaaaaaa.scss";`,
		},
		{
			// See #656
			description: `a forward in the same shape: 37 - 27 = 10`,
			code: `@forward "aaaaaaaaaaaaaaaaaaaa.scss";`,
		},
	],

	reject: [
		{
			// See #656
			description: `a use spelled in upper case, which dart-sass passes through as plain CSS and loads nothing by`,
			code: `@USE "aaaaaaaaaaaaaaaaaaaaaaaa.scss";`,
			line: 1,
			column: 37,
			message: messages.expected(10),
		},
		{
			// See #656
			description: `an at-rule whose name only begins with the letters of a use, whose string names no module`,
			code: `@usex "aaaaaaaaaaaaaaaaaaaa.scss";`,
			line: 1,
			column: 34,
			message: messages.expected(10),
		},
	],
})
