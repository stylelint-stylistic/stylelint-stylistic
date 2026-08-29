import { isRoot } from "../typeGuards/index.ts"

/**
 * Checks whether a container holds the declarations of an inline `style` attribute of an HTML-like document.
 * @param container - The container node to check.
 * @returns True if the container is the root of a `style` attribute, false otherwise.
 */
export function isInlineStyleAttribute (container: import("postcss").Container): boolean {
	if (!isRoot(container)) return false

	let { source } = container

	return Boolean(source && `inline` in source && source.inline)
}
