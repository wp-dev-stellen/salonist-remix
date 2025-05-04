import prisma from "../db.server";
import { fetchSalonistProducts } from './salonist-api.server';
import * as shopifyApi from '../shopify/shopifyApi';

export const syncProducts = async (domainId, shop) => {
  let products;
  try {
    /**
     * Fetch the Salonist Products 
     */
    products = await fetchSalonistProducts(domainId);
    products = products.data;

    const existingProducts = await getExistingProductsByShop(shop);
    const crmProductIds = products.map((product) => product?.Product.id);
    const dbProductIds = existingProducts.map((product) => product.crmProductId);

    // Find products that need to be deleted
    const productsToDelete = existingProducts.filter(
      (product) => !crmProductIds.includes(product.crmProductId)
    );

    for (const product of productsToDelete) {
      await prisma.RetailProduct.delete({
        where: { crmProductId: product.crmProductId },
      });
      console.log(`Deleted product ${product.crmProductId} from database.`);
    }
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    // Sync each product with Shopify
    for (const p of products) {
      try {
        const dbproduct = await upsertRetailProduct(p, shop);
        const shopifyProduct = await shopifyApi.SyncProduct(dbproduct,p.Product);
        console.log(`Synced product ${p.Product.id}`);
      } catch (error) {
        console.error(`Error processing product ${p.Product.id}:`, error);
      }
      await delay(500); 
    }

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

export const updateshopifyId = async (id ,shopifyId) => {
  return await prisma.RetailProduct.update({
    where: {crmProductId: id},
    data:{shopifyProductId:shopifyId}
  });
};


/**
 *  Check exting products in shop
 */

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




/**
 * Delete the salonist  Products from shop 
 */

export async function deleteProductsNotInCrm(crmProductIds, shop) {
  try {
    // Filter out any undefined or invalid values from crmProductIds
    const validProductIds = crmProductIds.filter((id) => id !== undefined && id !== null);

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
