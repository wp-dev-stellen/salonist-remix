import React, { useState, useEffect } from 'react';
import { Page, Button,Text, LegacyStack,Card } from '@shopify/polaris';
import { useLoaderData, Form } from '@remix-run/react';
import { getProductsByShop } from '../helper/helper.server';
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server'; 
import { authenticate } from '../shopify.server';
import { redirect,json  } from '@remix-run/node';


// Loader
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;
  const CrmData = await GetCrmCredentialsByShop(shop);
  const status = CrmData?.loginStatus;

  if (!status) {
    return redirect('app/login/');
  }

  const domainId = CrmData?.domainId;
  const products = await getProductsByShop(shop, { limit: 10, page: 1 });

  return { shop, domainId, products };
};

// Action
export const action = async ({ request }) => {
  let domainId;
  const { admin, session } = await authenticate.admin(request);
  const { syncProducts } = await import("../salonist/ProdductQuery.server");
  const formData = await request.formData();
  const action = formData.get('action')?.trim();
  const shop = formData.get('shop')?.trim();
  if (action === 'import_products') {
    const {session, admin } = await authenticate.admin(request);
    console.log(`Product importing started for shop ${shop}`);
    const CrmData = await GetCrmCredentialsByShop(shop);
    domainId = CrmData?.domainId;
    try {
     await syncProducts(domainId, shop);
    
    } catch (error) {
      console.error('Error syncing products:', error);
      return new Response(
        JSON.stringify({ message: { type: 'error', text: 'Failed to import products.' } }),
        { status: 500 }
      );
    }
  }
  return null;
};

// Component
export default function ProductPage() {
  const shopdata = useLoaderData();
  const initialProducts = shopdata?.products || [];
  return (
  <Page 
    fullWidth
    title='Products'  >
       <Form method="post" >
          <input type="hidden" name="action" value="import_products" />
          <input type="hidden" name="shop" value={shopdata?.shop} />
          <input type="hidden" name="domainId" value={shopdata?.domainId} />
          <Button submit>Import Now</Button>
        </Form>
 

      <text> data table </text>


       
    </Page>
  );
}
