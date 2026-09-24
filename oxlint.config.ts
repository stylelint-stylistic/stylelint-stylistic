import stylistic from "@firefoxic/oxlint-config/stylistic"
import syntactic from "@firefoxic/oxlint-config/syntactic"
import { defineConfig } from "oxlint"

// Everything the shared config says holds. What stands below is what this plugin has a reason of its own for, and each entry carries that reason.
export default defineConfig({
	"extends": [
		syntactic,
		stylistic,
	],
	"env": {
		node: true,
	},
	"globals": {
		createTestRule: `readonly`,
		createTestRuleConfig: `readonly`,
	},
	"rules": {
		// Off for the whole project: a type is declared where it is named and exported there, and a rule opens on what it is — its name, its messages and its `meta` — and closes on the implementation. The shared config turns the rule off in its syntactic part and on again in its stylistic one, which is read second and so wins; the entry stands here until a release of the config settles that.
		"import/exports-last": `off`,
	},
	"overrides": [
		{
			// Walkers written before the rule was on: the callback of `parsedValue.walk` in the two `function-parentheses-*-inside` rules, where eight all but identical branches of `primary` stand one after another. The ceiling is what the worst of them counts today, the one of `function-parentheses-space-inside`, so neither may grow, and it comes down as each is taken apart; `indentation` left the list when its walker was taken apart into modules.
			files: [
				`lib/rules/function-parentheses-newline-inside/index.ts`,
				`lib/rules/function-parentheses-space-inside/index.ts`,
			],
			rules: {
				complexity: [`error`, 27],
			},
		},
		{
			// Five walkers that were long before the bar was set. The ceiling is what the longest of them counts today.
			files: [
				`lib/rules/function-parentheses-space-inside/index.ts`,
				`lib/rules/no-eol-whitespace/index.ts`,
				`lib/rules/selector-attribute-brackets-space-inside/index.ts`,
				`lib/rules/string-quotes/index.ts`,
				`lib/utils/whitespaceChecker/index.ts`,
			],
			rules: {
				"max-lines-per-function": [
					`error`,
					{
						max: 173,
						skipComments: true,
						skipBlankLines: true,
					},
				],
			},
		},
	],
})
