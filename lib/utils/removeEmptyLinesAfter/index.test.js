import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { parse } from "postcss"

import { removeEmptyLinesAfter } from "./index.js"

describe(`removeEmptyLineBefore`, () => {
	it(`removes single newline from the newline at the beginning`, () => {
		equal(run(`a {\n\n  }`, `\n`), `a {\n  }`)
	})

	it(`removes single newline from newline at the beginning with CRLF`, () => {
		equal(run(`a {\r\n\r\n  }`, `\r\n`), `a {\r\n  }`)
	})

	it(`removes single newline from newline at the end`, () => {
		equal(run(`a {\t\n\n}`, `\n`), `a {\t\n}`)
	})

	it(`removes single newline from newline at the end with CRLF`, () => {
		equal(run(`a {\t\r\n\r\n}`, `\r\n`), `a {\t\r\n}`)
	})

	it(`removes single newline from newline in the middle`, () => {
		equal(run(`a {  \n\n\t}`, `\n`), `a {  \n\t}`)
	})

	it(`removes single newline to newline in the middle with CRLF`, () => {
		equal(run(`a {  \r\n\r\n\t}`, `\r\n`), `a {  \r\n\t}`)
	})

	it(`removes two newlines if there are three newlines`, () => {
		equal(run(`a {\n\n\n  }`, `\n`), `a {\n  }`)
	})

	it(`removes two newlines if there are three newlines with CRLF`, () => {
		equal(run(`a {\r\n\r\n\r\n  }`, `\r\n`), `a {\r\n  }`)
	})

	it(`removes three newlines if there are four newlines`, () => {
		equal(run(`a {\n\n\n\n  }`, `\n`), `a {\n  }`)
	})

	it(`removes three newlines if there are four newlines with CRLF`, () => {
		equal(run(`a {\r\n\r\n\r\n\r\n  }`, `\r\n`), `a {\r\n  }`)
	})
})

function run (css, lineEnding) {
	let root = parse(css)

	removeEmptyLinesAfter(root.nodes[0], lineEnding)

	return root.toString()
}
