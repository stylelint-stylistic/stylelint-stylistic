import { rule } from 'postcss'
import { jest } from '@jest/globals'

import transformSelector from '../transformSelector'

test(`success`, () => {
	const warn = jest.fn()
	const result = { warn }
	const ruleNode = rule({ selector: `a, b > c` })
	const callback = jest.fn()

	expect(transformSelector(result, ruleNode, callback)).toBe(`a, b > c`)
	expect(warn).not.toHaveBeenCalled()
	expect(callback).toHaveBeenCalled()
})

test(`failure`, () => {
	const warn = jest.fn()
	const result = { warn }
	const ruleNode = rule({ selector: `a[}` })
	const callback = jest.fn()

	expect(transformSelector(result, ruleNode, callback)).toBeUndefined()
	expect(warn).toHaveBeenCalled()
	expect(callback).not.toHaveBeenCalled()
})
