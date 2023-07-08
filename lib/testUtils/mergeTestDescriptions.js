import deepmerge from 'deepmerge'

/**
 * @param {...object} args
 * @returns {object}
 */
export default function mergeTestDescriptions (...args) {
	return deepmerge.all(args)
}
