import prisma from "../db.server";
import { fetchSalonistServices } from './salonist-api.server';
import * as shopifyApi from '../shopify/shopifyApi';

export const syncServices = async (domainId, shop) => {
  let collectionId;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const res = await fetchSalonistServices(domainId);
    const services = res?.data || [];
  
    if (services.length === 0) {
      console.log("No services found.");
      return;
    }
  
    const apiPlanIds = new Set();
    const apiServiceIds = new Set();

    for (const item of services) {
      const plan = item.Plan;
      const children = item.Child;
  
      apiPlanIds.add(plan.id);
      for (const child of children) {
        apiServiceIds.add(child.id);
      }
    }
  
    // Then run delete operations *before* import
    await deleteRemovedServices(domainId, shop, apiServiceIds);
    await deleteRemovedPlans(domainId, shop, apiPlanIds);
    

  
    for (const item of services) {
      const plan = item.Plan;
      const children = item.Child;
      console.log("Plan ID:", plan.id);
      const dbPlan = await upsertPlan(shop, plan);
      collectionId = await shopifyApi.CreateandUpdateCollection(dbPlan,plan);
       await UpdateshopifyCollectionId(plan.id,collectionId);
      delay(500);
      for (const child of children) {
        console.log("child ID:", child.id,collectionId);
        const dbService =   await upsertService(shop, child);
          const serviceID = await shopifyApi.SyncServices(dbService,child,collectionId);
          await UpdateshopifyServiceId(child.id,serviceID);
        delay(500);
      }
    }

   return true;
  };


export const upsertPlan = async (shop, planData) => {
   
    const plan = await prisma.Plan.upsert({
      where: {
        planid: planData.id,
      },
      update: {
        name: planData.name,
        domainId: planData.domainId,
        shop: planData.shop,
        rawJson: planData,
        updatedAt: new Date(),
      },
      create: {
        planid: planData.id,
        name: planData.name,
        domainId: planData.domainId,
        shop: shop,
        rawJson: planData,
      },
    });

    return plan;
  };
  

 export const upsertService = async (shop, serviceData) => {
    
    const service = await prisma.Service.upsert({
      where: {
        serviceId: serviceData.id, 
      },
      update: {
        name: serviceData.name,
        domainId: serviceData.domainId,
        planId: serviceData.parent,
        shop: shop,
        productType:'Service',
        price: serviceData.price,
        time: serviceData.time ?? null,
        rawJson: serviceData,

      },
      create: {
        serviceId: serviceData.id,
        name: serviceData.name,
        domainId: serviceData.domainId,
        planId: serviceData.parent, 
        shop: shop,
        price: serviceData.price,
        time: serviceData.time ?? null,
        rawJson: serviceData,
      },
    });

    return service;
  };
  

  export const UpdateshopifyCollectionId = async (id ,shopifyId) => {
    return await prisma.Plan.update({
      where: {planid: id},
      data:{shopifyCollectionId:shopifyId}
    });
  };


  export const UpdateshopifyServiceId = async (id ,shopifyId) => {
    return await prisma.Service.update({
      where: {serviceId: id},
      data:{shopifyProductId:shopifyId}
    });
  };

/**
 * Delete Collections
 * @param {*} domainId 
 * @param {*} shop 
 * @param {*} validPlanIdsSet 
 */
 
 export  const deleteRemovedPlans = async (domainId, shop, validPlanIdsSet) => {
    const allPlans = await prisma.Plan.findMany({
      where: { domainId, shop },
      select: { planid: true}, 
    });

  const toDelete = allPlans.filter(plan => !validPlanIdsSet.has(plan.planid));

    for (const plan of toDelete) {
        try {
          
          await shopifyApi.DeleteshopifyCollection(shop,plan.planid);

          console.log(`Deleted Shopify collection for Plan: ${plan.planid}`);
        } catch (err) {
          console.warn(`Shopify deletion failed for plan ${plan.planid}:`, err.message);
        }
    }
   
    const toDeleteIds = toDelete.map(p => p.planid);
    await prisma.Plan.deleteMany({
      where: {
        planid: { in: toDeleteIds },
        domainId,
        shop,
      },
    });
  
    console.log("Deleted DB Plans:", toDeleteIds);
  };
  

  /**
   * Delete Service Product
   * 
   * @param {*} domainId 
   * @param {*} shop 
   * @param {*} validServiceIdsSet 
   */

 export  const deleteRemovedServices = async (domainId, shop, validServiceIdsSet) => {
    const allServices = await prisma.Service.findMany({
      where: { domainId, shop },
      select: { serviceId: true},
    });
  
    const toDelete = allServices.filter(service => !validServiceIdsSet.has(service.serviceId));
  
    for (const service of toDelete) {
        try {
          await shopifyApi.Deleteshopifyproduct(shop,service.serviceId);
          console.log(`Deleted Shopify product for Service: ${service.serviceId}`);
        } catch (err) {
          console.warn(`Shopify deletion failed for service ${service.serviceId}:`, err.message);
        }
    }
  
    const toDeleteIds = toDelete.map(s => s.serviceId);
    await prisma.Service.deleteMany({
      where: {
        serviceId: { in: toDeleteIds },
        domainId,
        shop,
      },
    });
  
    console.log("Deleted DB Services:", toDeleteIds);
  };
  