
import { useActionData, Form,useNavigation,useLoaderData   } from "@remix-run/react";
import { data } from "@remix-run/node";
import {
Page,
Link,
AccountConnection,
SkeletonPage,
SkeletonBodyText,
Layout,
Text,
Grid,
Icon,
Divider,
Card 
} from '@shopify/polaris';
import { AppsFilledIcon } from '@shopify/polaris-icons';
import { useState, useCallback,useEffect } from 'react';
import { GetCrmCredentialsByShop  } from  '../salonist/crm-credentials.jsx';
import { fetchSalonistServices ,fetchSalonistPackages,fetchSalonistProducts } from "../salonist/salonist-api.jsx";
import { authenticate } from "../shopify.server";

import { motion } from 'framer-motion';

export const loader = async ({ request }) => {

  const {session , admin,redirect} = await authenticate.admin(request);
  const shop = session?.shop;

  const CrmData = await GetCrmCredentialsByShop(shop);
  const Service =  await fetchSalonistServices(CrmData.domainId);
  const Product =  await fetchSalonistProducts(CrmData.domainId);
  const Packages =  await fetchSalonistPackages(CrmData.domainId);

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


  return {'user':CrmData,"cardData":cardData};
  
}

export const action = async ({ request }) => {

};

export default function Index() {

   const data = useLoaderData();
   const CrmUser = data.user;
   const cardData = data.cardData;
   const [connected, setConnected] = useState(CrmUser.loginStatus);
   const accountName = connected ? CrmUser.name : '';

   const handleAction = useCallback(() => {
  
     document.forms[0].submit();
   }, []);
 
   const buttonText = connected ? 'Disconnect' : 'Connect';
   const details = connected ? 'Account connected' : 'No account connected';
   const terms = (
     <p>Welcome to Salonist, the premier booking system for efficient 
 appointment management! With our app, you can seamlessly synchronize 
 your Shopify bookings, product orders, and inventory management into a 
 single CRM, providing you with a comprehensive and unified solution for 
 managing your entire business system.</p>
   );

  

   return (
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
        <Grid>
        {cardData.map((item, index) => (
          <Grid.Cell key={index} columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl:4 }} >
                <div className="mainpdiv" style={{ background: 'var(--p-color-bg-surface)'}}  >
                    <div className="picon">
                      <Icon source={AppsFilledIcon} tone="base" />
                    </div>
                    <div className="pdata">
                    <Text variant="headingMd" as="h2" fontWeight="medium" alignment="center" tone="subdued">
                      {item.title}
                    </Text>
                    <Text variant="bodyMd" fontWeight="semibold" tone="strong" alignment="center">
                    {item.total}
                    </Text>
                    </div>
                </div>
          </Grid.Cell>
        ))}
      </Grid>
    
    </Page>
  );
}
