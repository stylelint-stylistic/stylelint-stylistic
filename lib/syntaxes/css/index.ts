import type { Root } from "postcss"

import type { Syntax } from "../index.ts"

/** The syntax of the core: plain CSS, which every rule of the plugin is written for. A styled template is the `styled` namespace's to read, so a root carrying that parser's mark is refused; every other root is still accepted, custom syntaxes without a namespace of their own included. */
export let css: Syntax = {
	accepts: (root: Root) => root.raws.styledSyntaxRangeStart === undefined,
	embedding: () => ({ indent: ``, multiline: false }),
	valueEmbedsHostCode: () => false,
}
