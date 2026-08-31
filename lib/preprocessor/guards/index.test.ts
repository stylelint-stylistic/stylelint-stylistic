import postcss, { type AtRule, type Comment, type Declaration, parse as parseCss, type Parser, type Rule } from "postcss"
import postcssScss, { parse as parseScss } from "postcss-scss"
import valueParser, { type FunctionNode } from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"

import { isStandardPreprocessorAtRule, isStandardPreprocessorComment, isStandardPreprocessorDeclaration, isStandardPreprocessorFunction, isStandardPreprocessorProperty, isStandardPreprocessorRule, isStandardPreprocessorSelector, isStandardPreprocessorValue } from "./index.ts"

describe(`isStandardPreprocessorAtRule`, () => {
	it(`non nested at-rules without quotes`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@charset UTF-8;`))).toBe(true)
	})

	it(`non nested at-rules with \`'\` quotes`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@charset 'UTF-8';`))).toBe(true)
	})

	it(`non nested at-rules with \`"\` quotes`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@charset "UTF-8";`))).toBe(true)
	})

	it(`non nested at-rules with \`'\` quotes and without space after name`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@charset'UTF-8';`))).toBe(true)
	})

	it(`non nested at-rules with \`"\` quotes and without space after name`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@charset"UTF-8";`))).toBe(true)
	})

	it(`non nested at-rules with function and without space after name`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@import url("fineprint.css") print;`))).toBe(true)
	})

	it(`nested at-rules`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@media (min-width: 100px) {};`))).toBe(true)
	})

	it(`nested at-rules with newline after name`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@media\n(min-width: 100px) {};`))).toBe(true)
	})

	it(`nested at-rules with windows newline after name`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@media\r\n(min-width: 100px) {};`))).toBe(true)
	})

	it(`nested at-rules without space after name`, () => {
		expect(isStandardPreprocessorAtRule(atRule(`@media(min-width: 100px) {};`))).toBe(true)
	})

	it(`ignore \`@content\` inside mixins space`, () => {
		let rules = scssAtRules(`@mixin mixin() { @content; };`)

		expect(rules.length).toBe(2)
		expect(rules.map((rule) => rule.name)).toStrictEqual([
			`mixin`,
			`content`,
		])
		expect(isStandardPreprocessorAtRule(pick(rules, 0))).toBe(true)
		expect(isStandardPreprocessorAtRule(pick(rules, 1))).toBe(false)
	})
})

/**
 * Reads every at-rule of a stylesheet.
 * @param code - The stylesheet.
 * @param parser - The syntax to read it with.
 * @returns The at-rules, in the order the walk meets them.
 */
function atRules (code: string, parser: { parse: Parser } = postcss): AtRule[] {
	let rules: AtRule[] = []

	parser.parse(code).walkAtRules((rule) => {
		rules.push(rule)
	})

	return rules
}

/**
 * Reads the first at-rule of a stylesheet.
 * @param code - The stylesheet.
 * @returns That at-rule.
 */
function atRule (code: string): AtRule {
	return pick(atRules(code))
}

/**
 * Reads every at-rule of a stylesheet written in SCSS.
 * @param code - The stylesheet.
 * @returns The at-rules.
 */
function scssAtRules (code: string): AtRule[] {
	return atRules(code, postcssScss)
}

describe(`isStandardPreprocessorComment`, () => {
	it(`standard single-line comment`, () => {
		expect(isStandardPreprocessorComment(cssComment(`/* foo */`))).toBe(true)
	})

	it(`standard multi-line comment`, () => {
		expect(isStandardPreprocessorComment(cssComment(`/*\n foo \n*/`))).toBe(true)
	})

	it(`SCSS inline comment`, () => {
		expect(isStandardPreprocessorComment(scssComment(`// foo`))).toBe(false)
	})
})

/**
 * Reads the first node of a stylesheet, which the cases spell as a comment.
 * @param code - The stylesheet.
 * @returns That comment.
 */
function cssComment (code: string): Comment {
	return parseCss(code).first as Comment
}

/**
 * Reads the first node of a stylesheet written in SCSS, which the cases spell as a comment.
 * @param code - The stylesheet.
 * @returns That comment.
 */
function scssComment (code: string): Comment {
	return parseScss(code).first as Comment
}

describe(`isStandardPreprocessorDeclaration`, () => {
	it(`standard prop and value`, () => {
		expect(isStandardPreprocessorDeclaration(decl(`a { a: b }`))).toBe(true)
	})

	it(`standard prop and scss var`, () => {
		expect(isStandardPreprocessorDeclaration(decl(`a { a: $b }`))).toBe(true)
	})

	it(`custom-property`, () => {
		expect(isStandardPreprocessorDeclaration(decl(`a { --custom-property: x }`))).toBe(true)
	})

	it(`standard prop and calc value`, () => {
		expect(isStandardPreprocessorDeclaration(decl(`a { a : calc(b + c) }`))).toBe(true)
	})

	it(`does not break @selector`, () => {
		expect(isStandardPreprocessorDeclaration(decl(`@page { size: A4 }`))).toBe(true)
	})

	it(`property with scss variable interpolation (only)`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { #{$var}: 10px; }`))).toBe(true)
	})

	it(`property with scss variable interpolation (end)`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { prop#{$var}: 10px; }`))).toBe(true)
	})

	it(`property with scss variable interpolation (middle)`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { prop#{$var}erty: 10px; }`))).toBe(true)
	})

	it(`scss var`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`$var: b`))).toBe(false)
	})

	it(`scss var within namespace`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`namespace.$var: b`))).toBe(false)
	})

	it(`nested scss var within namespace`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { namespace.$var: b }`))).toBe(false)
	})

	it(`scss list`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`$list: (key: value, key2: value2)`))).toBe(false)
	})

	it(`scss map`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`$map: (value, value2)`))).toBe(false)
	})

	it(`nested scss var`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { $var: b }`))).toBe(false)
	})

	it(`nested scss list`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { $list: (key: value, key2: value2) }`))).toBe(false)
	})

	it(`scss nested property`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { border: { style: solid; } }`))).toBe(false)
	})

	it(`nested scss map`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { $map: (value, value2) }`))).toBe(false)
	})

	it(`scss map declaration`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`$foo: (key: value, key2: value2)`))).toBe(false)
	})

	it(`scss map declaration with quotes`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`$foo: ("key": value, "key2": value2)`))).toBe(false)
	})

	it(`scss list declaration`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`$foo: (value, value2)`))).toBe(false)
	})

	it(`scss pure value in parentheses`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { height: (0) }`))).toBe(true)
	})

	it(`scss complex value in parentheses`, () => {
		expect(isStandardPreprocessorDeclaration(scssDecl(`a { height: (3px + 5px) * (2px + 4px) }`))).toBe(true)
	})

	it(`supports root-level declarations`, () => {
		expect(isStandardPreprocessorDeclaration(decl(`color: yellow;`))).toBe(true)
	})
})

/**
 * Reads the one declaration of a stylesheet.
 * @param css - The stylesheet.
 * @param parser - The syntax to read it with.
 * @returns That declaration.
 */
function decl (css: string, parser: { parse: Parser } = postcss): Declaration {
	let list: Declaration[] = []

	parser.parse(css).walkDecls((d) => {
		list.push(d)
	})

	let [first] = list

	if (first && list.length === 1) return first

	throw new Error(`Expected length 1, but ${list.length}`)
}

/**
 * Reads the one declaration of a stylesheet written in SCSS.
 * @param css - The stylesheet.
 * @returns That declaration.
 */
function scssDecl (css: string): Declaration {
	return decl(css, postcssScss)
}

describe(`isStandardPreprocessorProperty`, () => {
	it(`sass variable`, () => {
		expect(isStandardPreprocessorProperty(`$sass-variable`)).toBe(false)
	})
	it(`sass variable within namespace`, () => {
		expect(isStandardPreprocessorProperty(`namespace.$sass-variable`)).toBe(false)
	})
	it(`sass interpolation`, () => {
		expect(isStandardPreprocessorProperty(`#{$Attr}-color`)).toBe(false)
	})
	it(`single word`, () => {
		expect(isStandardPreprocessorProperty(`top`)).toBe(true)
	})
})

describe(`isStandardPreprocessorValue`, () => {
	it(`scss var`, () => {
		expect(isStandardPreprocessorValue(`$sass-variable`)).toBe(false)
	})
	it(`scss namespace`, () => {
		expect(isStandardPreprocessorValue(`namespace.$sass-variable`)).toBe(false)
	})
	it(`scss module function`, () => {
		expect(isStandardPreprocessorValue(`namespace.function-name(#fff, 0.2)`)).toBe(false)
	})
	it(`negative scss var`, () => {
		expect(isStandardPreprocessorValue(`-$sass-variable`)).toBe(false)
	})
	it(`positive scss var`, () => {
		expect(isStandardPreprocessorValue(`+$sass-variable`)).toBe(false)
	})
	it(`scss interpolation`, () => {
		expect(isStandardPreprocessorValue(`#{$var}`)).toBe(false)
	})
	it(`postcss-simple-vars interpolation`, () => {
		expect(isStandardPreprocessorValue(`$(var)`)).toBe(false)
	})
	it(`dimension`, () => {
		expect(isStandardPreprocessorValue(`10px`)).toBe(true)
	})
})

describe(`isStandardPreprocessorSelector`, () => {
	it(`SCSS placeholder`, () => {
		expect(isStandardPreprocessorSelector(`%foo`)).toBe(false)
	})
	it(`SCSS nested property`, () => {
		expect(isStandardPreprocessorSelector(`border:`)).toBe(false)
	})
	it(`SCSS interpolation`, () => {
		expect(isStandardPreprocessorSelector(`.n-#{$n}`)).toBe(false)
	})
	it(`type`, () => {
		expect(isStandardPreprocessorSelector(`a`)).toBe(true)
	})
	it(`a quoted attribute value reading like a placeholder`, () => {
		expect(isStandardPreprocessorSelector(`[title="%foo"]`)).toBe(true)
	})
})

describe(`isStandardPreprocessorRule`, () => {
	it(`a plain rule`, () => {
		expect(isStandardPreprocessorRule(firstRule(`a {}`))).toBe(true)
	})
	it(`a placeholder rule`, () => {
		expect(isStandardPreprocessorRule(firstRule(`%foo {}`))).toBe(false)
	})
	it(`scss nested properties`, () => {
		expect(isStandardPreprocessorRule(firstRule(`foo: {};`))).toBe(false)
	})
})

describe(`isStandardPreprocessorFunction`, () => {
	it(`scss list`, () => {
		// as in $list: (list)
		expect(isStandardPreprocessorFunction(getFunction(`(list)`))).toBe(false)
	})
	it(`scss map`, () => {
		// as in $map: (key: value)
		expect(isStandardPreprocessorFunction(getFunction(`(key: value)`))).toBe(false)
	})
	it(`scss function in scss interpolation`, () => {
		expect(isStandardPreprocessorFunction(getFunction(`#{darken(#fff, 0.2)}`))).toBe(false)
	})
	it(`calc`, () => {
		expect(isStandardPreprocessorFunction(getFunction(`calc(a + b)`))).toBe(true)
	})
})

/**
 * Reads the first node of a stylesheet, which the cases spell as a rule.
 * @param code - The stylesheet.
 * @returns That rule.
 */
function firstRule (code: string): Rule {
	return parseCss(code).first as Rule
}

/**
 * Reads the first call of a value.
 * @param declValue - The value.
 * @returns That call.
 */
function getFunction (declValue: string): FunctionNode {
	let functions: FunctionNode[] = []

	valueParser(declValue).walk((valueNode) => {
		if (valueNode.type === `function`) functions.push(valueNode)
	})

	return pick(functions)
}
