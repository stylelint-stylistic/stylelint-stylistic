const NAMESPACE = `@stylistic`

/**
 * Prefixes a rule name with the plugin's namespace, and with the namespace of a syntax where the rule is registered under one, which is how a config refers to the rule.
 * @param ruleName - The rule's own name, as its directory spells it.
 * @param [namespace] - The syntax's segment, `scss` and the like; none for a rule of the core.
 * @returns The namespaced name, `@stylistic/color-hex-case` or `@stylistic/scss/color-hex-case`.
 */
export function addNamespace (ruleName: string, namespace?: string): string {
	return namespace ? `${NAMESPACE}/${namespace}/${ruleName}` : `${NAMESPACE}/${ruleName}`
}
