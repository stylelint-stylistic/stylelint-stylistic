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

export { keysOf, multiply, place }
