import type { Declaration, Rule } from "postcss"
import postcssScss, { parse as parseScss } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { declarationColonSource } from "../../utils/declarationColonSource/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { moveDeclarationValueHeadIntoBetween } from "../../utils/moveDeclarationValueHeadIntoBetween/index.ts"

import { scss } from "./index.ts"

/** The least of a Stylelint result, which names no syntax; the declarations below all print a value, so no reader here goes past that. */
const RESULT = {} as unknown as PostcssResult

/**
 * Reads the first declaration of a stylesheet written in SCSS.
 * @param code - The stylesheet, whose first rule holds the declaration.
 * @returns That declaration.
 */
function firstDecl (code: string): Declaration {
	let rule = parseScss(code).first as Rule

	return rule.first as Declaration
}

describe(`the shared utils over the adapter's pair`, () => {
	it(`declarationColonSource reads the value spelled as the file spells it`, () => {
		expect(declarationColonSource(scss, firstDecl(`a { color:  //c\n!important; }`), RESULT)).toBe(`color:  //c\nxxx`)
	})

	it(`declarationString prints the spelled copy with the bang behind it`, () => {
		expect(declarationString(scss, firstDecl(`a { margin: 0 // c\n  1px !important }`))).toBe(`margin: 0 // c\n  1px !important`)
	})

	it(`moveDeclarationValueHeadIntoBetween takes the whitespace in front of an inline comment, the comment staying in the value`, () => {
		expect(move(`a { b:  //c\n!important; }`, 2)).toEqual({ printed: `a { b:  //c\n!important; }`, value: `//c\n`, between: `:  ` })
	})

	it(`moveDeclarationValueHeadIntoBetween takes the whole of that value, comment and all`, () => {
		expect(move(`a { b:  //c\n!important; }`, 6)).toEqual({ printed: `a { b:  //c\n!important; }`, value: ``, between: `:  //c\n` })
	})
})

/**
 * Reads the first declaration of a stylesheet written in SCSS, moves the head of its value, and says what came of it.
 * @param code - The stylesheet, whose first rule holds the declaration.
 * @param length - How many characters of the printed value to move.
 * @returns What the file prints, what the value now reads as, and what stands between the property and it.
 */
function move (code: string, length: number): {
	printed: string,
	value: string,
	between: string | undefined,
} {
	let root = parseScss(code)
	let decl = firstDecl(code)

	root.walkDecls((node) => {
		decl = node
	})

	moveDeclarationValueHeadIntoBetween(scss, decl, length)

	return { printed: decl.root().toResult({ syntax: postcssScss }).css, value: scss.read(decl), between: decl.raws.between }
}
