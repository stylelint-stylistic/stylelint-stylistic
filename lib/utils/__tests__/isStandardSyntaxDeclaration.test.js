import postcss from 'postcss'
import postcssLess from 'postcss-less'
import postcssScss from 'postcss-scss'

import isStandardSyntaxDeclaration from '../isStandardSyntaxDeclaration'

describe(`isStandardSyntaxDeclaration`, () => {
	it(`standard prop and value`, () => {
		expect(isStandardSyntaxDeclaration(decl(`a { a: b }`))).toBe(true)
	})

	it(`standard prop and scss var`, () => {
		expect(isStandardSyntaxDeclaration(decl(`a { a: $b }`))).toBe(true)
	})

	it(`custom-property`, () => {
		expect(isStandardSyntaxDeclaration(decl(`a { --custom-property: x }`))).toBe(true)
	})

	it(`standard prop and calc value`, () => {
		expect(isStandardSyntaxDeclaration(decl(`a { a : calc(b + c) }`))).toBe(true)
	})

	it(`does not break @selector`, () => {
		expect(isStandardSyntaxDeclaration(decl(`@page { size: A4 }`))).toBe(true)
	})

	it(`property with scss variable interpolation (only)`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { #{$var}: 10px; }`))).toBe(true)
	})

	it(`property with scss variable interpolation (end)`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { prop#{$var}: 10px; }`))).toBe(true)
	})

	it(`property with scss variable interpolation (middle)`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { prop#{$var}erty: 10px; }`))).toBe(true)
	})

	it(`property with less variable interpolation (only)`, () => {
		expect(isStandardSyntaxDeclaration(lessDecl(`a { @{var}: 10px; }`))).toBe(true)
	})

	it(`property with less variable interpolation (end)`, () => {
		expect(isStandardSyntaxDeclaration(lessDecl(`a { prop@{var}: 10px; }`))).toBe(true)
	})

	it(`property with less variable interpolation (middle)`, () => {
		expect(isStandardSyntaxDeclaration(lessDecl(`a { prop@{var}erty: 10px; }`))).toBe(true)
	})

	it(`scss var`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`$var: b`))).toBe(false)
	})

	it(`scss var within namespace`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`namespace.$var: b`))).toBe(false)
	})

	it(`nested scss var within namespace`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { namespace.$var: b }`))).toBe(false)
	})

	it(`scss list`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`$list: (key: value, key2: value2)`))).toBe(false)
	})

	it(`scss map`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`$map: (value, value2)`))).toBe(false)
	})

	it(`nested scss var`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { $var: b }`))).toBe(false)
	})

	it(`nested scss list`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { $list: (key: value, key2: value2) }`))).toBe(
			false
		)
	})

	it(`scss nested property`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { border: { style: solid; } }`))).toBe(false)
	})

	it(`nested scss map`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { $map: (value, value2) }`))).toBe(false)
	})

	it(`less &:extend`, () => {
		expect(isStandardSyntaxDeclaration(lessDecl(`a { &:extend(b) }`))).toBe(false)
	})

	it(`less map`, () => {
		expect(isStandardSyntaxDeclaration(lessDecl(`@map: { key: value; }`))).toBe(false)
	})

	it(`less another map`, () => {
		expect(isStandardSyntaxDeclaration(lessDecl(`#my-map() { key: value; }`))).toBe(false)
	})

	it(`scss map declaration`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`$foo: (key: value, key2: value2)`))).toBe(false)
	})

	it(`scss map declaration with quotes`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`$foo: ("key": value, "key2": value2)`))).toBe(
			false
		)
	})

	it(`scss list declaration`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`$foo: (value, value2)`))).toBe(false)
	})

	it(`scss pure value in parentheses`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { height: (0) }`))).toBe(true)
	})

	it(`scss complex value in parentheses`, () => {
		expect(isStandardSyntaxDeclaration(scssDecl(`a { height: (3px + 5px) * (2px + 4px) }`))).toBe(
			true
		)
	})

	it(`supports root-level declarations`, () => {
		expect(isStandardSyntaxDeclaration(decl(`color: yellow;`))).toBe(true)
	})
})

function decl(css, parser = postcss) {
	const list = []

	parser.parse(css).walkDecls((d) => list.push(d))

	if (list.length === 1) {
		return list[0]
	}

	throw new Error(`Expected length 1, but ${ list.length }`)
}

function scssDecl(css) {
	return decl(css, postcssScss)
}

function lessDecl(css) {
	return decl(css, postcssLess)
}
