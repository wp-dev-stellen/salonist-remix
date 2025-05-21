import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

 // await db.session.deleteMany({ where: { shop } });
  const modelsToDelete = ['session', 'RetailProduct','Plan','Service', 'Packages','ImportJob','ShopLocations','ShopChannel','CrmCredential'];

  if (session) {
    await Promise.all(
      modelsToDelete.map(model =>
        db[model].deleteMany({ where: { shop } })
      )
    );
  }

  return new Response();
};
