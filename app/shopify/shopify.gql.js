export const CREATE_PRODUCTS_MUTATION = `mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`;

export  const PRODUCT_VARIANT_UPDATE = `mutation shopifyUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`;

export const UPDATE_PRODUCT_MUTATION = `mutation ProductUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      title
      variants(first: 10) {
          edges {
            node {
              id
              price
              barcode
              createdAt
            }
          }
        }
    }
    userErrors {
      field
      message
    }
  }
}`;

export const DELETE_PRODUCT_MUTATION = `
  mutation productDelete($id: ID!) {
    productDelete(input: { id: $id }) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;

export const PUBLISH_PRODUCT_MUTATION = `mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) {
    shop {
      publicationCount
    }
    userErrors {
      field
      message
    }
  }
}`;


export const SET_METAFIELD = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

export const PRODUCT_DEFAULT_VARIANT_MUTATION = `
    mutation productVariantsBulkCreate($productId: ID!, $strategy: ProductVariantsBulkCreateStrategy, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(
        productId: $productId
        strategy: $strategy
        variants: $variants
      ) {
        userErrors {
          field
          message
        }
        product {
          id
        }
        productVariants {
          id
        }
      }
    }`;

  
export const UPDATE_VARIANT_MUTATION = `
  mutation UpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        price
        barcode
        createdAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_COLLECTION_MUTATION = `
    mutation createCollectionMetafields($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
      }
      userErrors {
        message
        field
      }
    }
  }`;

  export const UPDATE_COLLECTION_MUTATION = `
  mutation updateCollectionRules($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;


  export const CREATE_METAFIELD_DEFINATION = `mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition {
      id
      name
      namespace
      key
    }
    userErrors {
      field
      message
      code
    }
  }
}`;

 export const  METAFIELD_DEFINITION_QUERY  =(namespace,key,ownerType) =>{
  return ` query {
      metafieldDefinitions(first: 1, namespace:"${namespace}", key:"${key}", ownerType:${ownerType}) {
        edges {
          node {
            id
            namespace
            key
          }
        }
      }
    }`;
 };

 export const PRODUCT_BY_IDENTIFIER = `query($identifier: ProductIdentifierInput!) {
  product: productByIdentifier(identifier: $identifier) {
    id
    handle
  }
}`;

export const CHANNELS_QUERY = (afterCursor = null) => {
  const after = afterCursor ? `, after: "${afterCursor}"` : '';
  return `
    query {
      channels(first: 50 ${after}) {
        edges {
          node {
            id
            name
            handle
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;
};

export const SHOP_LOCATIONS_QUERY = (afterCursor = null) => `query {
    locations(first: 10${afterCursor ? `, after: "${afterCursor}"` : ""}) {
      edges {
        node {
          id
          name
          isActive
          address {
            formatted
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;


export const SHOP_PRIMARY_LOCATION_QUERY =  `
  query Location {
    location {
      id
      name
      isActive
    }
  }`;


  

  export const COLLECTION_BY_HANDLE = `query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
    }
  }`;


