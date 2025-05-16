import { DeliveryMethod } from "@shopify/shopify-app-remix/server";

const Webhooks = {
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks/app/uninstalled",
  },
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks/app/orders-create",
  },
  APP_SCOPES_UPDATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks/app/scopes-update",
  }, 
};

export default Webhooks;