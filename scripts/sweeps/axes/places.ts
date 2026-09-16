/** Where a value of a stylesheet stands, for a sweep to place a text in every one of them. */

/** Where the text stands; two of the places are no code. */
const VALUE_PLACES: Record<string, (call: string) => string> = {
	value: (call) => `a { b: ${call} 1px; c: 2px }\n`,
	blockTail: (call) => `a { b: 1px ${call} }\n`,
	list: (call) => `a { b: 1px , ${call} , 2px; }\n`,
	grid: (call) => `a { grid-template-areas: "a b" ${call} "c d"; }\n`,
	atRule: (call) => `@import ${call} screen;\na { b: 1px; }\n`,
	media: (call) => `@media ( min-width: 1px ) and ( c: ${call} ) { a { b: 1px; } }\n`,
	comment: (call) => `/* ${call} */\na { b: 1px; }\n`,
	string: (call) => `a { b: "${call}" 1px; }\n`,
}

export { VALUE_PLACES }
