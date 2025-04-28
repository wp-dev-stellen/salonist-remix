import prisma from "../db.server";
import { fetchSalonistProducts } from './salonist-api.server';
// Sync function that imports, upserts, and deletes products
export const syncProducts = async (domainId, shop) => {
  let products ;
  try {
    // Fetch the products from the CRM API
    products = await fetchSalonistProducts(domainId);
    products = products.data;

    // Fetch existing products from the database
    const existingProducts = await getExistingProductsByShop(shop);

    // Extract CRM product IDs
   const crmProductIds = products.map((product) => product?.Product.id);

    // Extract database product IDs
    const dbProductIds = existingProducts.map((product) => product.crmProductId);

    // Find products that exist in the database but are not in the CRM response

    const productsToDelete = existingProducts.filter(
      (product) => !crmProductIds.includes(product.crmProductId)
    );

    // Delete products that are no longer in the CRM response (but exist in DB)
    for (const product of productsToDelete) {
      await prisma.RetailProduct.delete({
        where: { crmProductId: product.crmProductId },
      });
      console.log(`Deleted product ${product.crmProductId} from database.`);
    }

    // Now, loop through the CRM products and upsert or delete as necessary
    const upsertPromises = products.map(async (p) => {
      try {
        // If the product is marked as deleted in the API response, delete it from the database
        if (p.deleted) {
          await prisma.RetailProduct.delete({
            where: { crmProductId: p.id },
          });
          console.log(`Deleted product ${p.id} from database.`);
        } else {
          // Otherwise, upsert the product (update or insert)
          await upsertRetailProduct(p, shop);
        }
      } catch (error) {
        console.error(`Error processing product ${p.id}:`, error);
      }
    });

    // Wait for all the upsert operations to complete
    await Promise.all(upsertPromises);
  } catch (error) {
    console.error('Error syncing products:', error);
    throw new Error('Failed to sync products');
  }
};


// Upsert a retail product (insert or update)
export async function upsertRetailProduct(product, shop) {
  const {
    id,
    domainId,
    product_type,
    code,
    sale_price,
    qty,
    show_in_app,
    name
  } = product.Product;

  try {
    return await prisma.RetailProduct.upsert({
      where: {
        crmProductId: id,
      },
      update: {
        domainId,
        shop,
        title: name ?? "",
        productType: product_type ?? "",
        sku: code ?? "",
        salePrice: sale_price ?? "0",
        qty: qty ?? "0",
        showInApp: show_in_app ?? true,
        rawJson: product.Product,
      },
      create: {
        crmProductId: id,
        domainId,
        shop,
        title: name ?? "",
        productType: product_type ?? "",
        sku: code ?? "",
        salePrice: sale_price ?? "0",
        qty: qty ?? "0",
        showInApp: show_in_app ?? true,
        rawJson: product.Product,
      },
    });
  } catch (error) {
    console.error("❌ Error upserting product:", error);
    throw new Error("Failed to upsert product");
  }
}


export async function getExistingProductsByShop(shop) {
  try {
    const existingProducts = await prisma.RetailProduct.findMany({
      where: { shop },
    });
    return existingProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch existing products');
  }
}

// Delete products that are not present in the CRM list
export async function deleteProductsNotInCrm(crmProductIds, shop) {
  try {
    // Filter out any undefined or invalid values from crmProductIds
    const validProductIds = crmProductIds.filter((id) => id !== undefined && id !== null);

    // Delete products from the database whose crmProductId is not in the valid list
    const deletedProducts = await prisma.RetailProduct.deleteMany({
      where: {
        crmProductId: {
          notIn: validProductIds,
        },
        shop,
      },
    });

    console.log(`Deleted ${deletedProducts.count} product(s) from the database.`);
  } catch (error) {
    console.error("Error deleting products not in CRM:", error);
    throw new Error("Failed to delete products");
  }
}
