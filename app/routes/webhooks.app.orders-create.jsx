import { authenticate } from "../shopify.server";
import logger from '../logger/logger';
import { getProductTypeById } from '../shopify/shopifyApi';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const processedOrders = new Set();

export const action = async ({ request }) => {
  let orderId;
  const { shop, topic, payload } = await authenticate.webhook(request);
  const  { createSalonistServiceOrder } = await import('../salonist/salonist-api.server');

  // Prevent double-processing
  orderId = payload.id;

  if (processedOrders.has(orderId)) {
    logger.info(`Duplicate webhook for order ${orderId}, skipping.`);
    return new Response("Duplicate webhook skipped", { status: 200 });
  }

  processedOrders.add(orderId);
  setTimeout(() => processedOrders.delete(orderId), 30000);
  

  const categorizedItems = await separateLineItemsByType(payload,shop);
  const customerInfo = await extractCustomerInfo(payload);
  const orderDetial = await getOrderPaymentInfo(payload);

  console.log(categorizedItems,'categorizedItems');
  // Only call createSalonistServiceOrder if there are service items
      if (categorizedItems?.service.length > 0) {
        for (const singleService of categorizedItems.service) {
          try {
            // Pass single service item as array (if your function expects array)
           const appointment =  await createSalonistServiceOrder([singleService], customerInfo, orderDetial);

           console.log(appointment,'Appointment');

            logger.info(`Created Salonist service order for ${shop} - service id: ${singleService.id}`);

          } catch (error) {

            logger.error(`Failed to create Salonist service order for ${shop} - service id: ${singleService.id}: ${error.message}`);
          }
        }
      } else {
        logger.info(`No service items found for ${shop}, skipping service order creation.`);
      }

      logger.info(`Categorized line items for ${shop}: ${JSON.stringify(categorizedItems, null, 2)}`);
      console.log(`Received ${topic} Webhook for ${shop}`);

  return new Response("Webhook received", { status: 200 });
};


async function separateLineItemsByType(order,shop) {
  let type;
  const lineItems = order.line_items || [];
  const categorized = {
    service: [],
    retail: [],
    package: [],
    unknown: [],
  };

  for (const item of lineItems) {

    try {
    const result = await getProductTypeById(shop, item.product_id);
    if (result) {
      type = result.toLowerCase();
    }
  } catch (err) {
    console.error(`Error fetching product type for ${item.product_id}:`, err.message);
  }

    console.log(type,'type');
    const typeProperty = item?.properties?.find(
      (prop) => prop.name.toLowerCase() === '_booking_type'
    );

    if(!type){  type = typeProperty?.value?.toLowerCase();}

    switch (type) {

      case 'service': {
        const bookingDetailProp = item.properties?.find(
          (prop) => prop.name.toLowerCase() === '_booking_detail'
        );

        const service = item.properties?.find(
          (prop) => prop.name.toLowerCase() === '_serviceid'
        );

        let serviceId = service?.value || null;
        let flattenedBooking = {};

        if (bookingDetailProp?.value) {
          try {
            const detailObj = typeof bookingDetailProp.value === 'string'
              ? JSON.parse(bookingDetailProp.value)
              : bookingDetailProp.value;

            flattenedBooking = {
              ...detailObj
            };

          } catch (err) {
            console.error('Invalid _booking_detail JSON:', bookingDetailProp.value);
          }
        }

        categorized.service.push({
          id: item.variant_id || item.product_id,
          price: item.price,
          qty: item.quantity,
          serviceId,
          ...flattenedBooking
        });
        break;
      }

      case 'product':
        categorized.retail.push(item);
        break;

      case 'package':
        categorized.package.push(item);
        break;

      default:
        categorized.unknown.push(item);
        break;
    }
  }

  return categorized;
}


async function extractCustomerInfo(order) {

  const customer = order.customer || {};
  const shipping = order.shipping_address || {};
  const billing = order.billing_address || {};
  const defaultAddress = customer.default_address || {};

  
  let  phone =
    customer.phone ||
    shipping.phone ||
    billing.phone ||
    defaultAddress.phone ||
    null;

  phone = removeCountryCode(phone);

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ');

  return {
      name: name || null,
      email: customer.email || null,
      phone: phone
  };
}

function removeCountryCode(phoneNumber) {
  const parsed = parsePhoneNumberFromString(phoneNumber);

  if (parsed && parsed.isValid()) {
    return parsed.nationalNumber; // This is the number without country code
  }

  return phoneNumber; // fallback if invalid
}




async function getOrderPaymentInfo(order) {
  return {
    payment_mode: order.gateway || (order.payment_gateway_names?.[0] || null),
    subtotal: order.subtotal_price,
    grand_total: order.total_price,
    bill_date: order.created_at
  };
}


