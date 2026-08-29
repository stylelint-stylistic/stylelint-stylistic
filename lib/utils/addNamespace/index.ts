const NAMESPACE = `@stylistic`

/**
 * Prefixes a rule name with the plugin's namespace, which is how a config refers to the rule.
 * @param ruleName - The rule's own name, as its directory spells it.
 * @returns The namespaced name, `@stylistic/color-hex-case` and the like.
 */
export function addNamespace (ruleName: string): string {
	return `${NAMESPACE}/${ruleName}`
}
