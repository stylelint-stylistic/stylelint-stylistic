/** A rule as the list names it. */
export interface Rule {
	name: string,
	group: string,
	description: string,
	fixable: boolean,
}

/**
 * Reads a text as the filter reads it: the prose of the list is bound with no-break spaces, which nobody types.
 * @param text - A text to match against, or the text typed.
 * @returns The text in lower case, with every no-break space a plain one.
 */
function plain (text: string): string {
	return text.replaceAll(`\u00A0`, ` `).toLowerCase()
}

/**
 * Narrows the rules to the ones the filter admits.
 * @param rules - Every rule of the list.
 * @param query - What is typed into the filter; a rule answers it by its name, its description or its group.
 * @param fixableOnly - Whether a rule that fixes nothing is left out.
 * @returns The rules that answer, in the order they were given.
 */
export function filterRules (rules: Rule[], query: string, fixableOnly: boolean): Rule[] {
	let needle = plain(query).trim()

	return rules.filter((rule) => {
		if (fixableOnly && !rule.fixable) return false

		return needle === `` || plain(`${rule.name} ${rule.description} ${rule.group}`).includes(needle)
	})
}
