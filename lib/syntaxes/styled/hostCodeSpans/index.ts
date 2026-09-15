import { createRequire } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"

import type { Document, Node } from "postcss"

import type { InterpolationSpan } from "../../../utils/findInterpolationSpans/index.ts"

/** What `postcss-styled-syntax` finds of a template: where its stylesheet opens in the file, and its interpolations' ranges there. */
type TemplateData = {
	rangeStart: number,
	interpolationRanges: InterpolationSpan[],
}

/** The function `postcss-styled-syntax` finds a file's templates with. */
type ParseJs = (code: string, opts?: { from?: string | undefined }) => TemplateData[]

/** The package's `parseJs` per place; `null` where the place has none. */
let parsers: Map<string, ParseJs | null> = new Map()

/** The interpolations' texts per template, keyed by where its stylesheet opens, per document. */
let documentTemplates: WeakMap<Document, Map<number, string[]>> = new WeakMap()

/**
 * Loads `parseJs` of `postcss-styled-syntax`, an optional package, from the stylesheet's directory first and the plugin's second; the package exports its parser alone, so the file is reached by its path.
 * @param from - The stylesheet's file.
 * @returns The function, or nothing.
 */
function styledParseJs (from?: string): ParseJs | undefined {
	for (let place of from === undefined ? [import.meta.url] : [pathToFileURL(from).href, import.meta.url]) {
		let known = parsers.get(place)

		if (known === undefined) {
			try {
				let load = createRequire(place)

				known = (load(path.join(path.dirname(load.resolve(`postcss-styled-syntax`)), `parseJs.js`)) as { parseJs: ParseJs }).parseJs
			}
			catch {
				known = null
			}

			parsers.set(place, known)
		}

		if (known) return known
	}

	return undefined
}

/**
 * Reads the texts of a template's interpolations off its file, as the parser found them.
 * @param node - A node of the template.
 * @returns The texts, or none where the file or its parser cannot be reached.
 */
function interpolationTexts (node: Node): string[] {
	let root = node.root()
	let document = root.parent
	let rangeStart = root.raws.styledSyntaxRangeStart

	if (document?.type !== `document` || typeof rangeStart !== `number` || !document.source?.input) return []

	let templates = documentTemplates.get(document as Document)

	if (!templates) {
		let { css, file, hasBOM } = document.source.input
		// PostCSS strips the byte order mark the parser counted its ranges with
		let code = hasBOM ? `\uFEFF${css}` : css

		templates = new Map((styledParseJs(file)?.(code, { from: file }) ?? []).map((template) => [template.rangeStart, template.interpolationRanges.map(({ start, end }) => code.slice(start, end))]))
		documentTemplates.set(document as Document, templates)
	}

	return templates.get(rangeStart) ?? []
}

/**
 * Finds the spans a styled template's interpolations take in a raw of one of its nodes.
 *
 * The parser files an interpolation into the raw whole, and keeps no record of where; a break inside one ends a line of JavaScript, so a rule reading the raw's last line read, and wrote into, a string of the host file. Each opening `${` of the raw is matched against the texts the package's own reading of the file found, the longest first. One matching none, where the package is out of reach or the raw was rewritten, is taken as host code to the raw's last brace, so no break inside the interpolations from there on is read or written, and the lines behind them still are.
 * @param text - The raw.
 * @param node - The node the raw belongs to.
 * @returns The spans, in the raw's coordinates.
 */
export function hostCodeSpans (text: string, node: Node): InterpolationSpan[] {
	let spans: InterpolationSpan[] = []
	let opening = text.indexOf(`\${`)

	if (opening < 0) return spans

	let texts = interpolationTexts(node).toSorted((a, b) => b.length - a.length)

	while (opening >= 0) {
		let at = opening
		let found = texts.find((interpolation) => text.startsWith(interpolation, at))

		if (!found) {
			// An interpolation ends in a brace, and nothing but whitespace and semicolons stands between two in a raw, so the last brace closes the run of them
			spans.push({ start: at, end: Math.max(text.lastIndexOf(`}`) + 1, at + 2) })
			break
		}

		spans.push({ start: at, end: at + found.length })
		opening = text.indexOf(`\${`, at + found.length)
	}

	return spans
}
