import React, {Suspense,useState, useEffect, useMemo } from 'react';
import {
  Page,
  Button,
  Text,
  Banner,
  Card,
  IndexTable,
  Icon,
  Badge,
  Modal,
  Spinner,
} from '@shopify/polaris';
import { PaginationEndIcon, PaginationStartIcon } from '@shopify/polaris-icons';
import {
  useLoaderData,
  useActionData,
  useSubmit,
  useNavigation,
} from '@remix-run/react';
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server';
import { authenticate } from '../shopify.server';
import { data } from '@remix-run/node';

// ClientOnly with fade-in effect
export function ClientOnly({ children }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient ? children : null;
}

export const loader = async ({ request }) => {
  const { session, redirect } = await authenticate.admin(request);
  const { getProductsByShop } = await import('../helper/helper.server');
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
  const { startOrReuseImportJob } = await import('../salonist/ImportJob.server.js');
  const formData = await request.formData();
  const action = formData.get('action')?.trim();
  const shop = formData.get('shop')?.trim();

  if (action === 'import_products') {
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

    return data(
      {
        message: {
          type: isNew ? 'success' : 'info',
          text: isNew
            ? 'Product import started in background.'
            : 'A Product import is already in progress.',
        },
      },
      { status: 200 }
    );
  }

  return data({ message: { type: 'info', text: 'No valid action provided.' } }, { status: 400 });
};

// Memoized Product Row component
const ProductRow = React.memo(({ product, index, onSelect }) => (
  <IndexTable.Row id={product.id} key={product.id} selected={false} position={index}>
    <IndexTable.Cell>
      <Text variation="strong">{product.crmProductId}</Text>
    </IndexTable.Cell>
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
    <IndexTable.Cell>
      <Button size="slim" onClick={() => onSelect(product)}>
        Info
      </Button>
    </IndexTable.Cell>
  </IndexTable.Row>
));

export default function ProductPage() {
  const shopdata = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const isLoading = navigation.state === 'submitting' || navigation.state === 'loading';

  // Debounced spinner state to avoid flickering
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

  const [selectedProduct, setselectedProduct] = useState(null);
  const initialProducts = shopdata.products || [];

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(initialProducts.length / pageSize);

  const visibleRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return initialProducts.slice(start, end);
  }, [currentPage, initialProducts]);

  const resourceName = { singular: 'Product', plural: 'Products' };

  const rowMarkup = useMemo(
    () =>
      visibleRows.map((product, index) => (
        <ProductRow key={product.id} product={product} index={index} onSelect={setselectedProduct} />
      )),
    [visibleRows]
  );

  const submit = useSubmit();

  const handleImportClick = (shop, domainId) => {
    submit({ action: 'import_products', shop, domainId }, { method: 'post' });
  };
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
      title="Products"
      primaryAction={{
        content: 'Import Products',
        onAction: () => handleImportClick(shopdata?.shop, shopdata?.domainId),
      }}
    >
      {!delayedLoadComplete || showSpinner ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner accessibilityLabel="Loading products" size="large" />
        </div>
      ) : (
        <>
          <ClientOnly>
            <Card sectioned>
              {actionData?.data?.message && (
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

              <IndexTable
                resourceName={resourceName}
                itemCount={initialProducts.length}
                headings={[
                  { title: 'ID' },
                  { title: 'Title' },
                  { title: 'Price' },
                  { title: 'Quantity' },
                  { title: 'Status' },
                   { title: 'Action' },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>

              <div
                style={{
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Text>
                  Showing {visibleRows.length} of {initialProducts.length} services
                </Text>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <Button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                    <Icon source={PaginationStartIcon} tone="base" />
                  </Button>
                  <Button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                    <Icon source={PaginationEndIcon} tone="base" />
                  </Button>
                </div>
              </div>

              {/* Modal */}
              {selectedProduct && (
                <Modal
                  open
                  onClose={() => setselectedProduct(null)}
                  title={`Package Info: ${selectedProduct.title}`}
                  primaryAction={{ content: 'Close', onAction: () => setselectedProduct(null) }}
                >
                  <Modal.Section>
                    <Text as="p">
                      <strong>ID:</strong> {selectedProduct.crmProductId}
                    </Text>
                    <Text as="p">
                      <strong>Title:</strong> {selectedProduct.title}
                    </Text>
                    <Text as="p">
                      <strong>Price:</strong> {selectedProduct.salePrice || 'N/A'}
                    </Text>
                    <Text as="p">
                      <strong>Quantity:</strong> {selectedProduct.qty || 'N/A'}
                    </Text>
                    <Text as="p">
                      <strong>Status:</strong> {selectedProduct.shopifyProductId ? 'Imported' : 'Pending'}
                    </Text>
                  </Modal.Section>
                </Modal>
              )}
              {/* End Modal */}
            </Card>
          </ClientOnly>
        </>
      )}
    </Page>
    </Suspense>
  );
}
