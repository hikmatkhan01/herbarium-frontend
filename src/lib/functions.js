
import { get} from 'svelte/store';
export const addFlagToCountry = (/** @type {string} */ country) => {
	return `${country} <span style="background-image: url(https://github.com/stefangabos/world_countries/blob/master/data/flags/16x16/${country.toLowerCase()}.png?raw=true);" class="flag"></span>`;
};

 import { selectedImagePath } from './stores.svelte.js';
export const setGenusAndSpeciesItalic = (
	/** @type {string} */ input,
	/** @type {string} */ genus,
	/** @type {string} */ species
) => {
	return input.replace(
		// @ts-ignore
		new RegExp(`${genus.replaceAll('?', '')}|${species.replaceAll('?', '')}`, 'g'),
		`<span class="italic">$&</span>`
	);
};


/**
 * @param {any} src
 */
export const  openLightbox2=(/** @type {any} */ src)=> {
	// @ts-ignore
	selectedImagePath.path = src;
	
  }
 export  const closeLightbox=()=> {
	// @ts-ignore
	selectedImagePath.path="";
  }