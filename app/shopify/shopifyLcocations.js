import { unauthenticated } from '../shopify.server';
import * as ShopifyGQL from './shopify.gql';
import { upsertShopLocation } from './shopifydb'; 

export const getLocations = async (afterCursor, shop) => {
  try {
    const { admin } = await unauthenticated.admin(shop);
    const query = ShopifyGQL.SHOP_LOCATIONS_QUERY(afterCursor);
    const response = await admin.graphql(query);
    const locationData = await response.json();
    console.log(locationData.data.locations);
    return {
      nodes: locationData.data.locations.edges.map(edge => edge.node),
      hasNextPage: locationData.data.locations.pageInfo.hasNextPage,
      endCursor: locationData.data.locations.pageInfo.endCursor,
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

export const paginateAndStoreLocations = async (shop) => {
  let allNodes = [];
  let afterCursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const { nodes, hasNextPage: nextPage, endCursor } = await getLocations(afterCursor, shop);
    console.log(nodes);
    await Promise.all(
      nodes.map((location) =>
        upsertShopLocation(location, shop)
      )
    );

    allNodes = allNodes.concat(nodes);
    afterCursor = endCursor;
    hasNextPage = nextPage;
  }

  return true;
};
