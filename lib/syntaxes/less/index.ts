import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { inlineCommentReading } from "../../preprocessor/readsInlineComments/index.ts"
import { css } from "../css/index.ts"
import type { Syntax } from "../index.ts"

/** The syntax of the `less` namespace: a stylesheet written in Less and parsed with `postcss-less`. The namespace is a superset of the core — plain CSS is read exactly as the core reads it, an embedded plain block of a page included — so a project holding both configures these rules alone for the files that carry Less. Until the core turns Less files away, the adapter borrows every answer from it: the Less lines still live in the shared utils, and they move here with that turning. */
export let less: Syntax = {
	...css,
	namespace: `less`,
	// A styled template is the styled namespace's whatever else holds; plain CSS — a file opened with no custom syntax at all — is accepted as the core accepts it; of the rest, the reading of a double slash tells the syntaxes apart: Less spells such a comment and keeps it in the text a rule reads, while `postcss-scss` spells one and keeps none, and a syntax spelling none reads the probe as plain CSS
	accepts (root: Root, result: PostcssResult): boolean {
		if (root.raws.styledSyntaxRangeStart !== undefined) return false

		if (result.stylelint?.config?.customSyntax === undefined) return true

		let reading = inlineCommentReading(root, result)

		return !reading.spells || reading.keeps
	},
}
