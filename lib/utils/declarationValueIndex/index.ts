import type { Declaration } from "postcss"

import { isObject, isString } from "../validateTypes/index.ts"

/**
 * Reads what a declaration spells in front of its value: the property as the file writes it, with what the parser took off it, and the run holding the colon.
 * @param decl - The declaration.
 * @returns The text.
 */
export function declarationValuePrefix (decl: Declaration): string {
	let raws = decl.raws
	let prop = raws.prop
	let prefix = ``

	let items = [
		isObject(prop) && `prefix` in prop && prop.prefix,
		(isObject(prop) && `raw` in prop && prop.raw) || decl.prop,
		isObject(prop) && `suffix` in prop && prop.suffix,
		raws.between || `:`,
		raws.value && `prefix` in raws.value && raws.value.prefix,
	]

	for (let str of items) if (isString(str)) prefix += str

	return prefix
}

/**
 * Gets the index a declaration's value opens at.
 * @param decl - The declaration.
 * @returns The index.
 */
export function declarationValueIndex (decl: Declaration): number {
	return declarationValuePrefix(decl).length
}
