import { isAtRule, isRule } from "./typeGuards.js"

/**
 * @param {import('postcss').Container} statement
 * @returns {string}
 */
export default function beforeBlockString (statement, { noRawBefore } = { noRawBefore: false }) {
	let result = ``

	let before = statement.raws.before || ``

	if (!noRawBefore) {
		result += before
	}

	if (isRule(statement)) {
		result += statement.selector
	} else if (isAtRule(statement)) {
		result += `@${statement.name}${statement.raws.afterName || ``}${statement.params}`
	} else {
		return ``
	}

	result += statement.raws.between || ``

	return result
}
