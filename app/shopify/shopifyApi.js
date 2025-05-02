import * as ShopifyGQL from './shopify.gql';
import * as shopdata from './shopifydb';
import * as shopchannel from './ShopifyChannel';
import * as shoplocation from './shopifyLcocations';
import {updateshopifyId} from '../salonist/productqueries.server';
import logger from '../logger/logger';
import { unauthenticated } from '../shopify.server';

/**
 * Create a product and update its variant.
 */
export const SyncProduct = async (dbproduct,result) => {
  let shop;
  try {
    shop = dbproduct?.shop;
    const { admin }   = await unauthenticated.admin(shop);
    const baseProductData = {
      title: result.name,
      handle: result.id?.toString(),
      descriptionHtml: result.desc ?? '',
      productType: result.type ?? 'Retail',
      vendor: result.brand ?? 'Unknown'
    };
    const isUpdate = !!dbproduct.shopifyProductId;
    const mutation = isUpdate ? ShopifyGQL.UPDATE_PRODUCT_MUTATION : ShopifyGQL.CREATE_PRODUCTS_MUTATION;

    const variables = isUpdate
      ? { input: { id: dbproduct.shopifyProductId, ...baseProductData } }
      : { variables: { product: baseProductData } };

    console.log(variables);

    const response = await admin.graphql(mutation, variables);
    const responseJson = await response.json();

    // Optional: Log product ID or handle after success
    const product = responseJson.data?.productCreate?.product || responseJson.data?.productUpdate?.product;
    const variantid = product.variants.edges[0].node.id;
    const productid = product?.id;
    await updateshopifyId(result.id,productid);

    return {productid};

  } catch (error) {

    logger.error(`SyncProduct error for shop ${shop}: ${error.message}`, { stack: error.stack });
    throw error; 
  }

};



/**
 * Update a product variant and its inventory across all DB-stored locations.
 */

export const VariantUpdate = async (shop, variantData) => {
let locations;
  const { admin } = await unauthenticated.admin(shop);
  locations = await shopdata.getLocationsByShop(shop);

};
