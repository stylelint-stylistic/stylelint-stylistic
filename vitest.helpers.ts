/**
 * Takes one item out of a list a test knows to hold it, and says so where the list does not.
 * @param list - The items.
 * @param index - Which of them; the first where none is named.
 * @returns That item.
 */
export function pick<T> (list: readonly T[], index = 0): T {
	let item = list[index]

	if (item === undefined) throw new Error(`The list holds no item at ${index}`)

	return item
}
