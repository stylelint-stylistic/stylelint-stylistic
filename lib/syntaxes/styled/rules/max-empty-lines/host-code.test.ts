import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../../../vitest.helpers.ts"
import plugins from "../../../../index.ts"

/** A styled template whose interpolation holds a template literal of its own, broken over blank lines, beside a run of the stylesheet. */
const CODE = `const A = styled.div\`\n\tb: \${\`p\n\n\nq\`} d;\n\n\n\ttop: 0;\n\`\n`

describe(`@stylistic/styled/max-empty-lines`, () => {
	// The breaks of an interpolation end lines of the host file, so a run written there rewrites a string of the JavaScript; the check counting them is 1789957014
	it(`a run inside an interpolation, which stays as the file spells it while the run of the stylesheet beside it is written`, async () => {
		let options = { config: { plugins, rules: { "@stylistic/styled/max-empty-lines": 1 } }, customSyntax: `postcss-styled-syntax` }
		let checked = await stylelint.lint({ code: CODE, ...options })
		let run = await stylelint.lint({ code: CODE, fix: true, ...options })

		expect(pick(checked.results).warnings.map(({ line, column }) => [line, column])).toEqual([[4, 1], [7, 1]])
		expect(run.code).toBe(`const A = styled.div\`\n\tb: \${\`p\n\n\nq\`} d;\n\n\ttop: 0;\n\`\n`)
	})
})
