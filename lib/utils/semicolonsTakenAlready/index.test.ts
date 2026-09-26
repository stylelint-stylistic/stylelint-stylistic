import { parse } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { semicolonsTakenAlreadyIn } from "./index.ts"

describe(`semicolonsTakenAlreadyIn`, () => {
	it(`the semicolon no-extra-semicolons took out of a tail a rule listed earlier took breaks out of, where a disable comment keeps the other`, () => {
		let text = `a {}\n/* c */\n ;\n\n\n ;\n\n\n`
		let root = parse(text)

		// `max-empty-lines` wrote the tail, then `no-extra-semicolons` took the semicolon on line 6 out and left the one on line 3
		root.raws.after = `\n ;\n`

		expect([...semicolonsTakenAlreadyIn(root, `after`, text, result([{ start: 3, end: 3 }]))]).toEqual([19])
	})

	it(`what the walk finds where it finds as many as the raw lacks, and nothing past it where no live copy of that rule is listed`, () => {
		let text = `a {}\n/* c */\n ;\n ;\n`
		let root = parse(text)

		root.raws.after = `\n ;\n`

		expect([...semicolonsTakenAlreadyIn(root, `after`, text, result([]))]).toEqual([14])

		root = parse(`a {}\n/* c */\n ;\n\n\n ;\n\n\n`)
		root.raws.after = `\n ;\n`

		expect([...semicolonsTakenAlreadyIn(root, `after`, `a {}\n/* c */\n ;\n\n\n ;\n\n\n`, { stylelint: { config: { rules: {} } } } as unknown as PostcssResult)]).toEqual([])
	})

	it(`nothing from an empty block's tail, whose span opens at its brace and holds none of the semicolons of the file in front of it`, () => {
		let text = `a {\n  b: c\n  ;\n}\nd {}\n`
		let block = parse(text).last

		expect(block && [...semicolonsTakenAlreadyIn(block, `after`, text, result([]))]).toEqual([])
	})
})

/**
 * A result listing no-extra-semicolons alone.
 * @param disabled - The lines a disable comment for every rule keeps a fix off.
 * @returns The result.
 */
function result (disabled: { start: number, end: number }[]): PostcssResult {
	return { stylelint: { config: { rules: { "@stylistic/no-extra-semicolons": true } }, disabledRanges: { all: disabled } } } as unknown as PostcssResult
}
