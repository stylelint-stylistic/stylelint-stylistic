import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import valueParser from "postcss-value-parser"

import { isStandardSyntaxFunction } from "./index.js"

describe(`isStandardSyntaxFunction`, () => {
	it(`calc`, () => {
		equal(isStandardSyntaxFunction(getFunction(`calc(a + b)`)), true)
	})

	it(`url`, () => {
		equal(isStandardSyntaxFunction(getFunction(`url('x.css')`)), true)
	})

	it(`scss list`, () => {
		// as in $list: (list)
		equal(isStandardSyntaxFunction(getFunction(`(list)`)), false)
	})

	it(`scss map`, () => {
		// as in $map: (key: value)
		equal(isStandardSyntaxFunction(getFunction(`(key: value)`)), false)
	})

	it(`scss function in scss interpolation`, () => {
		equal(isStandardSyntaxFunction(getFunction(`#{darken(#fff, 0.2)}`)), false)
	})

	it(`CSS-in-JS interpolation`, () => {
		equal(isStandardSyntaxFunction(getFunction(`\${({ size }) => (size === "small") ? "0.8em" : "1em"}`)), false)
	})

	it(`CSS-in-JS syntax`, () => {
		equal(isStandardSyntaxFunction(getFunction(`\`calc(\${token.radiusBase} + 2px)\``)), false)
	})
})

function getFunction (declValue) {
	let functions = []

	valueParser(declValue).walk((valueNode) => {
		if (valueNode.type === `function`) functions.push(valueNode)
	})

	return functions[0]
}
