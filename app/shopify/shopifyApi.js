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

    const metaField = {namespace: "salonist", key: "id", type: "id", value: result.id};

    const baseProductData = {
      title: result.name,
      handle: result.id?.toString(),
      descriptionHtml: result.desc ?? '',
      productType: result.type ?? 'Retail',
      vendor: result.brand ?? 'Unknown',
      metafields:[metaField]
    };

     const shopifyProductId = await productByIdentifier(admin,result.id);
      
     const isUpdate = !!shopifyProductId?.id;
   
     const mutation = isUpdate ? ShopifyGQL.UPDATE_PRODUCT_MUTATION : ShopifyGQL.CREATE_PRODUCTS_MUTATION;

     const variables = isUpdate
       ? { variables:{ input: { id: shopifyProductId.id, ...baseProductData } } }
       : { variables: { product: baseProductData } };
    const response = await admin.graphql(mutation, variables);
    const responseJson = await response.json();

    // Optional: Log product ID or handle after success
    const product = responseJson.data?.productCreate?.product || responseJson.data?.productUpdate?.product;
    const variantid = product.variants.edges[0].node.id;
    const productid = product?.id;
    const variantData = {productid ,variantid , ...result}

     await VariantUpdate (shop, variantData);

     await updateshopifyId(result.id,productid);

    return {productid};

  } catch (error) {

    logger.error(`SyncProduct error for shop ${shop}: ${error.message}`, { stack: error.stack });
    throw error; 
  }

};

export const productByIdentifier = async (admin, id) =>{

  const identifier =  {identifier: {customId: {namespace: "salonist", key: "id", value: id } } };
  const  productByIdentifierQuery = ShopifyGQL.PRODUCT_BY_IDENTIFIER;
  const response = await admin.graphql(productByIdentifierQuery, {variables:identifier});
  const responseJson = await response.json();

  const product = responseJson.data?.product || responseJson.data?.productUpdate?.product;

  return product;
};


/**
 * Update a product variant and its inventory across all DB-stored locations.
 */

export const VariantUpdate = async (shop, variantData) => {
  let locations;

  const { admin } = await unauthenticated.admin(shop);
  const mutation = ShopifyGQL.PRODUCT_DEFAULT_VARIANT_MUTATION;
  locations = await shopdata.getLocationsByShop(shop);
  const qty = Number(variantData?.qty) >= 1 ? Number(variantData.qty) : 0;
  const inventoryQuantities = locations.map((loc) => ({
    availableQuantity: qty,
    locationId: `gid://shopify/Location/${loc.locationid}`
   
  }));

  const variant = {
    productId: variantData.productid,
    strategy: "REMOVE_STANDALONE_VARIANT",
    variants: [
      {
        price: variantData?.full_price || variantData?.sale_price,
        compareAtPrice: variantData?.sale_price || '',
        inventoryItem: {
          sku: variantData?.code || variantData?.id,
          tracked: true
        },
        inventoryPolicy: variantData?.inventoryPolicy || "DENY",
        inventoryQuantities: inventoryQuantities,
        taxable: false
      }
    ]
  };

  try {
    const response = await admin.graphql(mutation, { variables: variant });
    const responseJson = await response.json();
    const userErrors = responseJson?.data?.productVariantsBulkCreate?.userErrors || [];
    // Log detailed GraphQL errors if any
    if (userErrors && userErrors.length > 0) {
      logger.error(`GraphQL Errors for shop ${shop}:`, JSON.stringify(responseJson.errors, null, 2));
      console.error('GraphQL Errors:', userErrors);
      return false;
    }
    console.log(`Variant updated successfully for shop ${shop}`);

    return true;

  } catch (error) {
    logger.error(`Exception while updating variant for shop ${shop}: ${error.message}`, {
      stack: error.stack,
      variantData
    });
    console.error('Exception caught during GraphQL mutation:', error);
    return true;
  }
};




export const CreateMetafieldDefinition = async (admin ,shop) => {
  
  const MetafieldData = {
    definition: {
      name: "Salonist Product",
      namespace: "salonist",
      key: "id",
      description: "Salonist Product Id",
      type: "id",  
      ownerType: "PRODUCT",
      pin: true
    }
  };

  try {
    const query = ShopifyGQL.METAFIELD_DEFINITION_QUERY(
      "salonist",
      "id",
      "PRODUCT"
    );
    const mutation = ShopifyGQL.CREATE_METAFIELD_DEFINATION;

    const response = await admin.graphql(query);

    const responseJson = await response.json();

    const existingDefs = responseJson?.data?.metafieldDefinitions?.edges;

    if (!existingDefs || existingDefs.length === 0) {

      const createResponse = await admin.graphql(mutation, {variables:MetafieldData});
      const createJson = await createResponse.json();
      const errors = createJson?.data?.metafieldDefinitionCreate?.userErrors;


      if (errors?.length) {
        logger.error(`Failed to create metafield definition for shop ${shop}:`, {
          errors,
        });

      } else {

        console.log(
          "Metafield definition created:",
          createJson.data.metafieldDefinitionCreate.createdDefinition
        );

      }
    } else {

      console.log("Metafield definition already exists:", existingDefs[0].node);

    }
    
  } catch (error) {

    logger.error(`Metafield error for shop ${shop}: ${error.message}`, {
      stack: error.stack,
    });

  }

  return true; 
};
