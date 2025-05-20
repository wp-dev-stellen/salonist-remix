import React, { useState,useEffect} from 'react';
import {Page, Button, Text, Banner, Card, IndexTable, useIndexResourceState, Icon, Badge,Modal,Spinner } from '@shopify/polaris';
import {PaginationEndIcon, PaginationStartIcon, } from '@shopify/polaris-icons';
import { useLoaderData, Form ,useActionData,useSubmit,useNavigation  } from '@remix-run/react';
import { getServicesByShop } from '../helper/helper.server';
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server';
import { authenticate } from '../shopify.server';
import {data} from '@remix-run/node';

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
  const { session ,redirect } = await authenticate.admin(request);
  const shop = session?.shop;
  const CrmData = await GetCrmCredentialsByShop(shop);
  const status = CrmData?.loginStatus;

  if (!status) {
    return redirect('app/login/');
  }

  const domainId = CrmData?.domainId;
  const services = await getServicesByShop(shop);

  return { shop, domainId, services };
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
  const navigation = useNavigation();
  const isLoading = navigation.state === 'submitting' || navigation.state === 'loading';
    const [selectedSevice, setSelectedSevice] = useState(null);
  const initialProducts = shopdata?.services || [];
  const submit = useSubmit(); 

  const handleImportClick = async (shop ,domainId) => {
    submit({action: 'import_services', shop, domainId, },{ method: 'post' });
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

  const resourceName = {singular: 'service', plural: 'services', };


  const rowMarkup = visibleRows.map((product, index) => (
    <IndexTable.Row id={product.id} key={product.id} selected={false} position={index} >
      <IndexTable.Cell><Text variation="strong">{product.serviceId}</Text></IndexTable.Cell>
      <IndexTable.Cell>{product.name}</IndexTable.Cell>
      <IndexTable.Cell>{product.price || 'N/A'}</IndexTable.Cell>
      <IndexTable.Cell>{product.time}</IndexTable.Cell>
      <IndexTable.Cell>
        {product.shopifyProductId ? (
          <Badge tone="success">Imported</Badge>
        ) : (
          <Badge tone="attention">Pending</Badge>
        )}
      </IndexTable.Cell>
      <IndexTable.Cell>
         <Button size="slim" onClick={() => setSelectedSevice(product)}>Info</Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
  <Page 
    fullWidth
    title='Services'
    primaryAction={{
      content: 'Import Services', 
      onAction: () => handleImportClick(shopdata?.shop, shopdata?.domainId),
    }}
     >
      <Card sectioned>
       {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner accessibilityLabel="Loading products" size="large" />
        </div>
      ) : (
        <>

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
                    { title: 'Duration' },
                    { title: 'Status' },
                  ]}
                  selectable={false}
                >
                  {rowMarkup}
                </IndexTable>

                <div className='pagination' style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Showing {visibleRows.length} of {initialProducts.length} services</Text>
                    <div className='pagination-icon' style={{ display: 'flex' ,gap: '15px' }}>
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

    {/** Modal */}
          {selectedSevice && (
            <Modal
              open
              onClose={() => setSelectedSevice(null)}
              title={`Service  Info: ${selectedSevice.title}`}
              primaryAction={{ content: 'Close', onAction: () => setSelectedSevice(null) }}
            >
              <Modal.Section>
                <Text as="p"><strong>ID:</strong> {selectedSevice.serviceId}</Text>
                <Text as="p"><strong>Title:</strong> {selectedSevice.name}</Text>
                <Text as="p"><strong>Price:</strong> {selectedSevice.price || 'N/A'}</Text>
                <Text as="p"><strong>Status:</strong> {selectedSevice.shopifyProductId ? 'Imported' : 'Pending'}</Text>
              </Modal.Section>
            </Modal>
          )}
   {/** End Modal */}
            </>
          )}  
      </Card>
      
    </Page>
  );
}
