import { isObject, isString } from "./validateTypes.js"

/**
 * Get the index of a declaration's value
 *
 * @param {import('postcss').Declaration} decl
 * @returns {number}
 */
export function declarationValueIndex (decl) {
	let raws = decl.raws
	let prop = raws.prop

	return [
		isObject(prop) && `prefix` in prop && prop.prefix,
		(isObject(prop) && `raw` in prop && prop.raw) || decl.prop,
		isObject(prop) && `suffix` in prop && prop.suffix,
		raws.between || `:`,
		raws.value && `prefix` in raws.value && raws.value.prefix,
	].reduce((/** @type {number} */ count, str) => {
		if (isString(str)) {
			return count + str.length
		}

		return count
	}, 0)
}
