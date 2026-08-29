/**
 * Tests a value against a string, RegExp, or array of strings/RegExps.
 * @param value - The value to test.
 * @param comparison - The comparison value(s).
 * @returns False where nothing matched, or the match, the pattern it was made against and the substring it covers.
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
 * Tests a value against a string or RegExp.
 * @param value - The value to test.
 * @param comparison - The comparison value.
 * @returns False where nothing matched, or the match, the pattern it was made against and the substring it covers.
 */
function testAgainstStringOrRegExp (value: string, comparison: string | RegExp): false | {
	match: string,
	pattern: (string | RegExp),
	substring: string,
} {
	// If it's a RegExp, test directly
	if (comparison instanceof RegExp) {
		let match = value.match(comparison)

		return match ? { match: value, pattern: comparison, substring: match[0] || `` } : false
	}

	// Check if it's RegExp in a string
	let firstComparisonChar = comparison[0]
	let lastComparisonChar = comparison.at(-1)
	let secondToLastComparisonChar = comparison.at(-2)

	let comparisonIsRegex = firstComparisonChar === `/` && (lastComparisonChar === `/` || (secondToLastComparisonChar === `/` && lastComparisonChar === `i`))

	let hasCaseInsensitiveFlag = comparisonIsRegex && lastComparisonChar === `i`

	// If so, create a new RegExp from it
	if (comparisonIsRegex) {
		let valueMatch = hasCaseInsensitiveFlag ? value.match(new RegExp(comparison.slice(1, -2), `iu`)) : value.match(new RegExp(comparison.slice(1, -1), `u`))

		return valueMatch ? { match: value, pattern: comparison, substring: valueMatch[0] || `` } : false
	}

	// Otherwise, it's a string. Do a strict comparison
	return value === comparison ? { match: value, pattern: comparison, substring: value } : false
}

/**
 * Compares a string to a second value that, if it fits a certain convention, is converted to a regular expression before the comparison. If it doesn't fit the convention, then two strings are compared. Any strings starting and ending with `/` are interpreted as regular expressions.
 * @param input - The input string or array of strings to test.
 * @param comparison - The comparison value(s).
 * @returns False where nothing matched, or the match, the pattern it was made against and the substring it covers.
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
