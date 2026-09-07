/**
 * Tests a value against each comparison.
 * @param value - The string tested.
 * @param comparison - A string, a RegExp, or a list of either to test against.
 * @returns The match, or false.
 */
function testAgainstStringOrRegExpOrArray (value: string, comparison: string | RegExp | Array<string | RegExp>): false | {
	match: string,
	pattern: (string | RegExp),
	substring: string,
} {
	if (!Array.isArray(comparison)) return testAgainstStringOrRegExp(value, comparison)

	for (let comparisonItem of comparison) {
		let testResult = testAgainstStringOrRegExp(value, comparisonItem)

		if (testResult) return testResult
	}

	return false
}

/**
 * Tests a value against one comparison.
 * @param value - The string tested.
 * @param comparison - A literal string, a RegExp, or a string spelled `/…/`.
 * @returns The match, or false.
 */
function testAgainstStringOrRegExp (value: string, comparison: string | RegExp): false | {
	match: string,
	pattern: (string | RegExp),
	substring: string,
} {
	if (comparison instanceof RegExp) {
		let match = value.match(comparison)

		return match ? { match: value, pattern: comparison, substring: match[0] || `` } : false
	}

	// A string spelled `/…/` or `/…/i` is a RegExp
	let firstComparisonChar = comparison[0]
	let lastComparisonChar = comparison.at(-1)
	let secondToLastComparisonChar = comparison.at(-2)

	let comparisonIsRegex = firstComparisonChar === `/` && (lastComparisonChar === `/` || (secondToLastComparisonChar === `/` && lastComparisonChar === `i`))

	let hasCaseInsensitiveFlag = comparisonIsRegex && lastComparisonChar === `i`

	if (comparisonIsRegex) {
		let valueMatch = hasCaseInsensitiveFlag ? value.match(new RegExp(comparison.slice(1, -2), `iu`)) : value.match(new RegExp(comparison.slice(1, -1), `u`))

		return valueMatch ? { match: value, pattern: comparison, substring: valueMatch[0] || `` } : false
	}

	return value === comparison ? { match: value, pattern: comparison, substring: value } : false
}

/**
 * Compares a string, or any of several, to a comparison.
 * @param input - The string or strings.
 * @param comparison - A string, a RegExp, or a list of either to test against.
 * @returns The match, or false.
 */
export function matchesStringOrRegExp (input: string | Array<string>, comparison: string | RegExp | Array<string | RegExp>): false | {
	match: string,
	pattern: (string | RegExp),
	substring: string,
} {
	if (!Array.isArray(input)) return testAgainstStringOrRegExpOrArray(input, comparison)

	for (let inputItem of input) {
		let testResult = testAgainstStringOrRegExpOrArray(inputItem, comparison)

		if (testResult) return testResult
	}

	return false
}
