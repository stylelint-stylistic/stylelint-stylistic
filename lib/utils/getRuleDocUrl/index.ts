/**
 * Builds the URL of a rule's page on the documentation site — one page per rule, whatever namespace it is registered under, since the page is the rule's own README.
 * @param shortName - The rule's short name.
 * @returns The URL.
 */
export function getRuleDocUrl (shortName: string): string {
	return `https://stylelint-stylistic.github.io/rules/${shortName}`
}
