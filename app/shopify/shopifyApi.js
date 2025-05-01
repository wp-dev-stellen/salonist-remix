import { unauthenticated } from '../shopify.server';
import * as ShopifyGQL from './shopify.gql';
import * as shopdata from './shopifydb';
import * as shopchannel from './ShopifyChannel';
import * as shoplocation from './shopifyLcocations';
import {updateshopifyId} from '../salonist/productqueries.server'
/**
 * Create a product and update its variant.
 */
export const createProduct = async (shop, result) => {

  const { admin } = await unauthenticated.admin(shop);


  //Construct product input
  const data = {
    title: result.name,
    handle: result.id,
    descriptionHtml: result.desc ?? null,
    productType: result.type ?? 'Retail',
    vendor: result.brand ?? null,
  };

  const productInput = {
    variables: {
      product: data,
    },
  };

  // Create product

    const response = await admin.graphql(ShopifyGQL.CREATE_PRODUCTS_MUTATION, productInput);
    const responseJson = await response.json();
    const product = responseJson.data?.productCreate?.product;
  
  
  
  const variantId = product.variants.edges[0].node.id;
  await updateshopifyId(result.id,product.id);

  if (!product) throw new Error('Product creation failed.');

 

  return {
    product,
  };
};

/**
 * Update a product variant and its inventory across all DB-stored locations.
 */
export const VariantUpdate = async (shop, variantData) => {
let locations;
console.log(variantData);
  const { admin } = await unauthenticated.admin(shop);


   locations = await shopdata.getLocationsByShop(shop);

      if (!locations.length){

       await shoplocation.paginateAndStoreLocations(shop);
       locations = await shopdata.getLocationsByShop(shop);

      }

  // const inventoryQuantities = locations.map((loc) => ({
  //   locationId: `gid://shopify/Location/${loc.locationid}`,
  //   availableQuantity: variantData.quantity ?? 0,
  // }));

  // const variant = {
  //   id: variantData.variantId,
  //   price:variantData.price,
  //   taxable: false,
  // };

  // const payload = {
  //   variables: {
  //     productId: variantData.productId,
  //     variants: [variant],
  //   },
  // };

  // console.log(payload,'payload');
  // // Execute update
  // const variantResponse = await admin.graphql(ShopifyGQL.PRODUCT_VARIANT_UPDATE, payload);
  // const variantResponseJson = await variantResponse.json();

  // if (!variantResponseJson?.data?.productVariantsUpdate?.product?.id) {

  //   console.error('Variant update failed', variantResponseJson.errors ?? variantResponseJson);
  //   throw new Error('Shopify variant update failed.');
  // }

  // return variantResponseJson;
};
