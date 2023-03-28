import { parse as parseCss } from 'postcss'
import { parse as parseLess } from 'postcss-less'
import { parse as parseScss } from 'postcss-scss'

import isStandardSyntaxComment from '../isStandardSyntaxComment'

describe(`isStandardSyntaxComment`, () => {
	test(`standard single-line comment`, () => {
		expect(isStandardSyntaxComment(css(`/* foo */`))).toBe(true)
	})

	test(`standard multi-line comment`, () => {
		expect(isStandardSyntaxComment(css(`/*\n foo \n*/`))).toBe(true)
	})

	test(`LESS inline comment`, () => {
		expect(isStandardSyntaxComment(less(`// foo`))).toBe(false)
	})

	test(`SCSS inline comment`, () => {
		expect(isStandardSyntaxComment(scss(`// foo`))).toBe(false)
	})
})

function css(code) {
	return parseCss(code).first
}

function less(code) {
	return parseLess(code).first
}

function scss(code) {
	return parseScss(code).first
}
