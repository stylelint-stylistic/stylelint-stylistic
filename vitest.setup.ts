import type { CreateTestRule, CreateTestRuleConfig } from "@morev/stylelint-testing-library"
import { createTestUtils } from "@morev/stylelint-testing-library"
import { assert, describe, expect, it } from "vitest"

import plugins from "./lib/index"

let { createTestRule, createTestRuleConfig } = createTestUtils({
	testFunctions: { assert, describe, expect, it },
	plugins,
	autoStripIndent: true,
	testCaseWithoutDescriptionAppearance: `case-index`,
	testGroupWithoutDescriptionAppearance: `line-in-file`,
	contextNewlineFallback: `lf`,
})

globalThis.createTestRule = createTestRule
globalThis.createTestRuleConfig = createTestRuleConfig

declare global {
	var createTestRule: CreateTestRule
	var createTestRuleConfig: CreateTestRuleConfig
}
