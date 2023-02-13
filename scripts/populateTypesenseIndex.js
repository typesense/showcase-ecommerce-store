require('dotenv').config();

const Typesense = require('typesense');

module.exports = (async () => {
  // Create a client
  const typesense = new Typesense.Client({
    nodes: [
      {
        host: process.env.TYPESENSE_HOST,
        port: process.env.TYPESENSE_PORT,
        protocol: process.env.TYPESENSE_PROTOCOL,
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
    connectionTimeoutSeconds: 60 * 60,
  });

  const schema = {
    name: 'products',
    num_documents: 0,
    fields: [
      {
        name: 'name',
        type: 'string',
        facet: false,
      },
      {
        name: 'description',
        type: 'string',
        facet: false,
      },
      {
        name: 'brand',
        type: 'string',
        facet: true,
      },
      {
        name: 'categories',
        type: 'string[]',
        facet: true,
      },
      {
        name: 'categories.lvl0',
        type: 'string[]',
        facet: true,
      },
      {
        name: 'categories.lvl1',
        type: 'string[]',
        facet: true,
        optional: true,
      },
      {
        name: 'categories.lvl2',
        type: 'string[]',
        facet: true,
        optional: true,
      },
      {
        name: 'categories.lvl3',
        type: 'string[]',
        facet: true,
        optional: true,
      },
      {
        name: 'price',
        type: 'float',
        facet: true,
      },
      {
        name: 'popularity',
        type: 'int32',
        facet: false,
      },
      {
        name: 'free_shipping',
        type: 'bool',
        facet: true,
      },
      {
        name: 'rating',
        type: 'int32',
        facet: true,
      },
      {
        name: 'vectors',
        type: 'float[]',
        num_dim: 384,
      },
      // This is a field that exists in the document, but we only want to use it for display purposes and not search purposes.
      // So we can just leave it off the schema, but still send it in the document.
      // These fields are considered un-indexed fields, and stored on disk and returned when the document is a hit.
      // These un-indexed fields do not count towards RAM usage.
      // {
      //   name: 'image',
      //   type: 'string',
      //   facet: false,
      // },
    ],
    default_sorting_field: 'popularity',
  };

  console.log('Populating index in Typesense');

  const products = require('./data/ecommerce-with-vectors.json');

  let reindexNeeded = false;
  try {
    const collection = await typesense.collections('products').retrieve();
    console.log('Found existing schema');
    // console.log(JSON.stringify(collection, null, 2));
    if (
      collection.num_documents !== products.length ||
      process.env.FORCE_REINDEX === 'true'
    ) {
      console.log('Deleting existing schema');
      reindexNeeded = true;
      await typesense.collections('products').delete();
    }
  } catch (e) {
    reindexNeeded = true;
  }

  if (!reindexNeeded) {
    return true;
  }

  console.log('Creating schema: ');
  console.log(JSON.stringify(schema, null, 2));
  await typesense.collections().create(schema);

  // const collectionRetrieved = await typesense
  //   .collections("products")
  //   .retrieve();
  // console.log("Retrieving created schema: ");
  // console.log(JSON.stringify(collectionRetrieved, null, 2));

  console.log('Adding records: ');

  // Bulk Import
  products.forEach((product) => {
    product.free_shipping = product.name.length % 2 === 1; // We need this to be deterministic for tests
    product.rating = (product.description.length % 5) + 1; // We need this to be deterministic for tests
    product.categories.forEach((category, index) => {
      product[`categories.lvl${index}`] = [
        product.categories.slice(0, index + 1).join(' > '),
      ];
    });
  });

  try {
    const returnData = await typesense
      .collections('products')
      .documents()
      .import(products);
    console.log(returnData);
    console.log('Done indexing.');

    const failedItems = returnData.filter((item) => item.success === false);
    if (failedItems.length > 0) {
      throw new Error(
        `Error indexing items ${JSON.stringify(failedItems, null, 2)}`
      );
    }

    return returnData;
  } catch (error) {
    console.log(error);
  }
})();
