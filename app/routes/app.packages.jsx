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
  PaginationEndIcon,
  PaginationStartIcon,
} from '@shopify/polaris-icons';
import {
  useLoaderData,
  Form,
  useFetcher,
} from '@remix-run/react';
import { getPackagesByShop } from '../helper/helper.server';
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server';
import { authenticate } from '../shopify.server';
import { redirect, json } from '@remix-run/node';

// Client-only wrapper
export function ClientOnly({ children }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient ? children : null;
}

// Loader
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;
  const CrmData = await GetCrmCredentialsByShop(shop);
  const status = CrmData?.loginStatus;

  if (!status) return redirect('app/login/');

  const domainId = CrmData?.domainId;
  const packages = await getPackagesByShop(shop);

  return json({ shop, domainId, packages });
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

    return json({
      message: {
        type: isNew ? 'success' : 'info',
        text: isNew
          ? 'Package import started in background.'
          : 'A package import is already in progress.',
      },
    });
  }

  return json({ message: { type: 'info', text: 'No valid action provided.' } }, { status: 400 });
};

// Component
export default function PackagesPage() {
  const { shop, domainId, packages } = useLoaderData();
  const fetcher = useFetcher();

  const [initialProducts, setInitialProducts] = useState(packages || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleRows, setVisibleRows] = useState([]);
  const pageSize = 10;
  const totalPages = Math.ceil(initialProducts.length / pageSize);

  // Sync paginated data
  useEffect(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    setVisibleRows(initialProducts.slice(start, end));
  }, [currentPage, initialProducts]);

  // Auto-refresh data after import
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.message?.type === 'success') {
      fetch('/app/packages') // update path if needed
        .then(res => res.json())
        .then(data => {
          setInitialProducts(data?.packages || []);
          setCurrentPage(1);
        });
    }
  }, [fetcher]);

  const handleImportClick = () => {
    fetcher.submit(
      { action: 'import_packages', shop, domainId },
      { method: 'post' }
    );
  };

  const resourceName = {
    singular: 'Product',
    plural: 'Products',
  };

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
    </IndexTable.Row>
  ));

  return (
    <Page
      fullWidth
      title="Packages"
      primaryAction={{
        content: fetcher.state === 'submitting' ? 'Importing…' : 'Import Packages',
        onAction: handleImportClick,
        disabled: fetcher.state === 'submitting',
      }}
    >
      <Card sectioned>
        {fetcher.data?.message && (
          <Banner
            status={
              fetcher.data.message.type === 'success'
                ? 'success'
                : fetcher.data.message.type === 'info'
                ? 'info'
                : 'critical'
            }
          >
            <p>{fetcher.data.message.text}</p>
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
              { title: 'Status' },
            ]}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>

          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <Text>
              Showing {visibleRows.length} of {initialProducts.length} packages
            </Text>
            <div>
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
        </ClientOnly>
      </Card>
    </Page>
  );
}
