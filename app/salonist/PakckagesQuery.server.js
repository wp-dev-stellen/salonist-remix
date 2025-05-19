import prisma from "../db.server";
import { fetchSalonistPackages } from './salonist-api.server';
import * as shopifyApi from '../shopify/shopifyApi';

export const syncPackages = async (domainId, shop) => {
  let packages;
  try {
    /**
     * Fetch the Salonist Packages 
     */
    let packagesResponse = await fetchSalonistPackages(domainId);
     packages = packagesResponse.data?.packages || [];
    const existingPackages = await getExistingPackagesByShop(shop);
    const crmPackageIds = packages.map((pkg) => pkg?.Package.id);
    const dbPackageIds = existingPackages.map((pkg) => pkg.crmProductId);

    const packagesToDelete = existingPackages.filter(
      (pkg) => !crmPackageIds.includes(pkg.crmProductId)
    );

    for (const pkg of packagesToDelete) {
      await shopifyApi.Deleteshopifyproduct(pkg.shop, pkg.crmProductId);
      await prisma.Packages.delete({
        where: { crmProductId: pkg.crmProductId },
      });
      console.log(`Deleted package ${pkg.crmProductId} from database.`);
    }

    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    for (const p of packages) {
      try {
        console.log(p.Package.id,p.Package.id);
       const dbPackage = await upsertPackage(p, shop);
        const shopifyProduct = await shopifyApi.syncPackage(dbPackage, p);
         await updateShopifyId(p.Package.id,shopifyProduct.productid);
        console.log(`Synced package ${p.Package.id}`);
      } catch (error) {
        console.error(`Error processing package ${p.Package.id}:`, error);
      }
      await delay(500);
    }

  } catch (error) {
    console.error('Error syncing packages:', error);
    throw new Error('Failed to sync packages');
  }
};


// ✅ Upsert a package (insert or update) with full nested pkg
export async function upsertPackage(pkg, shop) {
  const {
    id,
    domainId,
    cost_price,
    show_in_app,
    name
  } = pkg.Package;

  try {
    return await prisma.Packages.upsert({
      where: {
        crmProductId: id,
      },
      update: {
        domainId,
        shop,
        title: name ?? "",
        productType:  "packages",
        sku: id ?? "",
        price: cost_price ?? "0",
        showInApp: toBoolean(show_in_app) ?? true,
        rawJson: pkg, 
      },
      create: {
        crmProductId: id,
        domainId,
        shop,
        title: name ?? "",
        productType: "packages",
        sku: id ?? "",
        price: cost_price ?? "0",
        showInApp: toBoolean(show_in_app) ?? true,
        rawJson: pkg, 
      },
    });
  } catch (error) {
    console.error("❌ Error upserting package:", error);
    throw new Error("Failed to upsert package");
  }
}

// ✅ Update the Shopify Product ID after sync
export const updateShopifyId = async (id, shopifyId) => {
  return await prisma.Packages.update({
    where: { crmProductId: id },
    data: { shopifyProductId: shopifyId }
  });
};

// ✅ Fetch all existing packages for the current shop
export async function getExistingPackagesByShop(shop) {
  try {
    const existingPackages = await prisma.Packages.findMany({
      where: { shop },
    });
    return existingPackages;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw new Error('Failed to fetch existing packages');
  }
}

// ✅ Delete packages not found in the latest CRM data
export async function deletePackagesNotInCrm(crmPackageIds, shop) {
  try {
    const validPackageIds = crmPackageIds.filter((id) => id !== undefined && id !== null);

    const deletedPackages = await prisma.Packages.deleteMany({
      where: {
        crmProductId: {
          notIn: validPackageIds,
        },
        shop,
      },
    });

    console.log(`Deleted ${deletedPackages.count} package(s) from the database.`);

  } catch (error) {
    console.error("Error deleting packages not in CRM:", error);
    throw new Error("Failed to delete packages");
  }
}


export function toBoolean(value) {
  return value === "1" || value === 1 || value === true;
}