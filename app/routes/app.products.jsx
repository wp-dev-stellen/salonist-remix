import {
  Page, Button,
  IndexTable,
  LegacyCard,
  useIndexResourceState,
  Text,
  Badge,
  useBreakpoints,
} from '@shopify/polaris';
import React,{useState} from 'react';
import { useLoaderData, Form } from "@remix-run/react";
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server';
import { syncProducts } from "../salonist/productqueries.server";  
import {getProductsByShop} from "../helper/helper";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  let products;
  const { session, admin } = await authenticate.admin(request);
  const shop = session?.shop;
  const CrmData = await GetCrmCredentialsByShop(shop);
  const status = CrmData?.loginStatus;

  if (!status) { 
    return redirect('app/login/');
  }

  const domainId = CrmData?.domainId;

 products = await getProductsByShop(shop, { limit: 10, page: 1 });

  return { shop, domainId, products };
};

export const action = async ({ request }) => {
  let domainId, shop, products;
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action")?.trim();

  if (action === 'import_products') {
    shop = formData.get("shop")?.trim();
    domainId = formData.get("domainId")?.trim();
    
    if (domainId) {
      const CrmData = await GetCrmCredentialsByShop(shop);
      domainId = CrmData?.domainId;
    }

    try {
     
      await syncProducts(domainId, shop);
    } catch (error) {
      console.error("Error syncing products:", error);
      return data({
        message: { type: "error", text: "Failed to import products. Please try again later." },
      }, { status: 500 });
    }
  }

  return null;
};

export default function ProductPage() {
  const shopdata = useLoaderData();
  const products = shopdata?.products;

   const [currentPage, setCurrentPage] = useState(1);
   const [fetchedProducts, setFetchedProducts] = useState(products);

   const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
  useIndexResourceState(fetchedProducts);
 
const rowMarkup = fetchedProducts.map(
  ({ id, title, price, paymentStatus, fulfillmentStatus }, index) => (
    <IndexTable.Row
      id={id}
      key={id}
      selected={selectedResources.includes(id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{price}</IndexTable.Cell>
      <IndexTable.Cell>{paymentStatus}</IndexTable.Cell>
      <IndexTable.Cell>{fulfillmentStatus}</IndexTable.Cell>
    </IndexTable.Row>
  ),
);

// Pagination handler
const handleNextPage = async () => {
  setCurrentPage(currentPage + 1);
  const newProducts = await getProductsByShop(currentPage + 1, { limit: 10 }); // Fetch next page
  setFetchedProducts([...fetchedProducts, ...newProducts]);
};

  return (
    <Page fullWidth title="Products">
      <Form method="post">
        <input type="hidden" name="action" value="import_products" />
        <input type="hidden" name="shop" value={shopdata?.shop} />
        <input type="hidden" name="domainId" value={shopdata?.domainId} />
        <Button submit>Import Now</Button>
      </Form>
      <LegacyCard>
      <IndexTable
        condensed={useBreakpoints().smDown}
        resourceName={resourceName}
        itemCount={fetchedProducts.length}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: 'Product' },
          { title: 'Price' },
          { title: 'Qty' },
          { title: 'Status' },
        ]}
        pagination={{
          hasNext: true,
          onNext: handleNextPage,
        }}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
    </Page>


  );
}
