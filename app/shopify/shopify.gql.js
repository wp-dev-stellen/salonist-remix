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

export  const PRODUCT_VARIANT_UPDATE = `mutation UpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`;

export const UPDATE_PRODUCT_MUTATION = `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
      }
      userErrors {
        field
        message
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

export const PUBLISH_PRODUCT_MUTATION = `
  mutation publishablePublish($id: ID!, $publicationId: ID!) {
    publishablePublish(id: $id, input: {publicationId: $publicationId}) {
      userErrors {
        field
        message
      }
    }
  }
`;


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

export const CHANNELS_QUERY = (afterCursor = null) => `
  {
    channels(first: 5 ${afterCursor ? `, after: "${afterCursor}"` : ""}) {
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

export const SHOP_LOCATIONS_QUERY = (afterCursor = null) => `
  locations(first: 5  ${afterCursor ? `, after: "${afterCursor}"` : ""}) {
    edges {
      node {
        id
        name
        address {
          formatted
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  }`;

export const SHOP_PRIMARY_LOCATION_QUERY =  `
  query Location {
    location {
      id
      name
      isActive
    }
  }`;


  

  export const COLLECTION_BY_HANDLE = `
  query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
    }
  }`;


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