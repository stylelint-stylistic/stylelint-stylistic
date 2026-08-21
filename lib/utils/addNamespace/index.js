const NAMESPACE = `@stylistic`

/**
 * Prefixes a rule name with the plugin's namespace, which is how a config refers to the rule.
 * @param {string} ruleName - The rule's own name, as its directory spells it.
 * @returns {string} The namespaced name, `@stylistic/color-hex-case` and the like.
 */
export function addNamespace (ruleName) {
	return `${NAMESPACE}/${ruleName}`
}
