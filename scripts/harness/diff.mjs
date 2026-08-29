/**
 * Compares two results of one run, row by row and never by count.
 *
 * A row can change shape without leaving and leave while another arrives, and a count stands still through both. So the two sides are read as maps from a row's key to what the row holds, and the finding is three lists: the keys one side holds and the other does not, either way round, and the keys both hold under a different value.
 */

/**
 * Diffs two results keyed alike.
 * @param {Record<string, unknown>} base - The rows of the base, by key.
 * @param {Record<string, unknown>} head - The rows of the branch, by key.
 * @returns {{ added: string[], removed: string[], changed: string[], same: number }} The keys the branch added, the keys it removed, the keys it changed, and how many it left as they were.
 */
function diff (base, head) {
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
 * @param {ReturnType<typeof diff>} result - The diff.
 * @param {Record<string, unknown>} base - The rows of the base, by key.
 * @param {Record<string, unknown>} head - The rows of the branch, by key.
 * @param {number} [limit] - How many rows of each list to spell out.
 * @returns {string} The Markdown.
 */
function render (result, base, head, limit = 200) {
	let lines = [`| | rows |`, `| --- | --- |`, `| same | ${result.same} |`, `| changed | ${result.changed.length} |`, `| added | ${result.added.length} |`, `| removed | ${result.removed.length} |`, ``]

	/** @type {[string, string[], Record<string, unknown>[]][]} */
	let sections = [[`Changed`, result.changed, [base, head]], [`Added`, result.added, [head]], [`Removed`, result.removed, [base]]]

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
