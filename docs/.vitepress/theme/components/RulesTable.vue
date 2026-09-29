<script setup lang="ts">
import { computed, ref } from "vue"

import { data as rules } from "../../rules.data.ts"
import { filterRules } from "../../rules.ts"

let query = ref(``)
let fixableOnly = ref(false)
let group = ref(``)

/** The groups in the order the list gives them. */
let groups = [...new Set(rules.map((rule) => rule.group))]

let shown = computed(() => filterRules(rules, { query: query.value, fixableOnly: fixableOnly.value, group: group.value }))
let shownCount = computed(() => `${shown.value.length}`.padStart(`${rules.length}`.length))
</script>

<template>
	<div class="rules">
		<div class="rules__filters">
			<input
				v-model="query"
				type="search"
				class="rules__query"
				placeholder="Filter rules…"
				aria-label="Filter rules"
			>
			<select
				v-model="group"
				class="rules__group"
				aria-label="Filter by thing"
			>
				<option value="">All things</option>
				<option v-for="name of groups" :key="name" :value="name">{{ name }}</option>
			</select>
			<button
				type="button"
				class="rules__chip"
				:class="{ 'rules__chip--on': fixableOnly }"
				:aria-pressed="fixableOnly"
				@click="fixableOnly = !fixableOnly"
			>
				fixable
			</button>
			<pre class="rules__count">{{ shownCount }} / {{ rules.length }}</pre>
		</div>

		<table class="rules__table">
			<colgroup>
				<col class="rules__column--name">
				<col>
				<col class="rules__column--thing">
				<col class="rules__column--fixable">
			</colgroup>
			<thead>
				<tr>
					<th scope="col">Rule</th>
					<th scope="col">Description</th>
					<th scope="col">Thing</th>
					<th scope="col">Fixable</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="rule of shown" :key="rule.name">
					<th scope="row" class="rules__name">
						<a :href="`/rules/${rule.name}`">{{ rule.name }}</a>
					</th>
					<td class="rules__description">{{ rule.description }}</td>
					<td class="rules__thing">{{ rule.group }}</td>
					<td>
						<span v-if="rule.fixable" class="rules__badge">fix</span>
					</td>
				</tr>
			</tbody>
		</table>

		<p v-if="shown.length === 0" class="rules__none">No rule answers to that.</p>
	</div>
</template>

<style scoped>
.rules {
	container-type: inline-size;
	margin: 24px 0;
	border: 1px solid var(--vp-c-border);
	border-radius: 14px;
	overflow: hidden;
}

.rules__filters {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
	padding: 18px;
	border-bottom: 1px solid var(--vp-c-divider);
}

.rules__query {
	flex: 1 1 220px;
	min-width: 0;
	border: 1px solid var(--vp-c-border);
	border-radius: 0.5em;
	padding-inline: 1em;
	padding-block: 0.5em;
	font-size: 0.875em;
	color: var(--vp-c-text-1);
	background: var(--vp-c-bg);
}

.rules__group {
	appearance: base-select;
	flex: 0 1 auto;
	min-inline-size: 0;
	border: 1px solid var(--vp-c-border);
	border-radius: 0.5em;
	padding-block: 0.5em;
	padding-inline: 1em 2em;
	font-size: 0.875em;
	background: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'><path d='m1 1 3 5 3-5' fill='%23888'/></svg>") no-repeat right 1cap center / 1cap;

	@supports not (appearance: base-select) {
		appearance: none;
	}

	&::picker(select) {
		appearance: base-select;
		padding: 0.5em;
		border-radius: 0.5em;
		border: 1px solid var(--vp-c-border);
		color: var(--vp-c-text-1);
		background-color: var(--vp-c-bg-elv);
	}

	&::picker-icon {
		display: none;
	}

	option {
		border-radius: 0.375em;
	}
}

.rules__chip {
	border-radius: 20px;
	padding: 7px 14px;
	font-size: 13px;
	font-weight: 500;
	color: var(--vp-c-text-2);
	background: var(--vp-c-bg-soft);
	transition: color 0.2s, background-color 0.2s;

	&:hover {
		color: var(--vp-c-text-1);
	}
}

.rules__chip--on {
	color: var(--vp-c-white);
	background: var(--vp-c-brand-2);

	&:hover {
		color: var(--vp-c-white);
		background: var(--vp-c-brand-3);
	}
}

.rules__count {
	margin-left: auto;
	font-family: var(--vp-font-family-mono);
	font-size: 12px;
	color: var(--vp-c-text-3);
}

/* The theme lays every table of a document out as a block, which drops the column widths and puts a margin under the panel. */
.rules__table {
	display: table;
	width: 100%;
	margin: 0;
	table-layout: fixed;
	border-collapse: collapse;
	font-size: 0.875em;
}

.rules__column--name {
	width: 30%;
}

.rules__column--fixable {
	width: 108px;
}

.rules__column--thing {
	width: 128px;
}

thead th {
	padding: 11px 18px;
	border: none;
	text-align: left;
	font-family: var(--vp-font-family-mono);
	font-size: 12px;
	font-weight: 400;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: var(--vp-c-text-3);
	background: var(--vp-c-bg-soft);
	border-bottom: 1px solid var(--vp-c-divider);
}

tbody tr:nth-child(even) {
	background: var(--vp-c-bg-soft);
}

/* The theme plates every header cell, which would colour the whole first column. */
tbody th {
	background: transparent;
}

tbody th,
tbody td {
	padding: 13px 18px;
	text-align: left;
	font-weight: 400;
	vertical-align: baseline;
	border: none;
	border-bottom: 1px solid var(--vp-c-divider);
}

tbody tr:last-child :is(th, td) {
	border-bottom: none;
}

.rules__name a {
	font-family: var(--vp-font-family-mono);
	color: var(--vp-c-brand-1);
	text-decoration: none;
	overflow-wrap: anywhere;

	&:hover {
		text-decoration: underline;
	}
}

.rules__description {
	color: var(--vp-c-text-2);
}

.rules__thing {
	font-size: 13px;
	color: var(--vp-c-text-3);
}

.rules__badge {
	display: inline-block;
	border-radius: 5px;
	padding: 3px 7px;
	font-family: var(--vp-font-family-mono);
	font-size: 11px;
	color: var(--vp-c-brand-1);
	background: var(--vp-c-brand-soft);
}

.rules__none {
	margin: 0;
	padding: 18px;
	color: var(--vp-c-text-2);
}

/* The table is as wide as the page lets it be, so the width to ask about is the table's own rather than the window's. */
@container (width < 620px) {
	.rules__table,
	colgroup,
	thead,
	tbody,
	tr,
	th,
	td {
		display: block;
	}

	thead {
		display: none;
	}

	tbody tr {
		padding: 12px 18px;
		border-bottom: 1px solid var(--vp-c-divider);
	}

	tbody th,
	tbody td {
		padding: 2px 0;
		border: none;
	}

	tbody td:empty {
		display: none;
	}
}
</style>
