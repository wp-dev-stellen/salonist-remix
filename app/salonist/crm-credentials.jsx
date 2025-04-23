import prisma from "../db.server";

export async function upsertCrmCredentials(data) {
  try {
    if (!data.shop || !data.email || !data.domainId || !data.userid) {
      throw new Error("Missing required fields: shop, email, domainId, or userId.");
    }

    const crmCredential = await prisma.crmCredential.upsert({
      where: {
        shop: data.shop, 
      },
      update: {
        name: data.name ?? null, 
        email: data.email,
        domainId: data.domainId,
        userId: data.userid,
        clientId: data.client_id ?? null,
        clientSecret: data.client_secret ?? null,
        loginStatus: true ,
      },
      create: {
        shop: data.shop,
        name: data.name ?? null,
        email: data.email,
        domainId: data.domainId,
        userId: data.userid,
        clientId: data.client_id ?? null,
        clientSecret: data.client_secret ?? null,
        loginStatus: true ?? false,
      },
    });

    return crmCredential;
  } catch (error) {
   
    console.error("Error in upserting CRM credentials:", error);
    throw new Error('Failed to upsert CRM credentials: ' + error.message);
  }
}

/**
 * Get CRM credentials by shop domain.
 */
export async function getCrmCredentialsByShop(shop) {
  try {
    return await prisma.crmCredential.findUnique({
      where: { shop },
    });
  } catch (error) {
    console.error("Error fetching CRM credentials:", error);
    throw new Error("Unable to fetch CRM credentials.");
  }
}

/**
 * Delete CRM credentials for a given shop.
 */
export async function deleteCrmCredentials(shop) {
  try {
    return await prisma.crmCredential.delete({
      where: { shop },
    });
  } catch (error) {
    console.error("Error deleting CRM credentials:", error);
    throw new Error("Unable to delete CRM credentials.");
  }
}