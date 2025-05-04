import { useActionData, Form, useLoaderData, useSubmit } from "@remix-run/react";
import { Suspense, useState, useCallback } from "react";
import {
  Page,
  AccountConnection,
  Divider,
  Grid,
  Icon,
  Text,
  Badge,
  Spinner
} from '@shopify/polaris';
import { AppsFilledIcon } from '@shopify/polaris-icons';
import { CreateMetafieldDefinition } from '../shopify/shopifyApi';
import { GetCrmCredentialsByShop ,deleteCrmCredentials} from '../salonist/crm-credentials.server';
import { fetchSalonistServices, fetchSalonistPackages, fetchSalonistProducts } from "../salonist/salonist-api.server";
import { authenticate } from "../shopify.server";

 

export const loader = async ({ request }) => {

  const { session, admin, redirect } = await authenticate.admin(request);
  const shopDomain = session?.shop;

    if(shopDomain){
      const definitions = [
        {
          name: "Salonist Product",
          namespace: "salonist",
          key: "id",
          description: "Salonist Product Id",
          type: "id",
          ownerType: "PRODUCT",
          pin: true
        },
        {
          name: "Salonist Plan ID",
          namespace: "salonist",
          key: "id",
          description: "Plan identifier from Salonist",
          type: "id",
          ownerType: "COLLECTION",
          pin: true
        }
      ];
      try {
        await Promise.all(definitions.map(def => CreateMetafieldDefinition(admin, shopDomain, def)));
        console.log('All metafield definitions created successfully');
        } catch (error) {
          console.error('Error creating metafield definitions:', error);
        }
    }

  const CrmData = await GetCrmCredentialsByShop(shopDomain);
  const status =  CrmData?.loginStatus;
  if (!status) {
    return redirect('app/login/');
  }


  const Service = await fetchSalonistServices(CrmData.domainId);
  const Product = await fetchSalonistProducts(CrmData.domainId);
  const Packages = await fetchSalonistPackages(CrmData.domainId);

  const cardData = [
    { title: 'Products', total: Product.count, icon: '' },
    { title: 'Services', total: Service.count, icon: '' },
    { title: 'Packages', total: Packages.count, icon: '' },
  ];

  return {
    user: CrmData,
    cardData
  };
};

// ACTION
export const action = async ({ request }) => {
  const { session, admin, redirect } = await authenticate.admin(request);
  const shopDomain = session?.shop;
  const formData = await request.formData();
  const action = formData.get("action")?.trim();
    if (action === 'disconnect') {
      await deleteCrmCredentials(shopDomain);
      console.log('Disconnected!');

    } 

  return null;
};

// COMPONENT
export default function Index() {
  const cdata = useLoaderData();
  const submit = useSubmit(); 
  const CrmUser = cdata.user;
  const cardData = cdata.cardData;
  const [connected, setConnected] = useState(CrmUser.loginStatus);
  const accountName = connected ? CrmUser.name : '';

  const handleAction = useCallback(() => {
    console.log('asd')
    
    submit(
      { action: connected ? 'disconnect' : 'connect' },
      { method: 'post' }
    );
   
  }, [connected]); 
  const buttonText = connected ? 'Disconnect' : 'Connect';
  const details = connected ? 'Account connected' : 'No account connected';
  const terms = (
    <p>
      Welcome to Salonist, the premier booking system for efficient appointment management! 
      With our app, you can seamlessly synchronize your Shopify bookings, product orders, 
      and inventory management into a single CRM.
    </p>
  );

  return (
    <Suspense fallback={<Spinner accessibilityLabel="Spinner example" size="large" />}>
      <Page narrowWidth>
        <Form method="post">
          {/* No need for hidden input anymore */}
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
                <div className="mainpdiv" style={{ background: 'var(--p-color-bg-surface)', padding: '20px', borderRadius: '10px' }}>
                  <div className="picon" style={{ textAlign: 'center' }}>
                    <Icon source={AppsFilledIcon}  tone="base" className="icon-animation" />
                  </div>
                  <div className="pdata" style={{ textAlign: 'center', marginTop: '10px' }}>
                    <Text variant="headingMd" as="h2" fontWeight="medium" tone="subdued">
                      {item.title}
                    </Text>
                    <Text variant="bodyMd" fontWeight="semibold" tone="strong">
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
