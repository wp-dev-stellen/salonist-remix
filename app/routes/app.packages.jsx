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
  PaginationEndIcon, PaginationStartIcon
} from '@shopify/polaris-icons';
import { useLoaderData, useActionData, useSubmit } from '@remix-run/react';
import { getPackagesByShop } from '../helper/helper.server'; // rename this helper function accordingly
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server'; 
import { authenticate } from '../shopify.server';
import { redirect, data } from '@remix-run/node';

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
  const packages = await getPackagesByShop(shop);  

  return { shop, domainId, packages };
};

// Action
export const action = async ({ request }) => {
  let domainId;
  const { admin, session } = await authenticate.admin(request);
  const { startOrReuseImportJob  } = await import("../salonist/ImportJob.server.js");
  const formData = await request.formData();
  const action = formData.get('action')?.trim();
  const shop = formData.get('shop')?.trim();
  if (action === 'import_packages') {  
    const {session, admin } = await authenticate.admin(request);
    const CrmData = await GetCrmCredentialsByShop(shop);
    domainId = CrmData?.domainId;
    const { job, isNew } = await startOrReuseImportJob({
      shop,
      domainId,
      type: 'package',  
      runJob: async () => {
        const { syncPackages } = await import('../salonist/PackageQuery.server.js'); 
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
    }, { status: 200 });

  }

  return data({ message: { type: 'info', text: 'No valid action provided.' } }, { status: 400 });
};

// Component
export default function PackagePage() {  
  const actionData = useActionData();
  const shopdata = useLoaderData();
  const initialPackages = shopdata?.packages || [];

  const submit = useSubmit();
  const handleImportClick = async (shop, domainId) => {
    submit({ action: 'import_packages', shop, domainId }, { method: 'post' });
  };

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleRows, setVisibleRows] = useState([]);

  const totalPages = Math.ceil(initialPackages.length / pageSize);

  useEffect(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    setVisibleRows(initialPackages.slice(start, end));
  }, [currentPage, initialPackages, pageSize]);

  const resourceName = { singular: 'Package', plural: 'Packages' };

  const rowMarkup = visibleRows.map((pkg, index) => (
    <IndexTable.Row id={pkg.id} key={pkg.id} selected={false} position={index} >
      <IndexTable.Cell><Text variation="strong">{pkg.crmPackageId}</Text></IndexTable.Cell>
      <IndexTable.Cell>{pkg.title}</IndexTable.Cell>
      <IndexTable.Cell>{pkg.salePrice || 'N/A'}</IndexTable.Cell>
      <IndexTable.Cell>{pkg.qty}</IndexTable.Cell>
      <IndexTable.Cell>
        {pkg.shopifyPackageId ? (
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
      title='Packages'
      primaryAction={{
        content: 'Import Packages',
        onAction: () => handleImportClick(shopdata?.shop, shopdata?.domainId),
      }}
    >
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
            itemCount={initialPackages.length}
            headings={[
              { title: 'ID' },
              { title: 'Title' },
              { title: 'Price' },
              { title: 'Quantity' },
              { title: 'Status' },
            ]}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>

          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <Text>Showing {visibleRows.length} of {initialPackages.length} packages</Text>
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
