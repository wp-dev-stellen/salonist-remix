import prisma from "../db.server";

export const upsertShopChannel = async (channel, shop) => {
  const getShopifyId = (gid) => gid.match(/\/(\d+)$/)?.[1];
  const shopifyId = getShopifyId(channel.id);
  try {
    const shopChannel = await prisma.ShopChannel.upsert({
      where: {
        id:shopifyId,
      },
      update: {
       
        name: channel.name,
        handle: channel.handle,
        shop,
      },
      create: {
        id:shopifyId,
        shop,
        name: channel.name,
        handle: channel.handle,
        
      },
    });

    console.log("Successfully upserted the shop channel:", shopChannel);
    return shopChannel;
  } catch (error) {
    console.error("Error in upserting shop channel:", error);
    throw error;  
  }
};

export const getShopChannels = async (shop, handle) => {
  try {
    console.log("Fetching shop channels for shop:", shop, "with handle:", handle);

    const channels = await prisma.shopChannel.findMany({
      where: {
        shop,
        ...(handle ? { handle } : {}),
      },
    });

    console.log("shop channels inset");
    return channels;
  } catch (error) {
    console.error("Error fetching shop channels:", error);
    throw error; 
  }
};


export const upsertShopLocation = async (location, shop) => {
    const getShopifyId = (gid) => gid.match(/\/(\d+)$/)?.[1];
    const shopifyId = getShopifyId(location.id);
  
    try {
      const locationRecord = await prisma.ShopLocations.upsert({
        where: {
          locationid: shopifyId,
        },
        update: {
          shop,
          name: location.name,
          status:location.isActive,
        },
        create: {
          locationid: shopifyId,
          shop,
          name: location.name,
          status:location.isActive,
        },
      });
  
      return locationRecord;
    } catch (error) {
      console.error("Error upserting shop location:", error);
      throw error;
    }
  };

  export const  getActiveLocationsIdByShop = async (shop) => {
    const locationids =  await prisma.shopLocation.findMany({
        where: {
          shop,
          status: true,
        },
        select: {
          locationid: true,
        },
      });
      return locationids;

  }

export const getLocationsByShop = async (shop) => {
    try {
      const locations = await prisma.shopLocations.findMany({
        where: {
          shop,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return locations;
    } catch (error) {
      console.error("Error fetching locations by shop:", error);
      throw error;
    }
  };