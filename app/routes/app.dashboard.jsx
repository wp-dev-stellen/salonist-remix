import { useActionData, Form, useLoaderData } from "@remix-run/react";
import { Suspense, useState, useCallback } from "react";
import { Page, Link, AccountConnection, SkeletonPage, SkeletonBodyText, Layout, Text, Grid, Icon, Divider, Card, Badge } from '@shopify/polaris';
import { AppsFilledIcon } from '@shopify/polaris-icons';
import { GetCrmCredentialsByShop } from '../salonist/crm-credentials.server';
import { fetchSalonistServices, fetchSalonistPackages, fetchSalonistProducts } from "../salonist/salonist-api.server";
import { authenticate } from "../shopify.server";

// Loader function to fetch CRM credentials and data
export const loader = async ({ request }) => {
  const { session, admin, redirect } = await authenticate.admin(request);
  const shop = session?.shop;

  const CrmData = await GetCrmCredentialsByShop(shop);

  // If no CRM data or loginStatus is false, redirect to login
  if (!CrmData || CrmData.loginStatus === false) {
    return redirect('app/login/');
  }

  // Fetch Salonist data: services, products, and packages
  const Service = await fetchSalonistServices(CrmData.domainId);
  const Product = await fetchSalonistProducts(CrmData.domainId);
  const Packages = await fetchSalonistPackages(CrmData.domainId);

  // Create card data for dashboard
  const cardData = [
    {
      title: 'Products',
      total: Product.count,
      icon: AppsFilledIcon,
    },
    {
      title: 'Services',
      total: Service.count,
      icon: AppsFilledIcon,
    },
    {
      title: 'Packages',
      total: Packages.count,
      icon: AppsFilledIcon,
    },
  ];

  // Return data to the component
  return {
    user: CrmData,
    cardData: cardData,
  };
};

// Action function (currently not handling form submission)
export const action = async ({ request }) => {
  return null;
};

// Main component
export default function Index() {
  const actionData = useActionData();
  const cdata = useLoaderData();

  const CrmUser = cdata.user;
  const cardData = cdata.cardData;

  const [connected, setConnected] = useState(CrmUser.loginStatus);
  const accountName = connected ? CrmUser.name : '';

  // Handle connect/disconnect actions
  const handleAction = useCallback(() => {
    if (connected) {
      setConnected(false); // Disconnect logic
    } else {
      setConnected(true); // Connect logic
    }
  }, [connected]);

  const buttonText = connected ? 'Disconnect' : 'Connect';
  const details = connected ? 'Account connected' : 'No account connected';
  const terms = (
    <p>Welcome to Salonist, the premier booking system for efficient appointment management! With our app, you can seamlessly synchronize your Shopify bookings, product orders, and inventory management into a single CRM...</p>
  );

  return (
    <Suspense fallback={<SkeletonPage />}>
      <Page narrowWidth>
        <Form method="post">
          <input type="hidden" name="account" value={connected ? 'disconnect' : 'connect'} />
          <AccountConnection
            accountName={accountName}
            connected={connected}
            title={accountName}
            action={{
              content: buttonText,
              onAction: handleAction,
            }}
            details={details}
            termsOfService={terms}
          />
        </Form>

        <Divider />

        <div className="dashicon">
          <Grid>
            {cardData.map((item, index) => (
              <Grid.Cell key={index} columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                <div className="mainpdiv" style={{ background: 'var(--p-color-bg-surface)' }}>
                  <div className="picon">
                    <Icon source={AppsFilledIcon} tone="base" className="icon-animation" />
                  </div>
                  <div className="pdata">
                    <Text variant="headingMd" as="h2" fontWeight="medium" alignment="center" tone="subdued">
                      {item.title}
                    </Text>
                    <Text variant="bodyMd" fontWeight="semibold" tone="strong" alignment="center">
                      <Badge tone="info">{item.total}</Badge>
                    </Text>
                  </div>
                </div>
              </Grid.Cell>
            ))}
          </Grid>
        </div>
      </Page>
    </Suspense>
  );
}
