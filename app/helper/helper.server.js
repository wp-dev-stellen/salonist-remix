import prisma from "../db.server";

export const getProductsByShop = async (shop, { limit = 10, page = 1 }) => {
  const offset = (page - 1) * limit;

  try {
    const products = await prisma.retailProduct.findMany({
      where: { shop },
      skip: offset,
      take: limit,
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


