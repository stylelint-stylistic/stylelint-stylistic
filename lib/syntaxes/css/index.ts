import type { Syntax } from "../index.ts"

/** The syntax of the core: plain CSS, which every rule of the plugin is written for. Until a custom syntax has a namespace of its own, the core reads it as well, so no root is refused yet. */
export let css: Syntax = {
	accepts: () => true,
}
