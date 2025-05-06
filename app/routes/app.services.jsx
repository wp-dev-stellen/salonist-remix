import React, { useState,useEffect,useRef, useLayoutEffect } from 'react';
import {  Page,
  Button,
  Text,
  Banner,
  Card,
  IndexTable,
  useIndexResourceState,
  Icon,
  } from '@shopify/polaris';
  import {
    PaginationEndIcon,PaginationStartIcon
  } from '@shopify/polaris-icons';
import { useLoaderData, Form ,useActionData,useSubmit } from '@remix-run/react';
import { getServicesByShop } from '../helper/helper.server';
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server';
import { authenticate } from '../shopify.server';
import { redirect ,data} from '@remix-run/node';


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
  const products = await getServicesByShop(shop);

  return { shop, domainId, products };
};


export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const { startOrReuseImportJob  } = await import("../salonist/ImportJob.server.js");
  const formData = await request.formData();
  const actionType = formData.get('action')?.trim();
  const shop = formData.get('shop')?.trim();
  let domainId = formData.get('domainId')?.trim();

  if (actionType === 'import_services') {
    if (!domainId) {
      const CrmData = await GetCrmCredentialsByShop(shop);
      domainId = CrmData?.domainId;
    }

    const { job, isNew } = await startOrReuseImportJob({
      shop,
      domainId,
      type: 'services',
      runJob: async () => {
        const { syncServices } = await import('../salonist/ServicesQuery.server.js');
        await syncServices(domainId, shop);
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
    console.log('Importing services...');
    console.log('Shop:', shop);
    console.log('Domain ID:', domainId);
    submit(
      {
        action: 'import_services',
        shop,
        domainId,
      },
      { method: 'post' }
    );
  };
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleRows, setVisibleRows] = useState([]);

  const totalPages = Math.ceil(initialProducts.length / pageSize);
  const tableContainerRef = useRef(null);
  useEffect(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    setVisibleRows(initialProducts.slice(start, end));
  }, [currentPage, initialProducts, pageSize]);

  useLayoutEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);
  

  const resourceName = {
    singular: 'service',
    plural: 'services',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(visibleRows);

  const rowMarkup = visibleRows.map((product, index) => (
    <IndexTable.Row
      id={product.id}
      key={product.id}
      selected={false}
      // selected={selectedResources.includes(product.id)}
      position={index}
      onClick={() => handleSelectionChange(product.id)} 
    >
      <IndexTable.Cell><Text variation="strong">{product.serviceId}</Text></IndexTable.Cell>
      <IndexTable.Cell>{product.name}</IndexTable.Cell>
      <IndexTable.Cell>{product.price || 'N/A'}</IndexTable.Cell>
      <IndexTable.Cell>{product.time}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
  <Page 
    fullWidth
    title='Services' primaryAction={{
      content: 'Import Services', 
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

<div ref={tableContainerRef} className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <IndexTable
          resourceName={resourceName}
          itemCount={initialProducts.length}
         
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: 'ID' },
            { title: 'Title' },
            { title: 'Price' },
            { title: 'Duration' },
          ]}
          selectable={false}
        
         
        >
          {rowMarkup}
        </IndexTable>
</div>
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
      </Card>
      
    </Page>
  );
}
