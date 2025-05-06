import prisma from "../db.server";
import { useEffect, useState } from "react";

export const getProductsByShop = async (shop) => {
  

  try {
    const products = await prisma.retailProduct.findMany({
      where: { shop }
    });

    if (products.length === 0) {
      return null;
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
};

export const getServicesByShop = async (shop) => {
  

  try {
    const products = await prisma.Service.findMany({
      where: { shop }
    });

    if (products.length === 0) {
      return null;
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
};


 export const  capitalizeWords = async(str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

