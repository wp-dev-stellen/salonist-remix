import prisma from "../db.server";
import { fetchSalonistServices } from './salonist-api.server';
import * as shopifyApi from '../shopify/shopifyApi';

export const syncServices = async (domainId, shop) => {
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
      console.log("Plan ID:", plan.id);
      const dbPlan = await upsertPlan(shop, plan);
      delay(500);
      for (const child of children) {
        apiServiceIds.add(child.id);
        console.log("child ID:", child.id);
        const dbService =   await upsertService(shop, child);
       // shopifyApi.SyncServices();
        delay(500);
      }
    }
  
  //  await deleteRemovedServices(domainId, shop, apiServiceIds);
   // await deleteRemovedPlans(domainId, shop, apiPlanIds);

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
  
  