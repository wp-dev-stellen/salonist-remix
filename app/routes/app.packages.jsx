import React, {Suspense, useState, useEffect } from 'react';
import {Page, Button, Text, Banner, Card, IndexTable, useIndexResourceState, Icon, Badge,Modal,Spinner } from '@shopify/polaris';
import {PaginationEndIcon, PaginationStartIcon, } from '@shopify/polaris-icons';
import { useLoaderData, Form ,useActionData,useSubmit,useNavigation  } from '@remix-run/react';
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server';
import { authenticate } from '../shopify.server';
import { data } from '@remix-run/node';


export function ClientOnly({ children }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient ? children : null;
}

export const loader = async ({ request }) => {
  const { session ,redirect } = await authenticate.admin(request);

  const  { getPackagesByShop } = await import('../helper/helper.server');

  const shop = session?.shop;
  const CrmData = await GetCrmCredentialsByShop(shop);
  const status = CrmData?.loginStatus;

  if (!status) return redirect('app/login/');

  const domainId = CrmData?.domainId;
  const packages = await getPackagesByShop(shop);

  return { shop, domainId, packages };
};

// Action
export const action = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get('action')?.trim();
  const shop = formData.get('shop')?.trim();

  if (action === 'import_packages') {
    const { session } = await authenticate.admin(request);
    const CrmData = await GetCrmCredentialsByShop(shop);
    const domainId = CrmData?.domainId;

    const { startOrReuseImportJob } = await import('../salonist/ImportJob.server.js');
    const { job, isNew } = await startOrReuseImportJob({
      shop,
      domainId,
      type: 'Packages',
      runJob: async () => {
        const { syncPackages } = await import('../salonist/PakckagesQuery.server.js');
        await syncPackages(domainId, shop);
      },
    });

    return data({
      message: {
        type: isNew ? 'success' : 'info',
        text: isNew
          ? 'Package import started in background.'
          : 'A package import is already in progress.',
      }, 
    },{ status: 200 });
  }

  return data({ message: { type: 'info', text: 'No valid action provided.' } }, { status: 400 });
};

// Component
export default function PackagesPage() {

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    useEffect(() => {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }, []);


  const { shop, domainId, packages } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'submitting' || navigation.state === 'loading';

  const [showSpinner, setShowSpinner] = useState(false);
  useEffect(() => {
    let timeout;
    if (isLoading) {
      timeout = setTimeout(() => setShowSpinner(true), 200);
    } else {
      setShowSpinner(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);


  const initialProducts = packages || [];

  const [currentPage, setCurrentPage] = useState(1);

  //const [visibleRows, setVisibleRows] = useState([]);

  const [selectedPackage, setSelectedPackage] = useState(null);

  const pageSize = 10;

  const totalPages = Math.ceil(initialProducts.length / pageSize);

  /*** Import */
  const submit = useSubmit(); 
    const handleImportClick = async (shop,domainId) => {
        submit({action: 'import_packages', shop, domainId, },{ method: 'post' });
      };

 
    /** * Pagination*/
    //  useEffect(() => {
    //      const start = (currentPage - 1) * pageSize;
    //      const end = start + pageSize;
    //      setVisibleRows(initialProducts.slice(start, end));
    //    }, [currentPage, initialProducts, pageSize]);

  const [visibleRows, setVisibleRows] = useState(() => {
      const start = 0;
      const end = pageSize;
      return initialProducts.slice(start, end);
    });


    const resourceName = {singular: 'Product', plural: 'Products', };

     /** * Row Data */ 

    const rowMarkup = visibleRows.map((product, index) => (
      <IndexTable.Row id={product.id} key={product.id} selected={false} position={index}>
        <IndexTable.Cell><Text variation="strong">{product.crmProductId}</Text></IndexTable.Cell>
        <IndexTable.Cell>{product.title}</IndexTable.Cell>
        <IndexTable.Cell>{product.price || 'N/A'}</IndexTable.Cell>
        <IndexTable.Cell>
          {product.shopifyProductId ? (
            <Badge tone="success">Imported</Badge>
          ) : (
            <Badge tone="attention">Pending</Badge>
          )}
        </IndexTable.Cell>
         <IndexTable.Cell>
        <Button size="slim" onClick={() => setSelectedPackage(product)}>
          Info
        </Button>
      </IndexTable.Cell>

      </IndexTable.Row>
    ));

      const [delayedLoadComplete, setDelayedLoadComplete] = useState(false);
      
        useEffect(() => {
          const timer = setTimeout(() => {
            setDelayedLoadComplete(true);
          }, 500); 
      
          return () => clearTimeout(timer);
        }, []);



  return (
<Suspense fallback={<Spinner accessibilityLabel="Spinner example" size="large" />}>
    <Page
      fullWidth
      title="Packages"
      primaryAction={{
        content:  'Import Packages',
        onAction: () => handleImportClick(shop, domainId),
      }}
    >
      <ClientOnly>
      <Card sectioned>
        {!delayedLoadComplete || showSpinner ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Spinner accessibilityLabel="Loading products" size="large" />
                </div>
              ) : (
                <>
            {actionData?.data?.message && (
                  <Banner
                    status={
                      actionData?.data?.message.type === 'success'
                        ? 'success'
                        : actionData?.data?.message.type === 'info'
                        ? 'info'
                        : 'critical'
                    }
                  >
                    <p>{actionData?.data?.message.text}</p>
                  </Banner>
                )}

          <IndexTable
            resourceName={resourceName}
            itemCount={initialProducts.length}
            headings={[
              { title: 'ID' },
              { title: 'Title' },
              { title: 'Price' },
              { title: 'Status' },
               { title: 'Action' },
            ]}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>

              <div className='pagination' style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <Text>
                  Showing {visibleRows.length} of {initialProducts.length} packages
                </Text>
                <div className='pagination-icon' style={{ display: 'flex' ,gap: '15px' }}>
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <Icon source={PaginationStartIcon} tone="base" />
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Icon source={PaginationEndIcon} tone="base" />
                  </Button>
                </div>
              </div>
     
        {/** Modal */}
       {selectedPackage && (
        <Modal
          open
          onClose={() => setSelectedPackage(null)}
          title={`Package Info: ${selectedPackage.title}`}
          primaryAction={{ content: 'Close', onAction: () => setSelectedPackage(null) }}
        >
          <Modal.Section>
            <Text as="p"><strong>ID:</strong> {selectedPackage.crmProductId}</Text>
            <Text as="p"><strong>Title:</strong> {selectedPackage.title}</Text>
            <Text as="p"><strong>Price:</strong> {selectedPackage.price || 'N/A'}</Text>
            <Text as="p"><strong>Status:</strong> {selectedPackage.shopifyProductId ? 'Imported' : 'Pending'}</Text>
          </Modal.Section>
        </Modal>
      )}
       {/** End Modal */}
         </>
         )}
      </Card>
    </ClientOnly>
    </Page>
    </Suspense>
  );
}
