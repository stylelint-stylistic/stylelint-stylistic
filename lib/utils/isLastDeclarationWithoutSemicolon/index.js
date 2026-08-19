/**
 * Asks whether a declaration is the one its block ends on without a semicolon — the declaration none of the `declaration-block-semicolon-*` rules has anything to say about, since there is no semicolon to stand in front of or behind.
 *
 * PostCSS keeps the answer in the block's `raws.semicolon`, which speaks of the last node of the block that is not a comment. A comment standing between that node and the closing brace is a node of its own, and the last one, so the declaration is sought past the comments rather than read off `parent.last`. A nested rule or at-rule is not passed over the same way: the flag speaks of it then, and the declaration in front of it keeps its semicolon.
 * @param {import('postcss').Declaration} decl - The declaration to ask about.
 * @returns {boolean} True where the declaration closes its block with no semicolon behind it.
 */
export function isLastDeclarationWithoutSemicolon (decl) {
	let parent = decl.parent

	if (!parent || parent.raws.semicolon) return false

	let node = parent.last

	while (node && node.type === `comment`) node = node.prev()

	return node === decl
}
