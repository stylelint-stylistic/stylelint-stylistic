const namespace = `@stylistic`

/**
 * Appends a namespace to the provided rule name.
 *
 * @param {string} ruleName - The name of the rule to namespace
 * @return {string} Namespaced rule string
 */
export function addNamespace (ruleName) {
	return `${namespace}/${ruleName}`
}
