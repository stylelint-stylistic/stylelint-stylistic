import type { Container } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_SEMICOLON } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.ts"
import { setBlockAfter } from "../setBlockAfter/index.ts"
import { straySemicolonsTaken, straySemicolonsTakenOwn } from "../straySemicolonsTaken/index.ts"

/**
 * Returns the raw in which PostCSS filed the stray semicolons behind the closing brace of a block's last node, with the run in front of them: that node's `raws.ownSemicolon`.
 * @param statement - The block's statement.
 * @returns The raw, or nothing where the last node has none.
 */
function ownSemicolonOfLast (statement: Container): string | undefined {
	let own = statement.last?.raws.ownSemicolon

	return typeof own === `string` && own !== `` ? own : undefined
}

/**
 * Returns the run between a block's last node and its closing brace as the file spells it: the block's final raw ({@link getBlockAfter}), behind the stray semicolons PostCSS filed with the run in front of them in the last node's `raws.ownSemicolon` where that node closes on a brace of its own.
 * @param syntax - The syntax the rule is built over, which reads the raw.
 * @param statement - The block's statement.
 * @returns The run, or undefined without a raw.
 */
export function getBlockTail (syntax: Syntax, statement: Container): string | undefined {
	let after = getBlockAfter(syntax, statement)
	let own = ownSemicolonOfLast(statement)

	return own === undefined ? after : own + (after ?? ``)
}

/**
 * Writes the run between a block's last node and its closing brace, parting it back into the two raws {@link getBlockTail} joins: the last node's `raws.ownSemicolon` through as many semicolons as it held, the block's final raw the rest. A write keeps the semicolons in their order, so the ones the last node held are the first ones written.
 * @param syntax - The syntax the rule is built over, which writes the raw.
 * @param statement - The block's statement.
 * @param tail - The run to write.
 */
export function setBlockTail (syntax: Syntax, statement: Container, tail: string): void {
	let own = ownSemicolonOfLast(statement)
	let last = statement.last

	if (own === undefined || !last) {
		setBlockAfter(syntax, statement, tail)

		return
	}

	let held = (own.match(EVERY_SEMICOLON) ?? []).length
	let end = [...tail.matchAll(EVERY_SEMICOLON)][held - 1]
	let cut = end === undefined ? 0 : end.index + 1

	last.raws.ownSemicolon = tail.slice(0, cut)
	setBlockAfter(syntax, statement, tail.slice(cut))
}

/**
 * Finds the stray semicolons of the run {@link getBlockTail} returns that a neighbor takes out in the same run: those of the last node's `raws.ownSemicolon` and those of the block's final raw, each as its own question answers, counted in the joined run.
 * @param statement - The block's statement.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The semicolons' indices in the run.
 */
export function blockTailTaken (statement: Container, result: PostcssResult): Set<number> {
	let own = ownSemicolonOfLast(statement)
	let after = lastNodeHoldsTheBlockAfter(statement) ? new Set<number>() : straySemicolonsTaken(statement, result)

	if (own === undefined || !statement.last) return after

	let shift = own.length

	return new Set([...straySemicolonsTakenOwn(statement.last, result), ...[...after].map((index) => index + shift)])
}
