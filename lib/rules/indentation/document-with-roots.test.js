import { testRule } from "stylelint-test-rule-node"
import { Document, Input, parse as postcssParse, stringify } from "postcss"

import plugins from "../../index.js"
import { ruleName } from "./index.js"

function parse (source, opts) {
	let doc = (new Document)
	let root = postcssParse(source, opts)

	root.parent = doc
	root.document = doc
	doc.nodes.push(root)
	doc.source = {
		input: new Input(source, opts),
		start: { line: 1, column: 1, offset: 0 },
	}

	return doc
}

testRule({
	plugins,
	ruleName,
	config: [2],
	fix: true,
	customSyntax: {
		parse,
		stringify,
	},

	accept: [
		{
			code: `.foo {\n  color: hotpink;\n}`,
		},
	],

	reject: [],
})
