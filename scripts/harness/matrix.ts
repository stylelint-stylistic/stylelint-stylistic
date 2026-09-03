/**
 * Builds the corpus of a sweep by multiplying axes.
 *
 * A sweep answers as well as its corpus is full, and every sweep so far spelled the same product of axes by hand — a comment, a break, another break, a tail — and forgot an axis each time review found the class it was blind to. So the product is written once here, and a corpus is a list of named axes plus a template that places one value of each. Every value carries a name, and a row's key is the names of the values that made it joined by a bar, so that a row can be read without the text and diffed across two sides.
 */

/**
 * Multiplies the axes and places each combination in the template.
 * @param axes - Each axis under its name, and under each axis every value under its own name.
 * @param template - Places one value of every axis, given by the axis names.
 * @returns Every combination, as the key made of the value names and the text the template gave.
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
 * Names the keys of a record as an axis whose values are the keys themselves, for a template to look the record up by.
 * @param record - Whatever the axis is spelled out in, most often the places or the layouts a corpus is built over; only its keys are read.
 * @returns The keys, each under itself.
 */
function keysOf (record: Record<string, unknown>): Record<string, string> {
	return Object.fromEntries(Object.keys(record).map((key) => [key, key]))
}

/**
 * Places every value of a corpus in every environment, so that a shape is asked about wherever it can stand.
 * @param values - The values, keyed.
 * @param environments - Each environment under its name, taking a value and giving the stylesheet it stands in.
 * @returns Every value in every environment, the environment's name in front of the value's key.
 */
function place (values: [string, string][], environments: Record<string, (value: string) => string>): [string, string][] {
	return Object.entries(environments).flatMap(([name, wrap]) => values.map(([key, value]) => [`${name}|${key}`, wrap(value)] as [string, string]))
}

export { keysOf, multiply, place }
