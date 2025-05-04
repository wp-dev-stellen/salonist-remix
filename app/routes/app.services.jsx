import React, { useState, useEffect } from 'react';
import { Page, Button,Text, LegacyStack,Card } from '@shopify/polaris';
import { useLoaderData, Form } from '@remix-run/react';
import { getProductsByShop } from '../helper/helper.server';
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server';
import { authenticate } from '../shopify.server';
import { redirect } from '@remix-run/node';


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
  const { syncServices } = await import("../salonist/ServicesQuery.server");
  const formData = await request.formData();
  const action = formData.get('action')?.trim();
  const shop = formData.get('shop')?.trim();
   domainId = formData.get('domainId')?.trim();

  if (action === 'import_services') {

    if (!domainId) {
      const CrmData = await GetCrmCredentialsByShop(shop);
       domainId = CrmData?.domainId;
    }
    
    await syncServices(domainId, shop);

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
    title='Services' >
      <Form method="post" >
      <input type="hidden" name="action" value="import_services" />
      <input type="hidden" name="shop" value={shopdata?.shop} />
      <input type="hidden" name="domainId" value={shopdata?.domainId} />
          <Button submit>Import Now</Button>
    </Form>
      <text> Services data table </text>  
    </Page>
  );
}
