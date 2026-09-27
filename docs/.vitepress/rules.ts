/** A rule as the list names it. */
export interface Rule {
	name: string,
	group: string,
	description: string,
	fixable: boolean,
}

/** What the filter of the rule list is set to: the text typed, which a rule answers by its name, its description or its group; whether a rule that fixes nothing is left out; and the one group a rule is admitted from, or an empty string for every group. */
export interface RuleFilter {
	query: string,
	group: string,
	fixableOnly: boolean,
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
 * @param filter - What the filter is set to.
 * @returns The rules that answer, in the order they were given.
 */
export function filterRules (rules: Rule[], filter: RuleFilter): Rule[] {
	let { query, group, fixableOnly } = filter
	let needle = plain(query).trim()

	return rules.filter((rule) => {
		if (fixableOnly && !rule.fixable) return false
		if (group !== `` && rule.group !== group) return false

		return needle === `` || plain(`${rule.name} ${rule.description} ${rule.group}`).includes(needle)
	})
}
