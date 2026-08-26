import { hasBlock } from "../hasBlock/index.js"
import { isAtRule } from "../typeGuards/index.js"

/**
 * Asks whether the node closing a block has swallowed the run standing in front of the closing brace.
 *
 * That run is the block's own `raws.after` everywhere but one place. An at-rule carrying neither a block nor a semicolon of its own — `@extend .b`, `@include foo`, a Less mixin call — runs to the closing brace, so PostCSS files everything standing between its parameters and that brace into the at-rule's `raws.between` and leaves the block's `raws.after` empty. A comment written in that stretch goes there with the whitespace and is no node of the block at all.
 *
 * Two things are ever printed behind that `raws.between`, and either of them means the run in front of the brace is not the whitespace that raw ends in. Both stringifiers spell the first: a semicolon, where the block's flag asks for one, and the whitespace behind that semicolon is the block's own raw however much of it there is. `postcss-less` spells the second: it reads an `!important` out of a mixin call — out of that and nothing else, whatever its stringifier would print for a variable or a function — and puts it behind the at-rule's `between` rather than in front of it. There the run belongs to neither raw, since the parser collects the whitespace of both sides of the flag into `between` and the stringifier writes all of it on one side, so the node is turned away and left exactly as it stands, which is [#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374).
 *
 * The block's own raw answers last, and says which raw is read rather than where the run stands. No parse of this shape puts anything but an empty string in it, so a raw holding more was filled by a fix that ran earlier in the same pass and emptied `raws.between` as it went — `declaration-block-trailing-semicolon` under `never` clears the flag and leaves the whitespace standing where it stood. A raw the block carries none of is refused for the reading it would spoil: PostCSS computes one of its own where a block carries none, and an empty string written in its place would take that default away.
 *
 * That rule asks a narrower question of its own for its `always` half, since what it needs there is the two halves of `raws.between` rather than the run alone: the semicolon it writes stands between the parameters and the run, so its fix hands the run over to the block instead of writing where the run already stands.
 * @param {import('postcss').Container} statement - The statement carrying the block.
 * @returns {boolean} True where the last node of the block holds that run.
 */
export function lastNodeHoldsTheBlockAfter (statement) {
	let last = statement.last

	if (!last || !isAtRule(last) || hasBlock(last)) return false

	return !statement.raws.semicolon && statement.raws.after === `` && !last.raws.important
}
