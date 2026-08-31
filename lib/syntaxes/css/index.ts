import type { Root } from "postcss"

import { isStandardSyntaxAtRule } from "../../utils/isStandardSyntaxAtRule/index.ts"
import { isStandardSyntaxCombinator } from "../../utils/isStandardSyntaxCombinator/index.ts"
import { isStandardSyntaxComment } from "../../utils/isStandardSyntaxComment/index.ts"
import { isStandardSyntaxDeclaration } from "../../utils/isStandardSyntaxDeclaration/index.ts"
import { isStandardSyntaxFunction } from "../../utils/isStandardSyntaxFunction/index.ts"
import { isStandardSyntaxProperty } from "../../utils/isStandardSyntaxProperty/index.ts"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.ts"
import { isStandardSyntaxSelector } from "../../utils/isStandardSyntaxSelector/index.ts"
import { isStandardSyntaxValue } from "../../utils/isStandardSyntaxValue/index.ts"
import type { Syntax } from "../index.ts"

/** The syntax of the core: plain CSS, which every rule of the plugin is written for. A styled template is the `styled` namespace's to read, so a root carrying that parser's mark is refused; every other root is still accepted, custom syntaxes without a namespace of their own included. */
export let css: Syntax = {
	accepts: (root: Root) => root.raws.styledSyntaxRangeStart === undefined,
	embedding: () => ({ indent: ``, multiline: false }),
	valueEmbedsHostCode: () => false,
	isStandardAtRule: isStandardSyntaxAtRule,
	isStandardRule: isStandardSyntaxRule,
	isStandardDeclaration: isStandardSyntaxDeclaration,
	isStandardProperty: isStandardSyntaxProperty,
	isStandardValue: isStandardSyntaxValue,
	isStandardSelector: isStandardSyntaxSelector,
	isStandardFunction: isStandardSyntaxFunction,
	isStandardComment: isStandardSyntaxComment,
	isStandardCombinator: isStandardSyntaxCombinator,
}
