<script lang="ts">
	import { base } from '$app/paths';
	import { addFlagToCountry, setGenusAndSpeciesItalic } from '$lib/functions';
	import { blur, fly } from 'svelte/transition';
	let { items = $bindable([]), structure = [] } = $props();

	let intersectionObserver: any;

	function ensureIntersectionObserver() {
		if (intersectionObserver) return;
		intersectionObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.target.tagName === 'THEAD') {
					if (entry.isIntersecting) {
						showHelperElements = false;
					} else if (entry.boundingClientRect.y < 0) {
						showHelperElements = true;
					}
				} else {
					if (entry.isIntersecting) {
						if (visibleNumber < items.length) {
							visibleNumber += 30;
							intersectionObserver.unobserve(entry.target);
						}
					}
				}
			});
		});
	}

	function viewport(element: any, abort: any) {
		// we only want the observer on the last Element, so we abort all but the last one i !== visibleItems.length - 1
		if (abort) return;
		ensureIntersectionObserver();

		intersectionObserver.observe(element);

		return {
			destroy() {
				intersectionObserver.unobserve(element);
			}
		};
	}

	const handleSort = (event: any, key: any) => {
		const i = event.target?.querySelector('i');

		const sort = (/** @type {string} */ key: any, /** @type {string} */ order: any) => {
			items = items.sort((a, b) => {
				if (order === 'asc') {
					if (a[key] < b[key]) return -1;
					if (a[key] > b[key]) return 1;
					return 0;
				} else {
					if (a[key] > b[key]) return -1;
					if (a[key] < b[key]) return 1;
					return 0;
				}
			});
		};

		if (i) {
			if (i.classList.contains('fa-sort')) {
				i.classList.remove('fa-sort');
				i.classList.add('fa-sort-up');
				// set 'fa-sort' to all other i
				const otherElements = document.querySelectorAll('.fa-sort-up, .fa-sort-down');
				otherElements.forEach((element) => {
					if (element !== i) {
						element.classList.remove('fa-sort-up', 'fa-sort-down');
						element.classList.add('fa-sort');
					}
				});
				sort(key, 'asc');
			} else if (i.classList.contains('fa-sort-up')) {
				i.classList.remove('fa-sort-up');
				i.classList.add('fa-sort-down');
				sort(key, 'desc');
			} else {
				i.classList.remove('fa-sort-down');
				i.classList.add('fa-sort');
				if (items[0].hasOwnProperty('score')) {
					sort('score', 'desc');
				} else {
					sort('Catalog_Number', 'desc');
				}
			}
		}
	};
	let visibleNumber = $state(30);

	let showHelperElements = $state(false);
	let table: any = $state();

	let visibleItems = $derived(items.slice(0, visibleNumber));
</script>

<div class="table-container" bind:this={table}>
	{#if showHelperElements}
		<button
			class="btn-icon variant-ghost-primary fixed top-24 right-6 z-50"
			onclick={() => {
				table.scrollIntoView({ behavior: 'smooth' });
			}}
			aria-label="Scroll to top of table"
			in:fly={{ x: 100 }}
			out:blur
		>
			<i class="fa-solid fa-arrows-up-to-line"></i>
		</button>
	{/if}
	<table class="table table-interactive !bg-primary-100">
		<thead use:viewport={false} class="!border-primary-800/20 !bg-primary-400">
			<tr>
				{#each structure as { key, label }}
					<th class="hover:cursor-pointer table-cell-fit" onclick={(e) => handleSort(e, key)}>
						{label} <i class="fa-solid pointer-events-none fa-sort"></i>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each visibleItems as row, i (row.Catalog_Number)}
				<tr
					class="!border-primary-800/20 even:!bg-primary-400/30"
					use:viewport={i !== visibleItems.length - 1}
				>
					{#each structure as { key }, j}
						<td class="table-cell-fit {j === 0 ? 'italic' : ''}">
							{#if j === 0}<i class="fa-solid fa-camera"></i>{/if}
							{#if row[key]}
								<a href={`${base}/item/${row.Catalog_Number}`}>
									{#if key === 'Country'}
										{@html addFlagToCountry(row[key])}
									{:else if key === 'Genus' || key === 'Species'}
										<span class="italic">{row[key]}</span>
									{:else if key === 'Accepted_Name'}
										{@html setGenusAndSpeciesItalic(row[key], row.Genus, row.Species)}
									{:else}
										{row[key]}
									{/if}
								</a>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
