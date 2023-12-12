import { describe, it } from "node:test"
import { deepEqual } from "node:assert/strict"

import mergeTestDescriptions from "../mergeTestDescriptions.js"

describe(`mergeTestDescriptions`, () => {
	it(`merges empty objects`, () => {
		deepEqual(mergeTestDescriptions({}, {}), {})
	})

	it(`merges objects`, () => {
		deepEqual(
			mergeTestDescriptions(
				{
					foo: {
						foo: `bar`,
						same: `foo`,
					},
				},
				{
					foo: {
						bar: `foo`,
						same: `bar`,
					},
				},
			),
			{
				foo: {
					foo: `bar`,
					bar: `foo`,
					same: `bar`,
				},
			},
		)
	})

	it(`merges object with arrays`, () => {
		deepEqual(
			mergeTestDescriptions(
				{
					accept: [
						{
							code: `foo`,
							description: `bar`,
						},
					],

					reject: [
						{
							code: `foo`,
							message: `bar`,
						},
					],
				},
				{
					accept: [
						{
							code: `bar`,
							description: `foo`,
						},
					],

					reject: [
						{
							code: `bar`,
							message: `foo`,
						},
					],
				},
			),
			{
				accept: [
					{
						code: `foo`,
						description: `bar`,
					},
					{
						code: `bar`,
						description: `foo`,
					},
				],
				reject: [
					{
						code: `foo`,
						message: `bar`,
					},
					{
						code: `bar`,
						message: `foo`,
					},
				],
			},
		)
	})
})
