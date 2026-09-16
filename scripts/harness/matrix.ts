/**
 * Builds the corpus of a sweep by multiplying axes.
 *
 * Every sweep spelled the product by hand and forgot an axis. A row's key is its value names joined by a bar, so rows diff across two sides without their texts.
 */

/**
 * Multiplies the axes and places each combination in the template.
 * @param axes - Each axis under its name, each value under its own.
 * @param template - Places one value of every axis.
 * @returns Every combination as key and text.
 */
function multiply (axes: Record<string, Record<string, string>>, template: (values: Record<string, string>) => string): [string, string][] {
	let entries = Object.entries(axes)

	let rows: [string[], Record<string, string>][] = [[[], {}]]

	for (let [axis, values] of entries) {
		rows = rows.flatMap(([names, chosen]) => Object.entries(values).map(([name, value]) => [[...names, name], { ...chosen, [axis]: value }] as [string[], Record<string, string>]))
	}

	return rows.map(([names, chosen]) => [names.join(`|`), template(chosen)] as [string, string])
}

/**
 * Names a pair of values: an earlier axis's value beside the one being laid over the rows.
 * @param earlier - The position of the earlier axis.
 * @param a - Its value.
 * @param b - The value of the axis being laid.
 * @returns The pair's name in the set of uncovered pairs.
 */
function pairOf (earlier: number, a: number, b: number): string {
	return `${earlier}|${a}|${b}`
}

/**
 * Lists every pair an axis makes with the axes laid before it.
 * @param widths - How many values each axis has, in build order.
 * @param position - The axis being laid.
 * @returns The pairs, none covered yet.
 */
function pairsToCover (widths: number[], position: number): Set<string> {
	let pairs = new Set<string>()
	let count = widths[position] ?? 0

	for (let earlier = 0; earlier < position; earlier += 1) {
		for (let a = 0; a < (widths[earlier] ?? 0); a += 1) for (let b = 0; b < count; b += 1) pairs.add(pairOf(earlier, a, b))
	}

	return pairs
}

/**
 * Picks the value of the axis being laid that closes the most pairs in a row, the least used breaking a tie.
 * @param row - The row so far.
 * @param count - How many values the axis has.
 * @param uncovered - The pairs still open.
 * @param used - How often each value has been laid.
 * @returns The value.
 */
function bestValueFor (row: number[], count: number, uncovered: Set<string>, used: number[]): number {
	let best = 0
	let bestGain = -1

	for (let value = 0; value < count; value += 1) {
		let gain = row.filter((earlier, index) => uncovered.has(pairOf(index, earlier, value))).length

		if (gain > bestGain || (gain === bestGain && (used[value] ?? 0) < (used[best] ?? 0))) {
			best = value
			bestGain = gain
		}
	}

	return best
}

/**
 * Builds a row of its own for a pair no row closed, the other axes filled with whatever closes another pair with the same value.
 * @param pair - The pair, as `pairOf` names it.
 * @param widths - How many values each axis has, in build order.
 * @param position - The axis being laid.
 * @param uncovered - The pairs still open.
 * @returns The row, the laid axis's value last.
 */
function rowClosing (pair: string, widths: number[], position: number, uncovered: Set<string>): number[] {
	let [earlier = 0, a = 0, b = 0] = pair.split(`|`).map(Number)
	let row: number[] = []

	for (let index = 0; index < position; index += 1) {
		if (index === earlier) {
			row.push(a)
			continue
		}

		let width = widths[index] ?? 0
		let best = 0

		for (let value = 0; value < width; value += 1) if (uncovered.has(pairOf(index, value, b))) best = value

		row.push(best)
	}

	row.push(b)

	return row
}

/**
 * Lays one axis over the rows built so far: each row takes the value closing the most pairs, then a pair no row closed gets a row of its own.
 * @param rows - The rows, each holding a value per axis laid before; grown in place.
 * @param widths - How many values each axis has, in build order.
 * @param position - The axis being laid.
 */
function lay (rows: number[][], widths: number[], position: number): void {
	let count = widths[position] ?? 0
	let uncovered = pairsToCover(widths, position)
	let used = Array.from({ length: count }, () => 0)

	/**
	 * Marks the pairs a row closes as covered.
	 * @param row - The row, the laid axis's value last.
	 */
	function settle (row: number[]): void {
		let value = row[position] ?? 0

		for (let [index, earlier] of row.slice(0, position).entries()) uncovered.delete(pairOf(index, earlier, value))

		used[value] = (used[value] ?? 0) + 1
	}

	for (let row of rows) {
		row.push(bestValueFor(row, count, uncovered, used))
		settle(row)
	}

	while (uncovered.size > 0) {
		let [first = ``] = uncovered
		let row = rowClosing(first, widths, position, uncovered)

		settle(row)
		rows.push(row)
	}
}

/**
 * Covers every pair of values two axes make in a fraction of the rows `multiply` takes: the two widest axes are crossed whole, and every other axis is laid over those rows so that each of its values meets each value of every other axis at least once, with rows added only where that fails.
 *
 * A defect two axes make together is reached as surely as by the product; one that takes three values at once may not be. Which of the two a sweep wants is its author's to say, since the product of three wide axes costs more than a branch can wait for.
 * @param axes - Each axis under its name, each value under its own.
 * @param template - Places one value of every axis.
 * @returns Every chosen combination as key and text, the key spelling the axes in the order given.
 */
function cover (axes: Record<string, Record<string, string>>, template: (values: Record<string, string>) => string): [string, string][] {
	let names = Object.keys(axes)
	let values = names.map((axis) => Object.keys(axes[axis] ?? {}))

	// Built widest first, so that the first two axes are the product no covering can undercut
	let order = names.map((_, index) => index).toSorted((a, b) => (values[b]?.length ?? 0) - (values[a]?.length ?? 0) || a - b)
	let widths = order.map((axis) => values[axis]?.length ?? 0)
	let rows: number[][] = [[]]

	for (let position = 0; position < order.length; position += 1) {
		if (position < 2) rows = rows.flatMap((row) => Array.from({ length: widths[position] ?? 0 }, (_, value) => [...row, value]))
		else lay(rows, widths, position)
	}

	return rows.map((row) => {
		let chosen: Record<string, string> = {}
		let keys: string[] = []

		for (let [index, axis] of names.entries()) {
			let value = values[index]?.[row[order.indexOf(index)] ?? 0] ?? ``

			keys.push(value)
			chosen[axis] = axes[axis]?.[value] ?? ``
		}

		return [keys.join(`|`), template(chosen)] as [string, string]
	})
}

/**
 * Makes an axis whose values are the record's keys, for a template to look the record up by.
 * @param record - The record; only its keys are read.
 * @returns The keys, each under itself.
 */
function keysOf (record: Record<string, unknown>): Record<string, string> {
	return Object.fromEntries(Object.keys(record).map((key) => [key, key]))
}

/**
 * Places every value of a corpus in every environment.
 * @param values - The values, keyed.
 * @param environments - Each under its name, wrapping a value in a stylesheet.
 * @returns Every value in every environment, keyed by both.
 */
function place (values: [string, string][], environments: Record<string, (value: string) => string>): [string, string][] {
	return Object.entries(environments).flatMap(([name, wrap]) => values.map(([key, value]) => [`${name}|${key}`, wrap(value)] as [string, string]))
}

export { cover, keysOf, multiply, place }
