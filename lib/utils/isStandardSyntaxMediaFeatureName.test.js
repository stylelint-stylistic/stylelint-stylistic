import { describe, it } from "node:test"
import { equal } from "node:assert/strict"

import isStandardSyntaxMediaFeatureName from "./isStandardSyntaxMediaFeatureName.js"

describe(`isStandardSyntaxMediaFeatureName`, () => {
	it(`keyword`, () => {
		equal(isStandardSyntaxMediaFeatureName(`min-width`), true)
	})
	it(`vendor prefixed keyword`, () => {
		equal(isStandardSyntaxMediaFeatureName(`-webkit-min-device-pixel-ratio`), true)
	})
	it(`custom media query`, () => {
		equal(isStandardSyntaxMediaFeatureName(`--viewport-medium`), true)
	})
	it(`scss var`, () => {
		equal(isStandardSyntaxMediaFeatureName(`$sass-variable`), false)
	})
	it(`scss var addition`, () => {
		equal(isStandardSyntaxMediaFeatureName(`min-width + $value`), false)
	})
	it(`scss var added to`, () => {
		equal(isStandardSyntaxMediaFeatureName(`$value + min-width`), false)
	})
	it(`scss var single quoted addition`, () => {
		equal(isStandardSyntaxMediaFeatureName(`'min-width + $value'`), false)
	})
	it(`scss var single quoted added to`, () => {
		equal(isStandardSyntaxMediaFeatureName(`'$value + min-width'`), false)
	})
	it(`scss var doubled quoted addition`, () => {
		equal(isStandardSyntaxMediaFeatureName(`"min-width + $value"`), false)
	})
	it(`scss var doubled quoted added to`, () => {
		equal(isStandardSyntaxMediaFeatureName(`"$value + min-width"`), false)
	})
	it(`scss interpolation`, () => {
		equal(isStandardSyntaxMediaFeatureName(`min-width#{$value}`), false)
	})
	it(`scss interpolation start`, () => {
		equal(isStandardSyntaxMediaFeatureName(`#{$value}min-width`), false)
	})
	it(`scss interpolation single quoted`, () => {
		equal(isStandardSyntaxMediaFeatureName(`'min-width#{$value}'`), false)
	})
	it(`scss interpolation single quoted start`, () => {
		equal(isStandardSyntaxMediaFeatureName(`'#{$value}min-width'`), false)
	})
	it(`scss interpolation double quoted`, () => {
		equal(isStandardSyntaxMediaFeatureName(`"min-width#{$value}"`), false)
	})
	it(`scss interpolation doubled quoted start`, () => {
		equal(isStandardSyntaxMediaFeatureName(`"#{$value}min-width"`), false)
	})
})
