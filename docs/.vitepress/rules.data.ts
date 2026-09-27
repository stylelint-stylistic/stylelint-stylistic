import { defineLoader } from "vitepress"

import { readRules, RULES_LIST } from "./readRules.ts"
import type { Rule } from "./rules.ts"

export declare const data: Rule[]

export default defineLoader({
	watch: [RULES_LIST],
	load: (): Rule[] => readRules(),
})
