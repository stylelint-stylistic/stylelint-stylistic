import type { Syntax } from "../index.ts"
import { styled } from "../styled/index.ts"

/** The syntax of the core: plain CSS, which every rule of the plugin is written for. Until a custom syntax has a namespace of its own, the core reads it as well, so no root is refused yet — and the embedding of a styled template is still answered, borrowed from the `styled` namespace; the borrowing goes with the branch that turns the core away from styled templates. */
export let css: Syntax = {
	accepts: () => true,
	embedding: styled.embedding,
	valueEmbedsHostCode: styled.valueEmbedsHostCode,
}
