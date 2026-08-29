import { isScssVariable } from "../isScssVariable/index.ts"
import { isRule } from "../typeGuards/index.ts"

/**
 * Checks whether a declaration is standard (i.e. not a preprocessor construct).
 * @param decl - The declaration node to check.
 * @returns True if the declaration is standard syntax, false otherwise.
 */
export function isStandardSyntaxDeclaration (decl: import("postcss").Declaration | import("postcss-less").Declaration): boolean {
	let prop = decl.prop
	let parent = decl.parent

	// SCSS var; covers map and list declarations
	if (isScssVariable(prop)) return false

	// Less var (e.g. @var: x), but exclude variable interpolation (e.g. @{var})
	if (prop[0] === `@` && prop[1] !== `{`) return false

	// Less map declaration
	if (parent && parent.type === `atrule` && parent.raws.afterName === `:`) return false

	// Less map (e.g. #my-map() { myprop: red; })
	if (parent && isRule(parent) && parent.selector && parent.selector.startsWith(`#`) && parent.selector.endsWith(`()`)) return false

	// Sass nested properties (e.g. border: { style: solid; color: red; })
	if (parent && isRule(parent) && parent.selector && parent.selector.at(-1) === `:` && parent.selector.slice(0, 2) !== `--`) return false

	// A Less `&:extend(...)`, which the parser splits at its colon: the property is `&` and the value is the extend call. A property `&` is nothing CSS has, whatever the value — the compiler reads an extend there and answers anything else, `&:EXTEND(.b)` and `& :extend(.b)` among it, with a syntax error — so the shape alone is the answer. The `extend` mark the syntax puts beside the node goes unasked: it is matched against the text of any value at all, quotes and all, so `b: "extend(x)"` and `b: myextend(y)` carried it too, though both are plain declarations Less compiles as they stand.
	if (prop === `&`) return false

	return true
}
