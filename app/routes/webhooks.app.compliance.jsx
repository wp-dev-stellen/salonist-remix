import { authenticate } from '../shopify.server';
import db from '../db.server';

/**
 * @param {import('@remix-run/node').ActionFunctionArgs} param0
 */
export const action = async ({ request }) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  switch (topic) {
    case 'CUSTOMERS_DATA_REQUEST':
      console.log(`GDPR: CUSTOMER_DATA_REQUEST received from ${shop}`);
      return new Response('Customer data request acknowledged', { status: 200 });

    case 'CUSTOMERS_REDACT':
      console.log(`GDPR: CUSTOMER_REDACT request from ${shop}`);
      return new Response('Customer redaction acknowledged', { status: 200 });

    case 'SHOP_REDACT':
      console.log(`GDPR: SHOP_REDACT request from ${shop}`);
      return new Response('Shop redaction acknowledged', { status: 200 });

    default:
      return new Response('Unhandled webhook topic', { status: 404 });
  }

  return new Response('Webhook handled', { status: 200 });
};
