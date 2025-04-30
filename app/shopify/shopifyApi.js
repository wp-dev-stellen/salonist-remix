import {unauthenticated} from '../shopify.server';
import * as ShopifyGQL from './shopify.gql';
import { redirect,data} from '@remix-run/node';
import { capitalizeWords } from '../helper/helper.server';
import { cpSync } from 'fs';


 export const createProduct = async (shop ,result) =>{

    let productdata ,variant,variantdata;
   
    const { admin } = await unauthenticated.admin(shop);
    const data = { title: result.name , handle: result.id, descriptionHtml: result.desc ?? null, productType: result.type?? "Retail", vendor: result.brand ?? null };

    productdata = { variables: { product: data },};

    const response =  await admin.graphql(ShopifyGQL.CREATE_PRODUCT,productdata);

    const responseJson = await response.json();
    const product = responseJson.data.productCreate.product;
    const variantId = product.variants.edges[0].node.id;
    console.log(product,'product');

     variantdata = { id:variantId, price:result.sale_price ,quantity:1};

     variant =  {variables: {productId: product.id, variants: [variantdata],},};

     const variantResponse =  await admin.graphql(ShopifyGQL.PRODUCT_VARIANT_UPDATE,variant);
     const variantResponseJson = await variantResponse.json();

    return {
      product: responseJson.data.productCreate.product,
      variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
    };

}


