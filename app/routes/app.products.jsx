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
  const { admin, session } = await authenticate.admin(request);

  const { syncProducts } = await import("../salonist/productqueries.server.js");
  const formData = await request.formData();
  const action = formData.get('action')?.trim();
  const shop = formData.get('shop')?.trim();

  if (action === 'import_products') {
    const { admin } = await authenticate.admin(request);

    const dummyData = {
      title: "Wireless Bluetooth Earbuds",
      body_html: "<p>High-quality sound with noise cancellation</p>",
      vendor: "AudioTech",
      product_type: "Electronics",
      status: "active",
      tags: "audio, wireless, bluetooth",
      variants: [
        {
          price: "79.99",
          sku: "BTEAR-2023",
          inventory_quantity: 50,
          option1: "Black"
        },
        {
          price: "79.99",
          sku: "BTEAR-2023-WHITE",
          inventory_quantity: 30,
          option1: "White"
        }
      ],
      options: [
        {
          name: "Color",
          values: ["Black", "White"]
        }
      ],
      images: [
        {
          src: "https://cdn.shopify.com/s/files/1/0643/9262/6408/files/image7_f9441c25-d0f6-410e-92fa-4956d8fae027.png?v=1690766400",
          alt: "Black Earbuds"
        },
        {
          src: "https://cdn.shopify.com/s/files/1/0643/9262/6408/files/image7_f9441c25-d0f6-410e-92fa-4956d8fae027.png?v=1690766400",
          alt: "White Earbuds"
        }
      ]
    };
    
    try {
      console.log(admin)
      const product = new admin.rest.resources.Product({ session: admin.session });
      product.setData({ product: dummyData });
      await product.save();
  
      return json({ 
        product: product.toJSON(),
        message: "Dummy product created successfully" 
      });
    } catch (error) {
      return json(
        { error: "Failed to create dummy product: " + error.message },
        { status: 500 }
      );
    }

   // const CrmData = await GetCrmCredentialsByShop(shop);
    // domainId = CrmData?.domainId;
    // try {
    //   await syncProducts(domainId, shop);
    // } catch (error) {
    //   console.error('Error syncing products:', error);
    //   return new Response(
    //     JSON.stringify({ message: { type: 'error', text: 'Failed to import products.' } }),
    //     { status: 500 }
    //   );
    // }
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
    title='Products' 
    secondaryActions={ 
        <Form method="post" >
          <input type="hidden" name="action" value="import_products" />
          <input type="hidden" name="shop" value={shopdata?.shop} />
          <input type="hidden" name="domainId" value={shopdata?.domainId} />
          <Button submit>Import Now</Button>
        </Form>}
      >
 

      <text> data table </text>


       
    </Page>
  );
}
