import * as ShopifyGQL from './shopify.gql';
import * as shopdata from './shopifydb';
import * as shopchannel from './ShopifyChannel';
import * as shoplocation from './shopifyLcocations';
import {updateshopifyId} from '../salonist/ProductQuery.server';
import logger from '../logger/logger';
import { unauthenticated } from '../shopify.server';


/**
 * Create a  Retails Product and update its variant.
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
      vendor: result.brand ?? 'Salonist',
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

    const product = responseJson.data?.productCreate?.product || responseJson.data?.productUpdate?.product;
    const variantid = product.variants.edges[0].node.id;
    const productid = product?.id;
    const variantData = {productid ,variantid , ...result}

    if(productid){
    const metadata =  {type:'product',id:productid,domainId:result.domainId} ;
     await  SetProductMetafiled(shop ,metadata);
    }

     await ProductVariantUpdate (shop, variantData);
     await updateshopifyId(result.id,productid);
     await PublishablePublish(shop, productid);
    return {productid};

  } catch (error) {

    logger.error(`SyncProduct error for shop ${shop}: ${error.message}`, { stack: error.stack });
    throw error; 
  }

};

/**
 * Create / update a Shopify product for one Salonist package,
 * then publish and update the default variant.
 *
 * @param {object} dbPackage    – Row from your DB (contains the shop name, etc.)
 * @param {object} result       – Single package payload returned by Salonist
 *                                ({ Package, Packageinfo } structure)
 * @returns {{ productId: string }}
 */
export const syncPackage = async (dbPackage, result) => {
  let shop;
  try {
    /* ------------------------------------------------------------------ */
    /* 0. Grab shop + ensure the “Packages” collection exists             */
    /* ------------------------------------------------------------------ */
    shop = dbPackage?.shop;

    const collectionData = {
      name: 'Packages',
      handle: 'packages',
      descriptionHtml: 'Packages',
      id: 'packages',
    };
    const collectionId = await CreateandUpdateCollection(
      dbPackage,
      collectionData,
    );

    /* ------------------------------------------------------------------ */
    /* 1. Auth + unpack Salonist payload                                  */
    /* ------------------------------------------------------------------ */
    const { admin } = await unauthenticated.admin(shop);

    const { Package, Packageinfo } = result;        // <- NOW we have Package
    const descriptionHtml = await generatePackageDescription(result);

    /* metafield – store the Salonist ID so we can look it up later */
     const metaField = {namespace: "salonist", key: "id", type: "id", value: Package.id};

    /* ------------------------------------------------------------------ */
    /* 2. Create or update the product                                   */
    /* ------------------------------------------------------------------ */

    console.log(descriptionHtml);
    const baseProductData = {
      title: Package.name,
      handle: Package.id.toString(),
      descriptionHtml: `${descriptionHtml}`,
      productType: 'Package',
      vendor: Package.brand ?? 'Salonist',
      metafields:[metaField],
      collectionsToJoin: [collectionId],
    };

    // Does a Shopify product with this CRM ID already exist?
    const existing = await productByIdentifier(admin, Package.id);
    const isUpdate = Boolean(existing?.id);

    const mutation = isUpdate
      ? ShopifyGQL.UPDATE_PRODUCT_MUTATION
      : ShopifyGQL.CREATE_PRODUCTS_MUTATION;

    const variables = isUpdate
      ? { input: { id: existing.id, ...baseProductData } }
      : { product: baseProductData };

    const response = await admin.graphql(mutation, { variables });
    const responseJson = await response.json();

    const product =
      responseJson.data?.productCreate?.product ??
      responseJson.data?.productUpdate?.product;

    if (!product) throw new Error('No product node returned from Shopify');

    const productid = product.id;
    const variantId = product.variants.edges[0].node.id;

    /* ------------------------------------------------------------------ */
    /* 3. Attach our own metafield doc (if you keep extra lookup data)    */
    /* ------------------------------------------------------------------ */
      if(productid){
        const metadata =  {type:'product',id:productid,domainId:Package.domainId} ;
        await  SetProductMetafiled(shop ,metadata);
        }

    /* ------------------------------------------------------------------ */
    /* 4. Update default variant (price / compare‑at)                     */
    /* ------------------------------------------------------------------ */
    const variantData = {productid ,variantId , ...Package}
    await PackageVariantUpdate(shop,variantData);

    /* ------------------------------------------------------------------ */
    /* 5. Publish the product (if it isn’t already)                       */
    /* ------------------------------------------------------------------ */
    await PublishablePublish(shop, productid);

    return { productid };
  } catch (err) {
    logger.error(`syncPackage error for shop ${shop}: ${err.message}`, {
      stack: err.stack,
    });
    throw err;
  }
};




/**
 * Create and update collections
 * @param {*} dbplan 
 * @param {*} data 
 * @returns 
 */

export const CreateandUpdateCollection = async (dbplan,data) =>{
  let shopifyCollectionId ,shop;
  shop = dbplan?.shop;
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
      const collectionId = await collectionByIdentifier(admin,data.id);
      if (collectionId) {
        shopifyCollectionId = collectionId.id;
        const updateResponse = await admin.graphql(ShopifyGQL.UPDATE_COLLECTION_MUTATION, { variables: { input: { id: shopifyCollectionId, ...collectionData } } });
        const updateJson = await updateResponse.json();
         updateJson.data?.collectionUpdate?.collection || null;
        return shopifyCollectionId;
      } else {
        const createResponse = await admin.graphql(ShopifyGQL.CREATE_COLLECTION_MUTATION, { variables: { input: collectionData } });
        const createJson = await createResponse.json();
        const collection =   createJson.data?.collectionCreate?.collection || null;
        
        if(collection?.id){
          await  PublishablePublish(shop,collection.id);
        }
       
        return collection?.id || null;
      }
  
  
    } catch (error) {
  
      logger.error(`CreateandUpdateCollection error for shop ${shop}: ${error.message}`, { stack: error.stack });
      throw error; 
    }
  
  };




/**
 * Create a Service Product  and Update  .
 */
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
      vendor: result.brand ?? 'Salonist',
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
    const product = responseJson.data?.productCreate?.product || responseJson.data?.productUpdate?.product;
    const variantid = product.variants.edges[0].node.id;
    const productid = product?.id;
    const variantData = {productid ,variantid , ...result}
    if(productid){
       const metadata =  {
        type:'service',
        id:productid,
        domainId:result.domainId,
        time:result.service_time
      };
       await  SetProductMetafiled(shop ,metadata);
      }
    await ServiceVariantUpdate (shop, variantData);
    await PublishablePublish(shop, productid);

    return productid;

  } catch (error) {

    logger.error(`SyncService error for shop ${shop}: ${error.message}`, { stack: error.stack });
    throw error; 
  }

}



/**
 * Get Product or collection id by Salonist id
 */

export const productByIdentifier = async (admin, id) =>{

  const identifier =  {identifier: {customId: {namespace: "salonist", key: "id", value: id } } };
  const  productByIdentifierQuery = ShopifyGQL.PRODUCT_BY_IDENTIFIER;
  const response = await admin.graphql(productByIdentifierQuery, {variables:identifier});
  const responseJson = await response.json();
  const product = responseJson.data?.product || null;

  return product;
};


export const collectionByIdentifier = async (admin, id) =>{

  const identifier =  {identifier: {customId: {namespace: "salonist", key: "id", value: id } } };
  const  collectionByIdentifierQuery = ShopifyGQL.COLLECTION_BY_IDENTIFIER;
  const response = await admin.graphql(collectionByIdentifierQuery, {variables:identifier});
  const responseJson = await response.json();
  const collection = responseJson.data?.collection || null;

  return collection;
};




/**
 * Update a product variant and its inventory across all DB-stored locations.
 */

export const ProductVariantUpdate = async (shop, variantData) => {
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

/**
 * Package Variant Create and Upadte 
 * @param {
 * } shop 
 * @param {*} variantData 
 * @returns 
 */

export const PackageVariantUpdate = async (shop, variantData) => {
  const { admin } = await unauthenticated.admin(shop);
  const mutation = ShopifyGQL.PRODUCT_DEFAULT_VARIANT_MUTATION;

  const price = variantData?.cost_price || '0.00';
  const compareAtPrice =
    variantData?.special_price && parseFloat(variantData.special_price) > 0
      ? variantData.special_price
      : null;

  const variant = {
    productId: variantData.productid,
    strategy: "REMOVE_STANDALONE_VARIANT",
    variants: [
      {
        price,
        ...(compareAtPrice ? { compareAtPrice } : {}),
        inventoryItem: {
          sku: variantData?.code || variantData?.id,
          tracked: false
        },
        taxable: false
      }
    ]
  };

  try {
    const response = await admin.graphql(mutation, { variables: variant });
    const responseJson = await response.json();
    const userErrors = responseJson?.data?.productVariantsBulkCreate?.userErrors || [];

    if (userErrors && userErrors.length > 0) {
      logger.error(`GraphQL Errors for Package shop ${shop}:`, JSON.stringify(responseJson.errors, null, 2));
      console.error('GraphQL Errors:', userErrors);
      return false;
    }

    console.log(`Package Variant updated successfully for shop ${shop}`);
    return true;

  } catch (error) {
    logger.error(`Exception while updating Package variant for shop ${shop}: ${error.message}`, {
      stack: error.stack,
      variantData
    });
    console.error('Exception caught during Package GraphQL mutation:', error);
    return true;
  }
};



/**
 * Update a Service variant and its inventory across all DB-stored locations.
 */

export const ServiceVariantUpdate = async (shop, variantData) => {
  const { admin } = await unauthenticated.admin(shop);
  const mutation = ShopifyGQL.PRODUCT_DEFAULT_VARIANT_MUTATION;
  const variant = {
    productId: variantData.productid,
    strategy: "REMOVE_STANDALONE_VARIANT",
    variants: [
      {
        price: variantData?.price || '0.00',
        inventoryItem: {
          sku: variantData?.code || variantData?.id,
          tracked: false
        },
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
      logger.error(`GraphQL Errors for Service shop ${shop}:`, JSON.stringify(responseJson.errors, null, 2));
      console.error('GraphQL Errors:', userErrors);
      return false;
    }
    console.log(`Service Variant updated  successfully for shop ${shop}`);

    return true;

  } catch (error) {
    logger.error(`Exception while updating Service variant for shop ${shop}: ${error.message}`, {
      stack: error.stack,
      variantData
    });
    console.error('Exception caught during Service  GraphQL mutation:', error);
    return true;
  }
};


export const Deleteshopifyproduct= async(shop,id) =>{
  let productId;
  const { admin } = await unauthenticated.admin(shop);
   const product =  await  productByIdentifier(admin,id);
   const mutation = ShopifyGQL.DELETE_PRODUCT_MUTATION;
   const isUpdate = !!product?.id;
    if(isUpdate){
      productId = product.id;
      const response = await admin.graphql(mutation, { variables: {id:productId} });
      const responseJson = await response.json();
      const userErrors = responseJson?.data?.productDelete?.userErrors || [];
      if (userErrors && userErrors.length > 0) {
        logger.error(`GraphQL Errors for product delete for shop ${shop}:`, JSON.stringify(responseJson.errors, null, 2));
        console.error('GraphQL Errors:', userErrors);
      
      }
    }

    return true;
};


export const DeleteshopifyCollection = async (shop,id) => {
  let collectionId;
  const { admin } = await unauthenticated.admin(shop);
   const collection =  await  collectionByIdentifier(admin,id);
   const mutation = ShopifyGQL.DELETE_COLLECTION_MUTATION;
   const isUpdate = !!collection?.id;
    if(isUpdate){
      collectionId = collection.id;
        const response = await admin.graphql(mutation, { variables: { input: { id: collectionId } } });
        const responseJson = await response.json();
        const userErrors = responseJson?.data?.collectionDelete?.userErrors || [];
        if (userErrors && userErrors.length > 0) {
          logger.error(`GraphQL Errors for collection delete for shop ${shop}:`, JSON.stringify(responseJson.errors, null, 2));
          console.error('GraphQL Errors:', userErrors);
        } 
    }
  return true;
};

export const SetProductMetafiled = async(shop,data) => {

  const { admin } = await unauthenticated.admin(shop);
  const mutation = ShopifyGQL.SET_METAFIELD;
  
  const metaField = { metafields:[ 
    {namespace: "salonist", key: "product_type" , ownerId:data.id, type: "single_line_text_field", value:data.type},
    {namespace: "salonist", key: "domainid", ownerId:data.id, type: "single_line_text_field", value:data.domainId}
  ]};

if (data.type === "service") {
  metaField.metafields.push({namespace: "salonist", key: "servicetime", ownerId: data.id, type: "single_line_text_field", value:data?.time || '' });
}

  const response = await admin.graphql(mutation, { variables:metaField});
  const responseJson = await response.json();
  const userErrors = responseJson?.data?.metafieldsSet?.userErrors || [];
  if (userErrors && userErrors.length > 0) {
    logger.error(`GraphQL Errors for Meta field set  for shop ${shop}:`, JSON.stringify(responseJson.errors, null, 2));
    console.error('GraphQL Errors:', userErrors);
  } 
  return true;
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

export const CreateMetafieldDefinition = async (admin, shop, def) => {
  if (!admin) {
    const unauthenticatedAdmin = await unauthenticated.admin(shop);
    admin = unauthenticatedAdmin.admin;
  }
  const MetafieldData = {
    definition: {
      ...def,
    },
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
      const createResponse = await admin.graphql(mutation, {
        variables: MetafieldData,
      });
      const createJson = await createResponse.json();
      const errors = createJson?.data?.metafieldDefinitionCreate?.userErrors;

      if (errors?.length) {
        logger.error(`Failed to create metafield definition for shop ${shop}:`, {
          errors,
        });
      } else {
        console.log('Metafield definition created');
      }
    } else {
     // console.log('Metafield definition already exists:', existingDefs[0].node);
     console.log(`Metafield definition already exists for for shop ${shop}`);
    }
  } catch (error) {
    logger.error(`Metafield error for shop ${shop}: ${error.message}`, {
      stack: error.stack,
    });
  }

  return true;
};


export async function generatePackageDescription(pkg) {
  const { Package, Packageinfo } = pkg;

  const validity = `<p><strong>Validity:</strong> ${Package.expiry_days} ${Package.expiry_type}</p>`;

  const servicesHeader = `<p><strong>Services Included:</strong></p>`;
  const servicesList = Packageinfo.map(info => {
    const plan = info.Plan;
return `<li>${plan.name}${plan.service_time || plan.time ? ` <em>(Duration: ${plan.service_time || plan.time})</em>` : ''}</li>`;
  }).join('');

  const servicesHtml = `<ul>${servicesList}</ul>`;

  return `${validity}${servicesHeader}${servicesHtml}`;
}
