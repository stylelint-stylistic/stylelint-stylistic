/** The check a rule returns once it has its options; `RuleBase` is Stylelint's type for a rule. */
import type { RuleBase } from "stylelint"

export type RuleCheck = ReturnType<RuleBase>
