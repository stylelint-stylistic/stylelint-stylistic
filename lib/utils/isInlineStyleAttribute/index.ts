import type { Container } from "postcss"

import { isRoot } from "../typeGuards/index.ts"

/**
 * Whether a container is the root of an inline `style` attribute.
 * @param container - The node.
 * @returns True when it is.
 */
export function isInlineStyleAttribute (container: Container): boolean {
	if (!isRoot(container)) return false

	let { source } = container

	return Boolean(source && `inline` in source && source.inline)
}
