import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import postcss from "postcss"
import postcssLess from "postcss-less"
import postcssScss from "postcss-scss"

import isStandardSyntaxDeclaration from "./isStandardSyntaxDeclaration.js"

describe(`isStandardSyntaxDeclaration`, () => {
	it(`standard prop and value`, () => {
		equal(isStandardSyntaxDeclaration(decl(`a { a: b }`)), true)
	})

	it(`standard prop and scss var`, () => {
		equal(isStandardSyntaxDeclaration(decl(`a { a: $b }`)), true)
	})

	it(`custom-property`, () => {
		equal(isStandardSyntaxDeclaration(decl(`a { --custom-property: x }`)), true)
	})

	it(`standard prop and calc value`, () => {
		equal(isStandardSyntaxDeclaration(decl(`a { a : calc(b + c) }`)), true)
	})

	it(`does not break @selector`, () => {
		equal(isStandardSyntaxDeclaration(decl(`@page { size: A4 }`)), true)
	})

	it(`property with scss variable interpolation (only)`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`a { #{$var}: 10px; }`)), true)
	})

	it(`property with scss variable interpolation (end)`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`a { prop#{$var}: 10px; }`)), true)
	})

	it(`property with scss variable interpolation (middle)`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`a { prop#{$var}erty: 10px; }`)), true)
	})

	it(`property with less variable interpolation (only)`, () => {
		equal(isStandardSyntaxDeclaration(lessDecl(`a { @{var}: 10px; }`)), true)
	})

	it(`property with less variable interpolation (end)`, () => {
		equal(isStandardSyntaxDeclaration(lessDecl(`a { prop@{var}: 10px; }`)), true)
	})

	it(`property with less variable interpolation (middle)`, () => {
		equal(isStandardSyntaxDeclaration(lessDecl(`a { prop@{var}erty: 10px; }`)), true)
	})

	it(`scss var`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`$var: b`)), false)
	})

	it(`scss var within namespace`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`namespace.$var: b`)), false)
	})

	it(`nested scss var within namespace`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`a { namespace.$var: b }`)), false)
	})

	it(`scss list`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`$list: (key: value, key2: value2)`)), false)
	})

	it(`scss map`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`$map: (value, value2)`)), false)
	})

	it(`nested scss var`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`a { $var: b }`)), false)
	})

	it(`nested scss list`, () => {
		equal(
			isStandardSyntaxDeclaration(scssDecl(`a { $list: (key: value, key2: value2) }`)),
			false,
		)
	})

	it(`scss nested property`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`a { border: { style: solid; } }`)), false)
	})

	it(`nested scss map`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`a { $map: (value, value2) }`)), false)
	})

	it(`less &:extend`, () => {
		equal(isStandardSyntaxDeclaration(lessDecl(`a { &:extend(b) }`)), false)
	})

	it(`less map`, () => {
		equal(isStandardSyntaxDeclaration(lessDecl(`@map: { key: value; }`)), false)
	})

	it(`less another map`, () => {
		equal(isStandardSyntaxDeclaration(lessDecl(`#my-map() { key: value; }`)), false)
	})

	it(`scss map declaration`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`$foo: (key: value, key2: value2)`)), false)
	})

	it(`scss map declaration with quotes`, () => {
		equal(
			isStandardSyntaxDeclaration(scssDecl(`$foo: ("key": value, "key2": value2)`)),
			false,
		)
	})

	it(`scss list declaration`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`$foo: (value, value2)`)), false)
	})

	it(`scss pure value in parentheses`, () => {
		equal(isStandardSyntaxDeclaration(scssDecl(`a { height: (0) }`)), true)
	})

	it(`scss complex value in parentheses`, () => {
		equal(
			isStandardSyntaxDeclaration(scssDecl(`a { height: (3px + 5px) * (2px + 4px) }`)),
			true,
		)
	})

	it(`supports root-level declarations`, () => {
		equal(isStandardSyntaxDeclaration(decl(`color: yellow;`)), true)
	})
})

function decl (css, parser = postcss) {
	let list = []

	parser.parse(css).walkDecls((d) => list.push(d))

	if (list.length === 1) {
		return list[0]
	}

	throw new Error(`Expected length 1, but ${list.length}`)
}

function scssDecl (css) {
	return decl(css, postcssScss)
}

function lessDecl (css) {
	return decl(css, postcssLess)
}
