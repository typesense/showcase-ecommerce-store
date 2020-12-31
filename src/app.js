import jQuery from 'jquery';

window.$ = jQuery; // workaround for https://github.com/parcel-bundler/parcel/issues/333

import 'popper.js';
import 'bootstrap';
import instantsearch from 'instantsearch.js/es';
import {
  searchBox,
  pagination,
  currentRefinements,
  refinementList,
  hits,
  infiniteHits,
  stats,
  sortBy,
  hierarchicalMenu,
  menu,
  numericMenu,
  rangeInput,
  rangeSlider,
  ratingMenu,
  toggleRefinement,
  hitsPerPage,
  clearRefinements,
  breadcrumb
} from "instantsearch.js/es/widgets";
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

let TYPESENSE_SERVER_CONFIG = {
  apiKey: process.env.TYPESENSE_SEARCH_ONLY_API_KEY, // Be sure to use an API key that only allows searches, in production
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: process.env.TYPESENSE_PORT,
      protocol: process.env.TYPESENSE_PROTOCOL,
    },
  ],
  numRetries: 8,
};

// [2, 3].forEach(i => {
//   if (process.env[`TYPESENSE_HOST_${i}`]) {
//     TYPESENSE_SERVER_CONFIG.nodes.push({
//       host: process.env[`TYPESENSE_HOST_${i}`],
//       port: process.env.TYPESENSE_PORT,
//       protocol: process.env.TYPESENSE_PROTOCOL,
//     });
//   }
// });

// Unfortunately, dynamic process.env keys don't work with parcel.js
// So need to enumerate each key one by one

if (process.env[`TYPESENSE_HOST_2`]) {
  TYPESENSE_SERVER_CONFIG.nodes.push({
    host: process.env[`TYPESENSE_HOST_2`],
    port: process.env.TYPESENSE_PORT,
    protocol: process.env.TYPESENSE_PROTOCOL,
  });
}

if (process.env[`TYPESENSE_HOST_3`]) {
  TYPESENSE_SERVER_CONFIG.nodes.push({
    host: process.env[`TYPESENSE_HOST_3`],
    port: process.env.TYPESENSE_PORT,
    protocol: process.env.TYPESENSE_PROTOCOL,
  });
}

if (process.env[`TYPESENSE_HOST_NEAREST`]) {
  TYPESENSE_SERVER_CONFIG['nearestNode'] = {
    host: process.env[`TYPESENSE_HOST_NEAREST`],
    port: process.env.TYPESENSE_PORT,
    protocol: process.env.TYPESENSE_PROTOCOL,
  };
}

const INDEX_NAME = process.env.TYPESENSE_COLLECTION_NAME;

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: TYPESENSE_SERVER_CONFIG,
  additionalSearchParameters: {
    // The following parameters are directly passed to Typesense's search API endpoint.
    //  So you can pass any parameters supported by the search endpoint below.
    //  queryBy is required.
    queryBy: "name,description,categories",
    // groupBy: "categories",
    // groupLimit: 1
    // pinnedHits: "23:2"
  },
});
const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
  searchClient,
  indexName: "products",
  routing: true
});

// ============ Begin Widget Configuration
search.addWidgets([
  searchBox({
    container: "#searchbox"
  }),
  pagination({
    container: "#pagination"
  }),
  currentRefinements({
    container: "#current-refinements"
  }),
  refinementList({
    limit: 50,
    showMoreLimit: 100,
    container: "#brand-list",
    attribute: "brand",
    searchable: true,
    showMore: true,
    sortBy: ["name:asc", "count:desc"]
  }),
  menu({
    container: "#categories-menu",
    attribute: "categories"
  }),
  hierarchicalMenu({
    container: "#categories-hierarchical-menu",
    attributes: [
      "categories.lvl0",
      "categories.lvl1",
      "categories.lvl2",
      "categories.lvl3"
    ]
  }),
  numericMenu({
    container: "#price-menu",
    attribute: "price",
    items: [
      {label: "All"},
      {label: "Less than 500$", end: 500},
      {label: "Between 500$ - 1000$", start: 500, end: 1000},
      {label: "More than 1000$", start: 1000}
    ]
  }),
  toggleRefinement({
    container: "#toggle-refinement",
    attribute: "free_shipping",
    templates: {
      labelText: "Free shipping"
    }
  }),
  rangeInput({
    container: "#price-range-input",
    attribute: "price"
  }),
  rangeSlider({
    container: "#price-range-slider",
    attribute: "price"
  }),
  ratingMenu({
    container: "#rating-menu",
    attribute: "rating"
  }),
  sortBy({
    container: "#sort-by",
    items: [
      {label: "Default", value: "products"},
      {label: "Price (asc)", value: "products/sort/price:asc"},
      {label: "Price (desc)", value: "products/sort/price:desc"}
    ]
  }),
  hits({
    container: "#hits",
    templates: {
      item: `
        <div>
          <img src="{{image}}" align="left" alt="{{name}}" />
          <div class="hit-name">
            {{#helpers.highlight}}{ "attribute": "name" }{{/helpers.highlight}}
          </div>
          <div class="hit-description">
            {{#helpers.highlight}}{ "attribute": "description" }{{/helpers.highlight}}
          </div>
          <div class="hit-price">\${{price}}</div>
          <div class="hit-rating">Categories: {{categories}}</div>
          <div class="hit-rating">Rating: {{rating}}</div>
          <div class="hit-free-shipping">Free Shipping: {{free_shipping}}</div>
        </div>
      `
    }
  }),
  hitsPerPage({
    container: "#hits-per-page",
    items: [
      {label: "8 hits per page", value: 8, default: true},
      {label: "16 hits per page", value: 16}
    ]
  }),
  stats({
    container: "#stats",
    templates: {
      text: `
      {{#hasNoResults}}No results{{/hasNoResults}}
      {{#hasOneResult}}1 result{{/hasOneResult}}
      {{#hasManyResults}}{{#helpers.formatNumber}}{{nbHits}}{{/helpers.formatNumber}} results{{/hasManyResults}}
      found in {{processingTimeMS}}ms for {{query}}
    `
    }
  }),
  clearRefinements({
    container: "#clear-refinements"
  }),
  breadcrumb({
    container: "#breadcrumb",
    attributes: [
      "categories.lvl0",
      "categories.lvl1",
      "categories.lvl2",
      "categories.lvl3"
    ]
  })
]);

search.start();
