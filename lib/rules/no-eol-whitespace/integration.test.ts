import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * Fixes one snippet in one pass under this rule and a rule taking stray semicolons out, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param thisRuleFirst - Whether this rule is listed first.
 * @param neighbor - The rule taking the semicolon out, and its setting.
 * @returns The file the pass left and how many warnings the pair has about it.
 */
async function fix (code: string, thisRuleFirst: boolean, neighbor: [string, unknown] = [`@stylistic/no-extra-semicolons`, true]): Promise<{
	code: string,
	warnings: number,
}> {
	let pair: [string, unknown][] = [[`@stylistic/no-eol-whitespace`, true], neighbor]
	let rules = Object.fromEntries(thisRuleFirst ? pair : pair.toReversed())
	let fixed = await stylelint.lint({ code, config: { plugins, rules }, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config: { plugins, rules } })

	return { code: fixed.code ?? code, warnings: read.results[0]?.warnings.length ?? 0 }
}

describe(`the whitespace in front of a stray semicolon the rule about extra semicolons takes out`, () => {
	// The semicolon is read as the whitespace it leaves, so the spaces in front of it are whitespace at the end of a line
	it(`is taken out in one pass in both orders, behind a rule's brace`, async () => {
		expect(await fix(`a {}  \n  ;\n`, true)).toEqual({ code: `a {}\n\n`, warnings: 0 })
		expect(await fix(`a {}  \n  ;\n`, false)).toEqual({ code: `a {}\n\n`, warnings: 0 })
	})

	it(`is taken out in one pass in both orders where a second semicolon stands in the raw behind`, async () => {
		expect(await fix(`a {}  \n  ;;\n`, true)).toEqual({ code: `a {}\n\n`, warnings: 0 })
		expect(await fix(`a {}  \n  ;;\n`, false)).toEqual({ code: `a {}\n\n`, warnings: 0 })
	})

	it(`is taken out in one pass in both orders in front of a block's closing brace`, async () => {
		expect(await fix(`a {\n  b: c;\n  ;\n}\n`, true)).toEqual({ code: `a {\n  b: c;\n\n}\n`, warnings: 0 })
		expect(await fix(`a {\n  b: c;\n  ;\n}\n`, false)).toEqual({ code: `a {\n  b: c;\n\n}\n`, warnings: 0 })
	})

	it(`is taken out in one pass in both orders where the semicolons stand against the brace with no other whitespace on the line`, async () => {
		expect(await fix(`a {} ;;\n`, true)).toEqual({ code: `a {}\n`, warnings: 0 })
		expect(await fix(`a {} ;;\n`, false)).toEqual({ code: `a {}\n`, warnings: 0 })
	})

	it(`is taken out in one pass in both orders in the stylesheet's tail`, async () => {
		expect(await fix(`@import "x";  \n  ;\n`, true)).toEqual({ code: `@import "x";\n\n`, warnings: 0 })
		expect(await fix(`@import "x";  \n  ;\n`, false)).toEqual({ code: `@import "x";\n\n`, warnings: 0 })
	})

	// The block's closing brace stands a line above the end PostCSS gives a rule with a free semicolon behind its brace, so the line of a semicolon in the block's tail is counted from the brace
	it(`is kept in front of a semicolon in a block's tail a disable comment keeps, where a free semicolon stands behind the brace on a later line`, async () => {
		let code = `x {\n\ta {\n\t\tb: c;\n\t/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n\t\t; \n\t}\n\n\t;\n}`
		let output = `x {\n\ta {\n\t\tb: c;\n\t/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n\t\t;\n\t}\n\n\n}`

		expect(await fix(code, true)).toEqual({ code: output, warnings: 0 })
		expect(await fix(code, false)).toEqual({ code: output, warnings: 0 })
	})

	it(`is taken out in one pass in both orders in front of a comment behind the last declaration, whose semicolons the rule about a trailing semicolon takes`, async () => {
		let neighbor: [string, unknown] = [`@stylistic/declaration-block-trailing-semicolon`, `never`]

		expect(await fix(`a {\n  b: c;\n  ;\n  /* x */\n}\n`, true, neighbor)).toEqual({ code: `a {\n  b: c\n\n  /* x */\n}\n`, warnings: 0 })
		expect(await fix(`a {\n  b: c;\n  ;\n  /* x */\n}\n`, false, neighbor)).toEqual({ code: `a {\n  b: c\n\n  /* x */\n}\n`, warnings: 0 })
	})
})

describe(`a stray semicolon the rule about extra semicolons takes out, standing at the end of a line`, () => {
	// The semicolon is read as absent, not as whitespace, so a line ending on it holds no whitespace at its end
	it(`draws no warning of this rule`, async () => {
		let rules = { "@stylistic/no-eol-whitespace": true, "@stylistic/no-extra-semicolons": true }
		let { results } = await stylelint.lint({ code: `a {}\n;\na {\n  b: c;;\n}\n`, config: { plugins, rules } })

		expect(results[0]?.warnings.filter(({ rule }) => rule === `@stylistic/no-eol-whitespace`)).toEqual([])
	})
})

describe(`a stray semicolon a disable comment keeps from the rule about extra semicolons, beside one that rule takes out on the next line`, () => {
	// This rule trims the line of the one taken out, which shortens the raw; the neighbor counts the semicolons' places by lines from the raw's end, so the one kept stays on the line the comment covers
	it(`is kept in both orders`, async () => {
		let code = `x {\n\ta {\n\t\tb: c;\n\t/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n\t\t;\n\t\t;\n\t}\n}\n`
		let output = `x {\n\ta {\n\t\tb: c;\n\t/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n\t\t;\n\n\t}\n}\n`

		expect(await fix(code, true)).toEqual({ code: output, warnings: 0 })
		expect(await fix(code, false)).toEqual({ code: output, warnings: 0 })
	})
})

describe(`the whitespace in front of a stray semicolon the rule about a trailing semicolon takes out behind a custom property or a bodiless at-rule, moving the comment between into it`, () => {
	let neighbor: [string, unknown] = [`@stylistic/declaration-block-trailing-semicolon`, `never`]

	// That rule writes the comments behind such a node into it, so the semicolons it took are read in the node's print rather than in the block's tail
	it.each([
		[`a {\n\t--x: 1; /* c */ ;\n}\n`, `a {\n\t--x: 1 /* c */\n}\n`],
		[`a {\n\t@apply x; /* c */ ;\n}\n`, `a {\n\t@apply x /* c */\n}\n`],
		[`a {\n\t--x: 1 !important; /* c */ ;\n}\n`, `a {\n\t--x: 1 !important /* c */\n}\n`],
	])(`is taken out in one pass in both orders in %j`, async (code, output) => {
		expect(await fix(code, true, neighbor)).toEqual({ code: output, warnings: 0 })
		expect(await fix(code, false, neighbor)).toEqual({ code: output, warnings: 0 })
	})

	// PostCSS prints `<!--` escaped, so the node's print parts from the file inside the node, where nothing was moved, and the semicolon the file still needs is read as it stands
	it.each([
		[`<style>\na {\n\t--x: "<!--" ;\n}\n</style>\n`, `postcss-html`],
		[`const a = styled.a\`\n\t--x: "<!--" ;\n\``, `postcss-styled-syntax`],
	])(`draws no warning alone where the print escapes the text in %j`, async (code, customSyntax) => {
		let rule = customSyntax === `postcss-styled-syntax` ? `@stylistic/styled/no-eol-whitespace` : `@stylistic/no-eol-whitespace`
		let result = await stylelint.lint({ code, customSyntax, config: { plugins, rules: { [rule]: true } } })

		expect(result.results[0]?.warnings).toEqual([])
	})
})

describe(`the whitespace ending a stylesheet's text behind its last node`, () => {
	// A custom property keeps the whitespace behind its value in the value, and the flag's raw keeps it behind an important flag; with nothing behind them it ends the attribute's text, where the check reads a line's end
	it.each([
		[`<a style="--x: 1 "></a>\n`, `<a style="--x: 1"></a>\n`],
		[`<a style="color: red; --x: 1 \t "></a>\n`, `<a style="color: red; --x: 1"></a>\n`],
		[`<a style="--x: 1 !important "></a>\n`, `<a style="--x: 1 !important"></a>\n`],
		[`<a style="--x: 1 /* c */ "></a>\n`, `<a style="--x: 1 /* c */"></a>\n`],
	])(`is taken out of %j`, async (code, output) => {
		let config = { plugins, rules: { "@stylistic/no-eol-whitespace": true } }
		let fixed = await stylelint.lint({ code, config, fix: true, customSyntax: `postcss-html` })
		let read = await stylelint.lint({ code: fixed.code ?? code, config, customSyntax: `postcss-html` })

		expect({ code: fixed.code, left: read.results[0]?.warnings.length }).toEqual({ code: output, left: 0 })
	})

	it(`is taken out in either order beside the rule asking for no trailing semicolon, which moves a comment and that whitespace into the custom property`, async () => {
		let neighbor: [string, unknown] = [`@stylistic/declaration-block-trailing-semicolon`, `never`]
		let code = `<a style="color: red; --x: 1; /* c */ "></a>\n`

		for (let thisRuleFirst of [true, false]) {
			let pair: [string, unknown][] = [[`@stylistic/no-eol-whitespace`, true], neighbor]
			let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
			// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
			let fixed = await stylelint.lint({ code, config, fix: true, customSyntax: `postcss-html` })

			expect(fixed.code).toBe(`<a style="color: red; --x: 1 /* c */"></a>\n`)
		}
	})
	it(`is taken out of a file ending on a custom property in either order beside the rule about the file's last break, which writes a break behind it`, async () => {
		let neighbor: [string, unknown] = [`@stylistic/no-missing-end-of-source-newline`, true]
		let code = `--x: 1 `

		for (let thisRuleFirst of [true, false]) {
			let pair: [string, unknown][] = [[`@stylistic/no-eol-whitespace`, true], neighbor]
			let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
			// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
			let fixed = await stylelint.lint({ code, config, fix: true })

			expect(fixed.code).toBe(`--x: 1\n`)
		}
	})

	it(`is written as the break the rule about the run behind the colon asks for where it is a custom property's whole value, in either order`, async () => {
		let neighbor: [string, unknown] = [`@stylistic/declaration-colon-newline-after`, `always`]
		let code = `--x: `

		for (let thisRuleFirst of [true, false]) {
			let pair: [string, unknown][] = [[`@stylistic/no-eol-whitespace`, true], neighbor]
			let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
			// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
			let fixed = await stylelint.lint({ code, config, fix: true })

			expect(fixed.code).toBe(`--x:\n`)
		}
	})

	it(`is left in front of the semicolon the rule asking for a trailing semicolon writes, in either order`, async () => {
		let neighbor: [string, unknown] = [`@stylistic/declaration-block-trailing-semicolon`, `always`]
		let code = `<a style="--x: 1 "></a>\n`

		for (let thisRuleFirst of [true, false]) {
			let pair: [string, unknown][] = [[`@stylistic/no-eol-whitespace`, true], neighbor]
			let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
			// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
			let fixed = await stylelint.lint({ code, config, fix: true, customSyntax: `postcss-html` })

			expect(fixed.code).toBe(`<a style="--x: 1 ;"></a>\n`)
		}
	})

	it(`is written as the space the rule about the run behind the colon asks for where it is a custom property's whole value, in either order`, async () => {
		let neighbor: [string, unknown] = [`@stylistic/declaration-colon-space-after`, `always`]
		let code = `<a style="--x: "></a>\n`

		for (let thisRuleFirst of [true, false]) {
			let pair: [string, unknown][] = [[`@stylistic/no-eol-whitespace`, true], neighbor]
			let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
			// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
			let fixed = await stylelint.lint({ code, config, fix: true, customSyntax: `postcss-html` })

			expect(fixed.code).toBe(code)
		}
	})

	it(`keeps a space a backslash escapes`, async () => {
		let config = { plugins, rules: { "@stylistic/no-eol-whitespace": true } }
		let fixed = await stylelint.lint({ code: `--x: a\\ `, config, fix: true })

		expect(fixed.code).toBe(`--x: a\\ `)
	})
})

describe(`a line a disable comment keeps the fix off`, () => {
	let alone = { plugins, rules: { "@stylistic/no-eol-whitespace": true } }

	// The fix of a warning on another line trims every line at once, and asks of each line whether the fix is kept off it
	it.each([
		[`behind a node`, `a {}  \n/* stylelint-disable-next-line */\nb {}  \nc {}  \n`, `a {}\n/* stylelint-disable-next-line */\nb {}  \nc {}\n`],
		[`of nothing but whitespace`, `a {}  \n/* stylelint-disable-next-line */\n  \n  \nc {}\n`, `a {}\n/* stylelint-disable-next-line */\n  \n\nc {}\n`],
		[`inside a value`, `a {  \n/* stylelint-disable-next-line */\n  b: c  \n    d;  \n}\n`, `a {\n/* stylelint-disable-next-line */\n  b: c  \n    d;\n}\n`],
		[`inside a selector`, `x {}  \n/* stylelint-disable-next-line */\na,  \nb {}\n`, `x {}\n/* stylelint-disable-next-line */\na,  \nb {}\n`],
		[`inside a comment`, `x {}  \n/* stylelint-disable-next-line */\n/* a  \n  b  */\n`, `x {}\n/* stylelint-disable-next-line */\n/* a  \n  b  */\n`],
		[`in front of a closing brace`, `a {  \n  b: c;\n/* stylelint-disable-next-line */\n  \n}\n`, `a {\n  b: c;\n/* stylelint-disable-next-line */\n  \n}\n`],
		[`ending the stylesheet`, `a {}  \n/* stylelint-disable-next-line */\n  `, `a {}\n/* stylelint-disable-next-line */\n  `],
		[`behind a disable comment on it`, `a {} /* stylelint-disable-line */  \nb {}  \n`, `a {} /* stylelint-disable-line */  \nb {}\n`],
		[`inside a range of this rule`, `a {}  \n/* stylelint-disable @stylistic/no-eol-whitespace */\nb {}  \n  \n/* stylelint-enable @stylistic/no-eol-whitespace */\nc {}  \n`, `a {}\n/* stylelint-disable @stylistic/no-eol-whitespace */\nb {}  \n  \n/* stylelint-enable @stylistic/no-eol-whitespace */\nc {}\n`],
	])(`keeps its end %s`, async (_, code, output) => {
		expect((await stylelint.lint({ code, config: alone, fix: true })).code).toBe(output)
	})

	// PostCSS ends the rule on a stray semicolon behind it, and its lines are read from the brace
	it.each([
		[`a {}  \n;  /* stylelint-disable-line */\nb {}  \n`, `a {}\n;  /* stylelint-disable-line */\nb {}\n`],
		[`/* stylelint-disable-next-line */\na {}  \n;  \nb {}\n`, `/* stylelint-disable-next-line */\na {}  \n;\nb {}\n`],
		[`a {\n  b: c;\n/* stylelint-disable-next-line */\n  \n}  \n;\nx {}  \n`, `a {\n  b: c;\n/* stylelint-disable-next-line */\n  \n}\n;\nx {}\n`],
	])(`keeps its end around a stray semicolon on the line behind a rule in %j`, async (code, output) => {
		expect((await stylelint.lint({ code, config: alone, fix: true })).code).toBe(output)
	})

	it(`keeps its end inside a style element`, async () => {
		let code = `<p>\n</p>\n<style>\na {}  \n/* stylelint-disable-next-line */\nb {}  \nc {}  \n</style>\n`

		expect((await stylelint.lint({ code, config: alone, fix: true, customSyntax: `postcss-html` })).code).toBe(`<p>\n</p>\n<style>\na {}\n/* stylelint-disable-next-line */\nb {}  \nc {}\n</style>\n`)
	})

	// The rule about empty lines listed first writes the run behind it with fewer breaks, and the run is read by rank against the file
	it(`keeps its end in both orders beside the rule about empty lines`, async () => {
		let code = `a {}  \n/* stylelint-disable-next-line */\nb {}  \n\n\n\nc {}  \n`

		expect(await fix(code, true, [`@stylistic/max-empty-lines`, 1])).toEqual({ code: `a {}\n/* stylelint-disable-next-line */\nb {}  \n\nc {}\n`, warnings: 0 })
		expect(await fix(code, false, [`@stylistic/max-empty-lines`, 1])).toEqual({ code: `a {}\n/* stylelint-disable-next-line */\nb {}  \n\nc {}\n`, warnings: 0 })
	})

	// A neighbor listed earlier takes breaks out of a value or a block's head, and the runs are read by rank against the file
	it.each([
		[`a {\n  b: f(1,  \n\n\n    2, /* stylelint-disable-line */  \n    3,  \n    4);\n}\n`, [`@stylistic/function-max-empty-lines`, 0], `a {\n  b: f(1,\n    2, /* stylelint-disable-line */  \n    3,\n    4);\n}\n`],
		[`a,  \n\n\nb, /* stylelint-disable-line */  \nc,  \nd {}`, [`@stylistic/selector-max-empty-lines`, 0], `a,\nb, /* stylelint-disable-line */  \nc,\nd {}`],
		[`a /* stylelint-disable-next-line */  \n{  \n\n\n\n  b: c;  \n}\n`, [`@stylistic/max-empty-lines`, 1], `a /* stylelint-disable-next-line */\n{  \n\n  b: c;\n}\n`],
	] as [string, [string, unknown], string][])(`keeps its end in both orders in %j beside %j`, async (code, neighbor, output) => {
		expect(await fix(code, true, neighbor)).toEqual({ code: output, warnings: 0 })
		expect(await fix(code, false, neighbor)).toEqual({ code: output, warnings: 0 })
	})
})
