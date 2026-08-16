import { isRoot } from "../typeGuards/index.js"

/**
 * Checks whether a container holds the declarations of an inline `style` attribute of an HTML-like document.
 * @param {import('postcss').Container} container - The container node to check.
 * @returns {boolean} True if the container is the root of a `style` attribute, false otherwise.
 */
export function isInlineStyleAttribute (container) {
	if (!isRoot(container)) return false

	let { source } = container

	return Boolean(source && `inline` in source && source.inline)
}
