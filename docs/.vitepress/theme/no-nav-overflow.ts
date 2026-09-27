/** The part of the overflow engine the navbar calls on the controller it provides. */
interface NavOverflow {
	setContainerEl: (el: unknown) => unknown,
}

/**
 * Stands in for the engine the navbar provides: nothing is measured, so no unit of the bar is ever folded away.
 * @returns A controller that ignores the bar it is handed.
 */
export function provideNavOverflow (): NavOverflow {
	return { setContainerEl: () => null }
}

/**
 * Stands in for the engine every unit of the bar asks for: with none, a unit neither registers nor takes the `collapsed` class, and the `⋯` menu has nothing to hold and is not shown.
 * @returns No engine.
 */
export function useNavOverflow (): null {
	return null
}
