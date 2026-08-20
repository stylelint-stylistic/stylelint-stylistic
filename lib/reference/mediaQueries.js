/**
 * The words that join the queries and the features of a media query list.
 *
 * None of them names a function, however a file spells one: `and(min-width: 1px)` is a feature written without the space the grammar asks for, and not a call whose arguments the rules should pass over.
 * @type {Set<string>}
 */
export let mediaQueryCombinators = new Set([`and`, `not`, `only`, `or`])
