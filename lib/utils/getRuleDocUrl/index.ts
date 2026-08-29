/**
 * Constructs the URL for the documentation of a given stylelint rule based on its short name.
 * @param shortName - The short name of the stylelint rule.
 * @returns URL pointing to the rule's markdown documentation.
 */
export function getRuleDocUrl (shortName: string): string {
	return `https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/lib/rules/${shortName}/README.md`
}
