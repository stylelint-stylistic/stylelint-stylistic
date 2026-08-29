/**
 * Compares two results of one run, row by row and never by count.
 *
 * A row can change shape without leaving and leave while another arrives, and a count stands still through both. So the two sides are read as maps from a row's key to what the row holds, and the finding is three lists: the keys one side holds and the other does not, either way round, and the keys both hold under a different value.
 */

/**
 * Diffs two results keyed alike.
 * @param base - The rows of the base, by key.
 * @param head - The rows of the branch, by key.
 * @returns The keys the branch added, the keys it removed, the keys it changed, and how many it left as they were.
 */
function diff (base: Record<string, unknown>, head: Record<string, unknown>): { added: string[], removed: string[], changed: string[], same: number } {
	let added = []
	let removed = []
	let changed = []
	let same = 0

	for (let key of Object.keys(head)) {
		if (!(key in base)) {
			added.push(key)
			continue
		}

		if (JSON.stringify(base[key]) === JSON.stringify(head[key])) same += 1
		else changed.push(key)
	}

	for (let key of Object.keys(base)) if (!(key in head)) removed.push(key)

	return { added, removed, changed, same }
}

/**
 * Writes a diff as Markdown a reader can go through row by row.
 * @param result - The diff.
 * @param base - The rows of the base, by key.
 * @param head - The rows of the branch, by key.
 * @param limit - How many rows of each list to spell out.
 * @returns The Markdown.
 */
function render (result: ReturnType<typeof diff>, base: Record<string, unknown>, head: Record<string, unknown>, limit: number = 200): string {
	let lines = [`| | rows |`, `| --- | --- |`, `| same | ${result.same} |`, `| changed | ${result.changed.length} |`, `| added | ${result.added.length} |`, `| removed | ${result.removed.length} |`, ``]

	let sections: [string, string[], Record<string, unknown>[]][] = [[`Changed`, result.changed, [base, head]], [`Added`, result.added, [head]], [`Removed`, result.removed, [base]]]

	for (let [title, keys, sides] of sections) {
		if (keys.length === 0) continue

		lines.push(`## ${title}`, ``)

		for (let key of keys.slice(0, limit)) {
			lines.push(`### \`${key}\``, ``)

			for (let side of sides) lines.push(`\`\`\`json`, JSON.stringify(side[key], null, `\t`), `\`\`\``, ``)
		}

		if (keys.length > limit) lines.push(`… and ${keys.length - limit} more`, ``)
	}

	return `${lines.join(`\n`)}\n`
}

export { diff, render }
