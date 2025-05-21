import { authenticate } from "../shopify.server";
import logger from '../logger/logger';

export const action = async ({ request }) => {
  const { shop, topic,payload } = await authenticate.webhook(request);
  console.log(payload,'payload');

  logger.info(`${payload} for shop ${shop}`);
  
  console.log(`Received ${topic} Webhook for ${shop}`);

  return new Response();
};