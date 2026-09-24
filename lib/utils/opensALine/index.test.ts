import { parse, type Root } from "postcss"
import { expect, it } from "vitest"

import { opensALine } from "./index.ts"

/**
 * Parses a stylesheet and files the host code in front of it, as a host syntax does.
 * @param codeBefore - The host code, or nothing for a file of its own.
 * @returns The root.
 */
function rootBehind (codeBefore?: string): Root {
	let root = parse(`a {}`)

	if (codeBefore !== undefined) root.raws.codeBefore = codeBefore

	return root
}

it(`opensALine`, () => {
	expect(opensALine(rootBehind())).toBe(true)
	expect(opensALine(rootBehind(``))).toBe(true)
	expect(opensALine(rootBehind(`<style>\n`))).toBe(true)
	expect(opensALine(rootBehind(`<style>\r\n`))).toBe(true)

	expect(opensALine(rootBehind(`<style>`))).toBe(false)
	expect(opensALine(rootBehind(`<div style="`))).toBe(false)
	expect(opensALine(rootBehind(`const A = styled.div\``))).toBe(false)
})
