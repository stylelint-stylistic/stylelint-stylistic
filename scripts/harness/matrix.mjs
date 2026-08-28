/**
 * Builds the corpus of a sweep by multiplying axes.
 *
 * A sweep answers as well as its corpus is full, and every sweep so far spelled the same product of axes by hand — a comment, a break, another break, a tail — and forgot an axis each time review found the class it was blind to. So the product is written once here, and a corpus is a list of named axes plus a template that places one value of each. Every value carries a name, and a row's key is the names of the values that made it joined by a bar, so that a row can be read without the text and diffed across two sides.
 */

/**
 * Multiplies the axes and places each combination in the template.
 * @param {Record<string, Record<string, string>>} axes - Each axis under its name, and under each axis every value under its own name.
 * @param {(values: Record<string, string>) => string} template - Places one value of every axis, given by the axis names.
 * @returns {[string, string][]} Every combination, as the key made of the value names and the text the template gave.
 */
function multiply (axes, template) {
	let entries = Object.entries(axes)
	let rows = [[[], {}]]

	for (let [axis, values] of entries) {
		rows = rows.flatMap(([names, chosen]) => Object.entries(values).map(([name, value]) => [[...names, name], { ...chosen, [axis]: value }]))
	}

	return rows.map(([names, chosen]) => [names.join(`|`), template(chosen)])
}

/**
 * Places every value of a corpus in every environment, so that a shape is asked about wherever it can stand.
 * @param {[string, string][]} values - The values, keyed.
 * @param {Record<string, (value: string) => string>} environments - Each environment under its name, taking a value and giving the stylesheet it stands in.
 * @returns {[string, string][]} Every value in every environment, the environment's name in front of the value's key.
 */
function place (values, environments) {
	return Object.entries(environments).flatMap(([name, wrap]) => values.map(([key, value]) => [`${name}|${key}`, wrap(value)]))
}

export { multiply, place }
