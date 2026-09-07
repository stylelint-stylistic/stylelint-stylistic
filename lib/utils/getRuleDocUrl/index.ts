/**
 * Builds the URL of a rule's README.
 * @param shortName - The rule's short name.
 * @returns The URL.
 */
export function getRuleDocUrl (shortName: string): string {
	return `https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/lib/rules/${shortName}/README.md`
}
