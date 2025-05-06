import React, { useState, useEffect } from 'react';
import { 
  Page,
  Button,
  Text,
  Banner,
  Card,
  IndexTable,
  useIndexResourceState,
  Icon,
  Badge,
  } from '@shopify/polaris';
import {
  PaginationEndIcon,PaginationStartIcon
} from '@shopify/polaris-icons';
import { useLoaderData, Form ,useActionData,useSubmit } from '@remix-run/react';
import { getProductsByShop } from '../helper/helper.server';
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server'; 
import { authenticate } from '../shopify.server';
import { redirect,data  } from '@remix-run/node';

export function ClientOnly({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return children;
}

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
  const products = await getProductsByShop(shop);

  return { shop, domainId, products };
};

// Action
export const action = async ({ request }) => {
  let domainId;
  const { admin, session } = await authenticate.admin(request);
  const { startOrReuseImportJob  } = await import("../salonist/ImportJob.server.js");
  const formData = await request.formData();
  const action = formData.get('action')?.trim();
  const shop = formData.get('shop')?.trim();
  if (action === 'import_products') {

    const {session, admin } = await authenticate.admin(request);;
    const CrmData = await GetCrmCredentialsByShop(shop);
    domainId = CrmData?.domainId;
        const { job, isNew } = await startOrReuseImportJob({
            shop,
            domainId,
            type: 'Product',
            runJob: async () => {
                const { syncProducts } = await import('../salonist/ProductQuery.server.js');
                await syncProducts(domainId, shop);
             },
        });

       return data({
          message: {
            type: isNew ? 'success' : 'info',
            text: isNew
              ? 'Service import started in background.'
              : 'A service import is already in progress.',
          },
        }, { status: 200 });

  }


  return  data({ message: { type: 'info', text: 'No valid action provided.'} },{ status: 400 });
};

// Component
export default function ProductPage() {
  const actionData = useActionData();
  const shopdata = useLoaderData();
  const initialProducts = shopdata?.products || [];

  const submit = useSubmit(); 
   const handleImportClick = async (shop ,domainId) => {
      submit({action: 'import_products', shop, domainId, },{ method: 'post' });
    };
  
   const pageSize = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [visibleRows, setVisibleRows] = useState([]);
  
    const totalPages = Math.ceil(initialProducts.length / pageSize);
  
    useEffect(() => {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      setVisibleRows(initialProducts.slice(start, end));
    }, [currentPage, initialProducts, pageSize]);
  
    const resourceName = {singular: 'Product', plural: 'Products', };

      const rowMarkup = visibleRows.map((product, index) => (
        <IndexTable.Row id={product.id} key={product.id} selected={false} position={index} >
          <IndexTable.Cell><Text variation="strong">{product.crmProductId}</Text></IndexTable.Cell>
          <IndexTable.Cell>{product.title}</IndexTable.Cell>
          <IndexTable.Cell>{product.salePrice || 'N/A'}</IndexTable.Cell>
          <IndexTable.Cell>{product.qty}</IndexTable.Cell>
          <IndexTable.Cell>
            {product.shopifyProductId ? (
              <Badge tone="success">Imported</Badge>
            ) : (
              <Badge tone="attention">Pending</Badge>
            )}
          </IndexTable.Cell>
        </IndexTable.Row>
      ));

   return (
    <Page 
      fullWidth
      title='Products' primaryAction={{
        content: 'Import Products', 
        onAction: () => handleImportClick(shopdata?.shop, shopdata?.domainId),
      }} >
        <Card sectioned>
      {actionData?.data.message && (
          <Banner
            status={
              actionData?.data?.message?.type === 'success'
                ? 'success'
                : actionData?.data?.message?.type === 'info'
                ? 'info'
                : 'critical'
            }
          >
            <p>{actionData?.data?.message?.text}</p>
          </Banner>
        )}
  
     <ClientOnly>
          <IndexTable
            resourceName={resourceName}
            itemCount={initialProducts.length}
            headings={[
              { title: 'ID' },
              { title: 'Title' },
              { title: 'Price' },
              { title: 'Qunatity' },
              { title: 'Status' },
            ]}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>
          
              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <Text>Showing {visibleRows.length} of {initialProducts.length} services</Text>
                  <div>
                    <Button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                    <Icon
                      source={PaginationStartIcon}
                      tone="base"
                    />
                    </Button>
                    <Button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                    <Icon
                      source={PaginationEndIcon}
                      tone="base"
                    />
                    </Button>
                  </div>
              </div>
          </ClientOnly>
        
        </Card>
        
      </Page>
    );
}
