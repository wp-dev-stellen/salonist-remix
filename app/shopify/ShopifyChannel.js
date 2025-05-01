
import { unauthenticated } from '../shopify.server';
import * as ShopifyGQL from './shopify.gql';
import { upsertShopChannel } from './shopifydb';
export const getChannels = async (afterCursor, shop) => {
  try {
    const { admin } = await unauthenticated.admin(shop);
    const query = ShopifyGQL.CHANNELS_QUERY(afterCursor);
    const response = await admin.graphql(query);
    const channelsData = await response.json();

    return {
      nodes: channelsData.data.channels.edges.map(edge => edge.node),
      hasNextPage: channelsData.data.channels.pageInfo.hasNextPage,
      endCursor: channelsData.data.channels.pageInfo.endCursor,
    };
  } catch (error) {
    console.error('Error fetching channels:', error);
    throw error;
  }
};

export const paginateAndStoreChannels = async (shop) => {
  let allNodes = [];
  let afterCursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const { nodes, hasNextPage: nextPage, endCursor } = await getChannels(afterCursor, shop);
    await Promise.all(
        nodes.map((channel) =>
         upsertShopChannel(channel, shop)
        )
      );
    allNodes = allNodes.concat(nodes);
    afterCursor = endCursor;
    hasNextPage = nextPage;
  }
  return true;
};


