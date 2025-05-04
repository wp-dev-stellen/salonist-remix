import * as ShopifyGQL from './shopify.gql';
import * as shopdata from './shopifydb';
import * as shopchannel from './ShopifyChannel';
import * as shoplocation from './shopifyLcocations';
import {updateshopifyId} from '../salonist/ProductQueries.server';
import logger from '../logger/logger';
import { unauthenticated } from '../shopify.server';
import { channel } from 'diagnostics_channel';

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
     await PublishablePublish(shop, productid);
    return {productid};

  } catch (error) {

    logger.error(`SyncProduct error for shop ${shop}: ${error.message}`, { stack: error.stack });
    throw error; 
  }

};
export const SyncServices = async (dbproduct,result,collectionid) => {
  let shop;
  try {
    shop = dbproduct?.shop;
    const { admin }   = await unauthenticated.admin(shop);

    const metaField = {namespace: "salonist", key: "id", type: "id", value: result.id};

    const baseProductData = {
      title: result.name,
      handle: result.id?.toString(),
      descriptionHtml: result.desc ?? '',
      productType: result.type ?? 'Service',
      vendor: result.brand ?? 'Unknown',
      metafields:[metaField],
      collectionsToJoin:[collectionid]
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
     await PublishablePublish(shop, productid);
    return {productid};

  } catch (error) {

    logger.error(`SyncProduct error for shop ${shop}: ${error.message}`, { stack: error.stack });
    throw error; 
  }

}

export const productByIdentifier = async (admin, id) =>{

  const identifier =  {identifier: {customId: {namespace: "salonist", key: "id", value: id } } };
  const  productByIdentifierQuery = ShopifyGQL.PRODUCT_BY_IDENTIFIER;
  const response = await admin.graphql(productByIdentifierQuery, {variables:identifier});
  const responseJson = await response.json();

  const product = responseJson.data?.product || responseJson.data?.productUpdate?.product;

  return product;
};


export const CreateandUpdateCollection = async (shop,data) =>{

  let shopifyCollectionId;
  try {
    const { admin } = await unauthenticated.admin(shop);
    const collectionData = {
      title: data.name,
      handle: data.id?.toString(),
      descriptionHtml: data.desc ?? '',
      metafields: [
        {
          namespace: "salonist",
          key: "id",
          type: "id",
          value: data.id
        }
      ]
    };
    const collectionId = await productByIdentifier(admin,data.id);
    if (collectionId) {
      shopifyCollectionId = collectionId.id;
      const updateResponse = await admin.graphql(ShopifyGQL.UPDATE_COLLECTION_MUTATION, { variables: { input: { id: shopifyCollectionId, ...collectionData } } });
      const updateJson = await updateResponse.json();
      return updateJson.data?.collectionUpdate?.collection || null;
    } else {
      const createResponse = await admin.graphql(ShopifyGQL.CREATE_COLLECTION_MUTATION, { variables: { input: collectionData } });
      const createJson = await createResponse.json();
      return createJson.data?.collectionCreate?.collection || null;
    }
  } catch (error) {
    logger.error(`CreateandUpdateCollection error for shop ${shop}: ${error.message}`, { stack: error.stack });
    throw error; 
  }

};





/**
 * Update a product variant and its inventory across all DB-stored locations.
 */

export const VariantUpdate = async (shop, variantData) => {
  let locations;

  const { admin } = await unauthenticated.admin(shop);
  const mutation = ShopifyGQL.PRODUCT_DEFAULT_VARIANT_MUTATION;
  locations = await shopdata.getLocationsByShop(shop);
  if(!locations || locations.length ===0){
    await shoplocation.paginateAndStoreLocations(shop);
    locations = await shopdata.getLocationsByShop(shop);
  }
  
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
export const PublishablePublish = async (shop, pid) => {
  try {
    const { admin } = await unauthenticated.admin(shop);
    const mutation = ShopifyGQL.PUBLISH_PRODUCT_MUTATION;

    let channels = await shopdata.getShopChannels(shop, 'online_store');

    if (!channels || channels.length === 0) {
      await shopchannel.paginateAndStoreChannels(shop);
      channels = await shopdata.getShopChannels(shop, 'online_store');
    }

    const channel = channels && channels[0]; 
    console.log(channel)
    if (!channel || !channel.id) {
      logger.error(`No valid publication channel found for shop ${shop}`);
      return false;
    }

    const publication = { id:pid, input:{publicationId: `gid://shopify/Publication/${channel.id}`} };
      console.log(publication)  
    const response = await admin.graphql(mutation,{variables:publication});
    const responseJson = await response.json();
    const userErrors = responseJson?.data?.publishablePublish?.userErrors || [];

    if (userErrors.length > 0) {
      logger.error(`GraphQL Errors for shop ${shop}:`, JSON.stringify(userErrors, null, 2));
      return false;
    }

    console.log(`Product published successfully for shop ${shop}`);
    return true;

  } catch (error) {
    logger.error(`Exception while publishing product for shop ${shop}: ${error.message}`, {
      stack: error.stack,
      productId: pid
    });
    return false;
  }
};




export const CreateMetafieldDefinition = async (admin ,shop,def) => {
  
  const MetafieldData = {
    definition: {
      ...def
    }
  };

  try {
    const query = ShopifyGQL.METAFIELD_DEFINITION_QUERY(
      def.namespace,
      def.key,
      def.ownerType
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
