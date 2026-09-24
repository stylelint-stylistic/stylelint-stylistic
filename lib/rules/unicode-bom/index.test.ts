import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import stylelint from "stylelint"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import plugins from "../../index.ts"
import { CHARSET_RULE_MESSAGE } from "../../utils/asksForTheCharsetRule/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `an empty stylesheet carrying a byte order mark`,
			code: `\uFEFF`,
		},
		{
			description: `a stylesheet opening with a byte order mark`,
			code: `\uFEFFa{}`,
		},
	],

	reject: [
		{
			description: `an empty stylesheet with no byte order mark`,
			code: ``,
			fixed: `\uFEFF`,
			message: messages.expected,
		},
		{
			description: `a stylesheet with no byte order mark`,
			code: `a{}`,
			fixed: `\uFEFFa{}`,
			message: messages.expected,
		},
		{
			description: `a stylesheet opening with a charset, which a mark would outrank, the file getting the warning asking for the core rule as well`,
			code: `@charset "utf-8";\na{}`,
			fixed: `@charset "utf-8";\na{}`,
			warnings: [
				{
					message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
				},
				{
					message: messages.contradicts,
				},
			],
		},
		{
			description: `the same charset in upper case and single quotes, whose spelling the core rule judges`,
			code: `@CHARSET 'utf-8';\na{}`,
			fixed: `@CHARSET 'utf-8';\na{}`,
			warnings: [
				{
					message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
				},
				{
					message: messages.contradicts,
				},
			],
		},
		{
			description: `a stylesheet opening with a mark and a charset behind it, which the option is wrong for all the same, since the mark keeps the declaration dead`,
			code: `\uFEFF@charset "utf-8";\na{}`,
			fixed: `\uFEFF@charset "utf-8";\na{}`,
			warnings: [
				{
					message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
				},
				{
					message: messages.contradicts,
				},
			],
		},
		{
			description: `a charset behind an empty first line, which is the first node all the same`,
			code: `\n@charset "utf-8";\na{}`,
			fixed: `\n@charset "utf-8";\na{}`,
			warnings: [
				{
					message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
				},
				{
					message: messages.contradicts,
				},
			],
		},
		{
			description: `a charset behind a rule, which is not the start of the file either`,
			code: `a{}\n@charset "utf-8";`,
			fixed: `\uFEFFa{}\n@charset "utf-8";`,
			warnings: [
				{
					message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
				},
				{
					message: messages.expected,
				},
			],
		},
		{
			description: `a charset nested in a rule, the same`,
			code: `a { @charset "utf-8"; }`,
			fixed: `\uFEFFa { @charset "utf-8"; }`,
			warnings: [
				{
					message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
				},
				{
					message: messages.expected,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `an empty stylesheet with no byte order mark`,
			code: ``,
		},
		{
			description: `a stylesheet with no byte order mark`,
			code: `a{}`,
		},
	],

	reject: [
		{
			description: `an empty stylesheet carrying a byte order mark`,
			code: `\uFEFF`,
			fixed: ``,
			message: messages.rejected,
		},
		{
			description: `a stylesheet opening with a byte order mark`,
			code: `\uFEFFa{}`,
			fixed: `a{}`,
			message: messages.rejected,
		},
		{
			description: `a mark in front of a charset, which the fix takes off, leaving the declaration to the core rule, whose warning the file gets as well`,
			code: `\uFEFF@charset "utf-8";\na{}`,
			fixed: `@charset "utf-8";\na{}`,
			warnings: [
				{
					message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
				},
				{
					message: messages.rejected,
				},
			],
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-html`,
	config: [`always`],

	accept: [
		{
			description: `a style attribute inside a document, which the rule passes over`,
			code: `<a style="color: red;"></a>`,
		},
		{
			description: `a mark inside a style attribute, passed over for the same reason`,
			code: `<a style="\uFEFFcolor: red;"></a>`,
		},
		{
			description: `an embedded stylesheet inside a document`,
			code: `<style>a{}</style>`,
		},
		{
			description: `a mark inside an embedded stylesheet`,
			code: `<style>\uFEFFa{}</style>`,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-html`,
	config: [`never`],

	accept: [
		{
			description: `a style attribute inside a document, which the rule passes over`,
			code: `<a style="color: red;"></a>`,
		},
		{
			description: `a mark inside a style attribute, passed over for the same reason`,
			code: `<a style="\uFEFFcolor: red;"></a>`,
		},
		{
			description: `an embedded stylesheet inside a document`,
			code: `<style>a{}</style>`,
		},
		{
			description: `a mark inside an embedded stylesheet`,
			code: `<style>\uFEFFa{}</style>`,
		},
	],
})

// The mark is in none of the text a rule reads, and Stylelint decides whether to write a fixed file by comparing texts, which stylelint/stylelint#9512 made read the mark; the harness models none of that, so the two writes and the two files left alone go through the linter and the file system
describe(`writing the mark to a file`, () => {
	let directory: string
	let file: string

	beforeEach(async () => {
		directory = await mkdtemp(path.join(tmpdir(), `unicode-bom-`))
		file = path.join(directory, `stylesheet.css`)
	})

	afterEach(async () => {
		await rm(directory, { recursive: true })
	})

	/**
	 * Writes a stylesheet, fixes it under the option, and reads it back.
	 * @param text - The stylesheet.
	 * @param primary - The option.
	 * @returns The file as the run left it.
	 */
	async function fixed (text: string, primary: string): Promise<string> {
		await writeFile(file, text)
		await stylelint.lint({ files: [file], fix: true, config: { plugins, rules: { [ruleName]: primary } } })

		return readFile(file, `utf8`)
	}

	it(`takes the mark off under never`, async () => {
		await expect(fixed(`\uFEFFa {}\n`, `never`)).resolves.toBe(`a {}\n`)
	})

	it(`writes the mark under always`, async () => {
		await expect(fixed(`a {}\n`, `always`)).resolves.toBe(`\uFEFFa {}\n`)
	})

	it(`leaves a marked file alone under always`, async () => {
		await expect(fixed(`\uFEFFa {}\n`, `always`)).resolves.toBe(`\uFEFFa {}\n`)
	})

	it(`writes nothing into a file opening with a charset under always`, async () => {
		await expect(fixed(`@charset "utf-8";\na {}\n`, `always`)).resolves.toBe(`@charset "utf-8";\na {}\n`)
	})
})
