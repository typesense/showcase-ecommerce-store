import { debounce } from 'lodash';
import jQuery from 'jquery';
import * as bootstrap from 'bootstrap';

window.$ = jQuery; // workaround for https://github.com/parcel-bundler/parcel/issues/333

import instantsearch from 'instantsearch.js/es';
import {
  searchBox,
  pagination,
  refinementList,
  hits,
  stats,
  sortBy,
  hierarchicalMenu,
  rangeSlider,
  ratingMenu,
  toggleRefinement,
  hitsPerPage,
  clearRefinements,
} from 'instantsearch.js/es/widgets';
import { history } from 'instantsearch.js/es/lib/routers';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';

let TYPESENSE_SERVER_CONFIG = {
  apiKey: process.env.TYPESENSE_SEARCH_ONLY_API_KEY, // Be sure to use an API key that only allows searches, in production
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: process.env.TYPESENSE_PORT,
      protocol: process.env.TYPESENSE_PROTOCOL,
    },
  ],
  connectionTimeoutSeconds: 5,
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

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: TYPESENSE_SERVER_CONFIG,
  additionalSearchParameters: {
    // The following parameters are directly passed to Typesense's search API endpoint.
    //  So you can pass any parameters supported by the search endpoint below.
    //  queryBy is required.
    query_by: 'name,categories,description',
    query_by_weights: '4,2,1',
    num_typos: 1,
    typo_tokens_threshold: 1,
    exclude_fields: 'vectors',
    // By default, Typesense approximates facet counts for performance.
    // Turning on exhaustive search will get you accurate facet counts, at the cost of a slight performance hit.
    exhaustive_search: true,
    // group_by: "categories",
    // group_limit: 1
    // pinned_hits: "23:2"
  },
});
const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
  searchClient,
  indexName: 'products',
  routing: {
    router: history({ cleanUrlOnDispose: true }),
  },
  future: {
    preserveSharedStateOnUnmount: true,
  },
});

// ============ Begin Widget Configuration
search.addWidgets([
  searchBox({
    container: '#searchbox',
    showSubmit: false,
    showReset: false,
    placeholder: 'Search for products... ',
    autofocus: false,
    cssClasses: {
      input: 'form-control form-control-sm border border-light text-dark',
      loadingIcon: 'stroke-primary',
    },
  }),
  pagination({
    container: '#pagination',
    cssClasses: {
      list: 'd-flex flex-row justify-content-end',
      item: 'px-2 d-block',
      link: 'text-decoration-none',
      disabledItem: 'text-muted',
      selectedItem: 'fw-bold text-primary',
    },
  }),
  refinementList({
    limit: 10,
    showMoreLimit: 50,
    container: '#brand-list',
    attribute: 'brand',
    searchable: true,
    searchablePlaceholder: 'Search brands',
    showMore: true,
    sortBy: ['name:asc', 'count:desc'],
    cssClasses: {
      searchableInput:
        'form-control form-control-sm form-control-secondary mb-2 border-light-2',
      searchableSubmit: 'd-none',
      searchableReset: 'd-none',
      showMore: 'btn btn-secondary btn-sm',
      list: 'list-unstyled',
      count: 'badge text-dark-2 ms-2',
      label: 'd-flex align-items-center',
      checkbox: 'me-2',
    },
  }),
  hierarchicalMenu({
    container: '#categories-hierarchical-menu',
    showParentLevel: true,
    rootPath: 'Cell Phones',
    attributes: [
      'categories.lvl0',
      'categories.lvl1',
      'categories.lvl2',
      'categories.lvl3',
    ],
    cssClasses: {
      showMore: 'btn btn-secondary btn-sm',
      list: 'list-unstyled',
      childList: 'ms-4',
      count: 'badge text-dark-2 ms-2',
      link: 'text-dark text-decoration-none',
      selectedItem: 'text-primary fw-bold',
      parentItem: 'text-dark fw-bold',
    },
  }),
  toggleRefinement({
    container: '#toggle-refinement',
    attribute: 'free_shipping',
    templates: {
      labelText: () => 'Free shipping',
    },
    cssClasses: {
      label: 'd-flex align-items-center',
      checkbox: 'me-2',
    },
  }),
  rangeSlider({
    container: '#price-range-slider',
    attribute: 'price',
  }),
  ratingMenu({
    container: '#rating-menu',
    attribute: 'rating',
    cssClasses: {
      list: 'list-unstyled',
      link: 'text-decoration-none',
      starIcon: '',
      count: 'badge text-dark-2 ms-2',
      disabledItem: 'text-muted',
      selectedItem: 'fw-bold text-primary',
    },
  }),
  sortBy({
    container: '#sort-by',
    items: [
      { label: 'Relevancy', value: 'products' },
      { label: 'Price (asc)', value: 'products/sort/price:asc' },
      { label: 'Price (desc)', value: 'products/sort/price:desc' },
    ],
    cssClasses: {
      select: 'form-select form-select-sm border-none text-black',
    },
  }),
  hits({
    container: '#hits',
    templates: {
      item: (hit, { html, components }) => html`
        <div>
            <div class="row image-container">
                <div class="col-md d-flex align-items-end justify-content-center">
                    <img src="${hit.image}" alt="${hit.name}" />
                </div>
            </div>
            <div class="row mt-5">
                <div class="col-md">
                    <h5>${components.Highlight({ hit, attribute: 'name' })}</h5>
                </div>
            </div>

            <div class="row mt-2">
                <div class="col-md">${components.Highlight({
                  hit,
                  attribute: 'description',
                })}</div>
            </div>

            <div class="row mt-auto">
              <div class="col-md">
                <div class="hit-price fw-bold mt-4">\$${hit.price}</div>
                <div class="hit-rating">Rating: ${hit.rating}/5</div>
              </div>
            </div>

            <div class="row mt-auto">
                <div class="col-md">
                  <a href="#" data-document-id="${hit.id}" onclick="${() =>
        findSimilarProducts(hit.id)}">Find Similar</a>
                </div>
            </div>
        </div>
      `,
    },
    cssClasses: {
      list: 'list-unstyled grid-container',
      item: 'd-flex flex-column search-result-card mb-1 me-1 p-3',
      loadMore: 'btn btn-primary mx-auto d-block mt-4',
      disabledLoadMore: 'btn btn-dark mx-auto d-block mt-4',
    },
  }),
  hitsPerPage({
    container: '#hits-per-page',
    items: [
      { label: '9 per page', value: 9, default: true },
      { label: '18 per page', value: 18 },
    ],
    cssClasses: {
      select: 'form-select form-select-sm border-none text-black',
    },
  }),
  stats({
    container: '#stats',
    templates: {
      text: (
        { nbHits, hasNoResults, hasOneResult, processingTimeMS },
        { html }
      ) => {
        let statsText = '';
        if (hasNoResults) {
          statsText = 'No results';
        } else if (hasOneResult) {
          statsText = '1 result';
        } else {
          statsText = `${nbHits.toLocaleString()} products`;
        }
        return html`${statsText} found in ${processingTimeMS}ms`;
      },
    },
    cssClasses: {
      text: 'small',
    },
  }),
  clearRefinements({
    container: '#clear-refinements',
    cssClasses: {
      button: 'btn btn-primary',
    },
  }),
]);

window.sendEventDebounced = debounce((uiState) => {
  window.gtag('event', 'page_view', {
    page_path: window.location.pathname + window.location.search,
  });
}, 500);

search.use(() => ({
  onStateChange({ uiState }) {
    window.sendEventDebounced(uiState);
  },
  subscribe() {},
  unsubscribe() {},
}));

search.start();

window.findSimilarProducts = async function (productId) {
  const results = await typesenseInstantsearchAdapter.typesenseClient
    .collections('products')
    .documents()
    .search({
      q: '*',
      per_page: 4,
      vector_query: `vectors:([], id: ${productId})`,
    });
  console.log(results);

  const modalContent = results.hits.map((hit) => {
    return `
      <div class="p-3 m-3 border-1">
        <div class="row image-container">
            <div class="col-md d-flex align-items-end justify-content-center">
                <img src="${hit.document.image}" alt="${hit.document.name}" />
            </div>
        </div>
        <div class="row mt-5">
            <div class="col-md">
                ${hit.document.name}
            </div>
        </div>
      </div>
    `;
  });

  $('#similar-products-modal .modal-body .similar-products').html(modalContent);
  const modal = new bootstrap.Modal('#similar-products-modal', {});
  modal.show();
};
