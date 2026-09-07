import { matchesStringOrRegExp } from "../matchesStringOrRegExp/index.ts"
import { isObject } from "../validateTypes/index.ts"

/**
 * Asks whether `options[propertyName]` holds a string or regex matching the input.
 * @param options - The options, or whatever stands there.
 * @param propertyName - The key of the secondary option read.
 * @param input - The value matched against the option.
 * @returns True on a match.
 */
export function optionsMatches (options: unknown, propertyName: string, input: unknown): boolean {
	if (!isObject(options)) return false

	// Already held to the rule's shapes by `validateOptions`
	let comparison = (options as Record<string, string | RegExp | (string | RegExp)[] | undefined>)[propertyName]

	return Boolean(comparison && typeof input === `string` && matchesStringOrRegExp(input, comparison))
}
