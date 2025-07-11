import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import postcss from "postcss"
import postcssLess from "postcss-less"

import { isStandardSyntaxRule } from "./index.js"

function node (code, parser = postcss) {
	return parser.parse(code).first
}

function lessNode (code) {
	return node(code, postcssLess)
}

describe(`isStandardSyntaxRule`, () => {
	it(`type`, () => {
		equal(isStandardSyntaxRule(node(`a {}`)), true)
	})
	it(`when type selector before selector`, () => {
		equal(isStandardSyntaxRule(node(`when a {}`)), true)
	})
	it(`when type selector after selector`, () => {
		equal(isStandardSyntaxRule(node(`a when {}`)), true)
	})
	it(`pseudo-class`, () => {
		equal(isStandardSyntaxRule(node(`a:last-child {}`)), true)
	})
	it(`pseudo-class not`, () => {
		equal(isStandardSyntaxRule(node(`a:not(.a) {}`)), true)
	})
	it(`pseudo-element`, () => {
		equal(isStandardSyntaxRule(node(`a::after {}`)), true)
	})
	it(`custom-selector`, () => {
		equal(isStandardSyntaxRule(node(`:--custom-selector {}`)), true)
	})
	it(`compound custom-selectors`, () => {
		equal(isStandardSyntaxRule(node(`:--custom-selector:--custom-selector {}`)), true)
	})
	it(`custom-property-set`, () => {
		equal(isStandardSyntaxRule(node(`--custom-property-set: {}`)), false)
	})
	it(`scss nested properties`, () => {
		equal(isStandardSyntaxRule(node(`foo: {};`)), false)
	})
	it(`less class parametric mixin`, () => {
		equal(isStandardSyntaxRule(lessNode(`.mixin-name(@var) {}`)), false)
	})
	it(`non-outputting parametric Less class mixin definition`, () => {
		equal(isStandardSyntaxRule(lessNode(`.mixin-name() {}`)), false)
	})
	it(`non-outputting Less class mixin definition`, () => {
		equal(isStandardSyntaxRule(lessNode(`.mixin-name(@a, @b) {}`)), false)
	})
	it(`non-outputting parametric Less class mixin definition ending in number`, () => {
		equal(isStandardSyntaxRule(lessNode(`.mixin-name3(@a, @b) {}`)), false)
	})
	it(`non-outputting Less ID mixin definition`, () => {
		equal(isStandardSyntaxRule(lessNode(`#mixin-name() {}`)), false)
	})
	it(`less mixin`, () => {
		equal(isStandardSyntaxRule(lessNode(`.box-shadow(@style, @c) when (iscolor(@c)) {}`)), false)
	})
	it(`less extend`, () => {
		equal(isStandardSyntaxRule(lessNode(`&:extend(.inline) {}`)), false)
	})
	it(`less detached rulesets`, () => {
		equal(isStandardSyntaxRule(lessNode(`@foo: {};`)), false)
	})
	it(`less guarded namespaces`, () => {
		equal(isStandardSyntaxRule(lessNode(`#namespace when (@mode=huge) {}`)), false)
	})
	it(`less parametric mixins`, () => {
		equal(isStandardSyntaxRule(lessNode(`.mixin (@variable: 5) {}`)), false)
	})
	it(`mixin guards`, () => {
		equal(isStandardSyntaxRule(lessNode(`.mixin (@variable) when (@variable = 10px) {}`)), false)
	})
	it(`css guards`, () => {
		equal(isStandardSyntaxRule(lessNode(`.foo() when (@variable = true) {}`)), false)
	})
	it(`css guards without spaces`, () => {
		equal(isStandardSyntaxRule(lessNode(`.foo()when(@variable = true) {}`)), false)
	})
	it(`css guards with multiple spaces`, () => {
		equal(isStandardSyntaxRule(lessNode(`.foo()   when   (@variable = true) {}`)), false)
	})
	it(`css guards with newlines`, () => {
		equal(isStandardSyntaxRule(lessNode(`.foo()\nwhen\n(@variable = true) {}`)), false)
	})
	it(`css guards with CRLF`, () => {
		equal(isStandardSyntaxRule(lessNode(`.foo()\r\nwhen\r\n(@variable = true) {}`)), false)
	})
	it(`css guards with parenthesis`, () => {
		equal(isStandardSyntaxRule(lessNode(`.foo() when (default()) {}`)), false)
	})
	it(`css guards with not`, () => {
		equal(isStandardSyntaxRule(lessNode(`.foo() when not (@variable = true) {}`)), false)
	})
})
