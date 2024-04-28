import { equal } from "node:assert/strict"
import { it } from "node:test"

import hasEmptyLine from "./hasEmptyLine.js"

it(`hasEmptyLine`, () => {
	equal(hasEmptyLine(`\n\n`), true)
	equal(hasEmptyLine(`\r\n\r\n`), true)
	equal(hasEmptyLine(`\n\n\n\n`), true)
	equal(hasEmptyLine(`\r\n\r\n\r\n\r\n`), true)
	equal(hasEmptyLine(`   \n\n`), true)
	equal(hasEmptyLine(`\n\n   \n\n`), true)
	equal(hasEmptyLine(`\n \n`), true)
	equal(hasEmptyLine(`\r\n \r\n`), true)
	equal(hasEmptyLine(`\n \n \n \n`), true)
	equal(hasEmptyLine(`\r \n\n r\n\r\n\r\n`), true)
	equal(hasEmptyLine(`   \n \n`), true)
	equal(hasEmptyLine(`\n \n   \n \n`), true)
	equal(hasEmptyLine(`\n\t\n`), true)
	equal(hasEmptyLine(`\n\t \n`), true)
	equal(hasEmptyLine(`\r\n\t\r\n`), true)
	equal(hasEmptyLine(`\n\t\n\n \t\n`), true)
	equal(hasEmptyLine(`\r\n\t\r\n\t\r\n\r\n`), true)
	equal(hasEmptyLine(`   \n\t\n`), true)
	equal(hasEmptyLine(`\n\t\n  \t  \n\n`), true)
	equal(hasEmptyLine(``), false)
	equal(hasEmptyLine(` `), false)
	equal(hasEmptyLine(`\t`), false)
	equal(hasEmptyLine(`\n`), false)
	equal(hasEmptyLine(`\r\n`), false)
})
