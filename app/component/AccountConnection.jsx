import { Link, AccountConnection,Collapsible } from '@shopify/polaris';
import { useState, useCallback,useEffect } from 'react';
import { Form } from '@remix-run/react';
import { motion } from 'framer-motion';


export default function AccountConnections({ data }) {
  const CrmUser = data.user;
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
    <Form method="post">
      <input type="hidden" name="intent" value={connected ? 'disconnect' : 'connect'} />

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
  );
}
