<script lang="ts">
	import ContentContainer from '$lib/components/ContentContainer.svelte';
	import ItemList from '$lib/components/ItemList.svelte';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import MiniSearch from 'minisearch';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { miniSearch } from '$lib/stores.svelte.js';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import type { PageData, AdvancedSearch, Item, SearchQuery } from './types';

	let { data } = $props<{ data: PageData }>();

	export const snapshot = {
		capture: () => ({
			searchtext,
			advancedToggle,
			advancedFields
		}),
		restore: (value: {
			searchtext: string | AdvancedSearch;
			advancedToggle: boolean;
			advancedFields: Record<string, string>;
		}) => {
			advancedFields = value.advancedFields;
			searchtext = value.searchtext;
			advancedToggle = value.advancedToggle;
		}
	};

	let allDocumentsAdded = $state<Promise<void>>(Promise.resolve());
	let searchtext = $state<string | AdvancedSearch>('');
	let advancedToggle = $state(false);
	let advancedFields = $state<Record<string, string>>({});
	let filtereditems = $state<Item[]>(data?.items || []);
	let searching = $state(false);

	onMount(() => {
		if (!$miniSearch) {
			const CUSTOM_SPACE_OR_PUNCT =
				/[\n\r -#%-*,./:;?@[-\]_{}\u00A0\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+/u;

			$miniSearch = new MiniSearch({
				fields: data.categories,
				storeFields: data.categories,
				idField: data.categories[data.categories.length - 1],
				tokenize: (text: string) => text.split(CUSTOM_SPACE_OR_PUNCT),
				searchOptions: {
					fuzzy: false,
					prefix: true
				}
			});

			allDocumentsAdded = new Promise<void>((resolve) => {
				$miniSearch.addAllAsync(data.items, { chunkSize: 12000 }).then(() => {
					console.log('all documents added');
					resolve();
				});
			});
		} else if (!$miniSearch.documentCount) {
			allDocumentsAdded = new Promise<void>((resolve) => {
				$miniSearch.addAllAsync(data.items, { chunkSize: 12000 }).then(() => {
					console.log('all documents added');
					resolve();
				});
			});
		}
	});

	afterNavigate(() => {
		const searchParam = page.url.searchParams.get('s');
		const advancedParam = page.url.searchParams.get('a');

		if (searchParam) {
			console.log('searchtext', searchParam);
			searchtext = searchParam;
			page.url.searchParams.delete('s');
			history.replaceState(null, '', page.url.toString());
		} else if (advancedParam) {
			advancedToggle = true;
			advancedFields = JSON.parse(advancedParam);
			page.url.searchParams.delete('a');
			history.replaceState(null, '', page.url.toString());
		}
	});

	const asyncSearch = async (
		query: string | AdvancedSearch,
		config: Record<string, unknown> = {}
	): Promise<Item[]> => {
		return new Promise((resolve) => {
			const searchResults = $miniSearch.search(query, config);
			resolve(searchResults);
		});
	};

	$effect(() => {
		if (searchtext) {
			searching = true;
			allDocumentsAdded.then(async () => {
				const results = await asyncSearch(searchtext, {});
				filtereditems = results;
				searching = false;
			});
		} else {
			filtereditems = data?.items ?? [];
		}
	});

	$effect(() => {
		if (advancedToggle) {
			if (Object.values(advancedFields).some((i) => !!i)) {
				const queries: SearchQuery[] = [];

				Object.keys(advancedFields).forEach((key) => {
					if (advancedFields[key]) {
						queries.push({
							fields: [key],
							queries: [advancedFields[key]]
						});
					}
				});

				searchtext = {
					combineWith: 'AND',
					queries
				};
			} else {
				searchtext = '';
			}
		}
	});
</script>

<div class="px-8 pt-16 image-background h-[30vh]">
	<div class="container mx-auto text-white backdrop-blur-md rounded w-fit p-2">
		<h1 class="h1 font-bold tracking-wide drop-shadow-xl text-shadow">Herbarium Bernense</h1>
		<p class="text-lg font-semibold text-shadow">
			Herbarium of the Botanical Garden of the University of Bern
		</p>
	</div>
</div>

<ContentContainer>
	<div class="flex flex-col lg:flex-row gap-4 justify-between">
		<div class="lg:w-1/2 mb-4">
			<p class="p lg:text-xl">
				The Herbarium Bernense contains about 500,000 herbarium specimens, including type specimens
				and valuable historical collections. Currently about 10% of our collection is digitized and
				can be accessed here.
			</p>
		</div>
		<div class="lg:w-1/2">
			<div class="flex justify-between">
				<h2 class="h3 mb-3">Search and Filter</h2>
				<SlideToggle
					name="advanced-mode"
					active="bg-surface-300"
					bind:checked={advancedToggle}
					class="mb-3"
					onChange={() => {
						searchtext = '';
					}}
				>
					{advancedToggle ? 'Simple' : 'Advanced'}
				</SlideToggle>
			</div>
			{#if !advancedToggle}
				<label transition:slide>
					<input
						class="input p-6 placeholder-primary-600"
						type="text"
						placeholder="searchinput..."
						bind:value={searchtext}
					/>
				</label>
			{:else}
				{#each data.itemstructure as item}
					<label class="label" transition:slide|global>
						<span>{item.label}</span>
						<input
							class="input p-6 placeholder-primary-600"
							type="text"
							bind:value={advancedFields[item.key]}
						/>
					</label>
				{/each}
			{/if}

			<p class="mt-5">
				Found {searching ? '...' : filtereditems?.length} Result{filtereditems?.length !== 1
					? 's'
					: ''}.
			</p>
		</div>
	</div>
</ContentContainer>

<section class="mx-4">
	<ItemList
		structure={data?.itemstructure.filter((item: any) => item.showInList)}
		items={filtereditems}
	/>
</section>

<style>
	.image-background {
		background-image: image-set(
			url('$lib/assets/P1044324.00_00_45_03.Still003.webp') type('image/webp'),
			url('$lib/assets/P1044324.00_00_45_03.Still003.jpg') type('image/jpg')
		);
		background-size: cover;
		background-position: center -200px;
		background-attachment: fixed;
		background-repeat: no-repeat;
	}

	.text-shadow {
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
	}
</style>
