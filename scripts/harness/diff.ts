/** Compares two results of one run row by row, never by count: a row can change without leaving, or leave while another arrives, and the count stands still. */

/**
 * Diffs two results keyed alike.
 * @param base - The base rows, by key.
 * @param head - The branch rows, by key.
 * @returns The keys added, removed and changed, and the count of unchanged ones.
 */
function diff (base: Record<string, unknown>, head: Record<string, unknown>): {
	added: string[],
	removed: string[],
	changed: string[],
	same: number,
} {
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
 * Renders a diff as Markdown.
 * @param result - The diff.
 * @param base - The base rows, by key.
 * @param head - The branch rows, by key.
 * @param limit - Rows spelled out per list.
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
