import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import type { Rule } from "./rules.ts"

/** The hand-written rule list, which the registry test guards: every rule is named there, under the heading of the thing it applies to, and a rule that fixes what it reports carries the mark. */
export const RULES_LIST = fileURLToPath(new URL(`../user-guide/rules.md`, import.meta.url))

/** The heading of a group in the rule list, and the entry of a rule under it: the name, the description, and the mark a fixing rule carries. The prose is bound, so every space of an entry is matched as whitespace. */
const RULE_GROUP_HEADING = /^## (.+)$/u
const RULE_ENTRY = /^- \[`([a-z-]+)`\]\([^)]+\):\s(.+?)(\s\(Autofixable\))?\.$/u

/**
 * Reads the rules out of the hand-written list.
 * @returns One entry per rule, in the order the list names them.
 */
export function readRules (): Rule[] {
	let rules: Rule[] = []
	let group = ``

	for (let line of readFileSync(RULES_LIST, `utf8`).split(`\n`)) {
		let heading = RULE_GROUP_HEADING.exec(line)?.[1]

		if (heading !== undefined) {
			group = heading

			continue
		}

		let entry = RULE_ENTRY.exec(line)
		let name = entry?.[1]
		let description = entry?.[2]

		if (name !== undefined && description !== undefined) rules.push({ name, group, description, fixable: entry?.[3] !== undefined })
	}

	return rules
}
