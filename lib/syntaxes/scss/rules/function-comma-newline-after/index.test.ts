import { createRule } from "../../../../rules/function-comma-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map, whose parentheses open no call`,
			code: `$map: (key: value, key2: value2)`,
		},
		{
			description: `an SCSS list, whose parentheses open no call either`,
			code: `$list: (value, value2)`,
		},
		{
			description: `an inline comment behind the comma, with the break behind the comment`,
			code: `
				a {
				  transform: translate(
				    1px, // line comment
				    1px
				  );
				}
			`,
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map broken in front of its comma`,
			code: `$map: (key: value\n, key2: value2)`,
		},
		{
			description: `an inline comment behind the comma of a multi-line call`,
			code: `
				a {
				  transform: translate(
				    1px, // line comment
				    1px
				  );
				}
			`,
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map broken behind its comma`,
			code: `$map: (key: value,\nkey2: value2)`,
		},
		{
			description: `a comment behind the whole declaration, on the same line`,
			code: `
				a {
				  transform: translate(1px, 1px); // line comment
				}
			`,
		},
	],
})
