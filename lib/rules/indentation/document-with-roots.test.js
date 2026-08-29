import { Document, Input, parse as postcssParse, stringify } from "postcss"

import { ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

/**
 * Parses a stylesheet into a root standing inside a document, the way a host syntax hands one over.
 * @param {string} source - The stylesheet.
 * @param {import('postcss').ProcessOptions} [opts] - The options of the parse.
 * @returns {import('postcss').Document} The document holding that one root.
 */
function parse (source, opts) {
	let doc = (new Document())
	let root = postcssParse(source, opts)

	let held = /** @type {import('postcss').Root & { document?: import('postcss').Document }} */ (root)

	held.parent = doc
	held.document = doc
	doc.nodes.push(root)
	doc.source = {
		input: new Input(source, opts),
		start: { line: 1, column: 1, offset: 0 },
	}

	return doc
}

testRule({
	ruleName,
	config: [2],

	// The library's declaration names a string alone, while it hands whatever it is given on to Stylelint, which takes a syntax object as readily as a package name
	customSyntax: /** @type {string} */ (/** @type {unknown} */ ({
		parse,
		stringify,
	})),

	accept: [
		{
			description: `a rule inside a document the custom syntax hands over as a root of its own`,
			code: `
				.foo {
				  color: hotpink;
				}
			`,
		},
	],

	reject: [],
})
