/** The check a rule returns once it has its options: what Stylelint calls with the root of a stylesheet and the result to report into. `RuleBase` is what Stylelint types a rule's call signature by, and every rule of the plugin spells its return type through this one name. */
export type RuleCheck = ReturnType<import("stylelint").RuleBase>
