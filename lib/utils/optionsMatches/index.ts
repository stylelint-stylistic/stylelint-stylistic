import { matchesStringOrRegExp } from "../matchesStringOrRegExp/index.ts"
import { isObject } from "../validateTypes/index.ts"

/**
 * Checks if an options object's propertyName contains a user-defined string or regex that matches the passed in input.
 * @param options - The options object, or whatever stands where one is expected.
 * @param propertyName - The property name to check.
 * @param input - The input to match.
 * @returns True if a match is found, false otherwise.
 */
export function optionsMatches (options: unknown, propertyName: string, input: unknown): boolean {
	if (!isObject(options)) return false

	// What a user wrote under that name, which `validateOptions` has already held to the shapes the rule declares
	let comparison = (options as Record<string, string | RegExp | (string | RegExp)[] | undefined>)[propertyName]

	return Boolean(comparison && typeof input === `string` && matchesStringOrRegExp(input, comparison))
}
