const NAMESPACE = `@stylistic`

/**
 * Prefixes a rule name with the plugin's namespace, and a syntax's where given.
 * @param ruleName - The rule's short name.
 * @param [namespace] - `scss` and the like.
 * @returns `@stylistic/color-hex-case` or `@stylistic/scss/color-hex-case`.
 */
export function addNamespace (ruleName: string, namespace?: string): string {
	return namespace ? `${NAMESPACE}/${namespace}/${ruleName}` : `${NAMESPACE}/${ruleName}`
}
