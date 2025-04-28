import {
  Page,
  IndexTable,
  LegacyCard,
  useIndexResourceState,
  Text,
  Box,
  Badge,
} from '@shopify/polaris';
import {DeleteIcon} from '@shopify/polaris-icons';
import React from 'react';
import { TitleBar } from "@shopify/app-bridge-react";

export default function PackagePage() {
const [currentPage, setCurrentPage] = React.useState(1);
const itemsPerPage = 2;
  const orders = [
    {
      id: '1020',
      order: '#1020',
      date: 'Jul 20 at 4:34pm',
      customer: 'Jaydon Stanton',
      total: '$969.44',
      paymentStatus: <Badge progress="complete">Paid</Badge>,
      fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
    },
    {
      id: '1019',
      order: '#1019',
      date: 'Jul 20 at 3:46pm',
      customer: 'Ruben Westerfelt',
      total: '$701.19',
      paymentStatus: <Badge progress="partiallyComplete">Partially paid</Badge>,
      fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
    },
    {
      id: '1018',
      order: '#1018',
      date: 'Jul 20 at 3.44pm',
      customer: 'Leo Carder',
      total: '$798.24',
      paymentStatus: <Badge progress="complete">Paid</Badge>,
      fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
    },
  ];
  const resourceName = {
    singular: 'order',
    plural: 'orders',
  };

  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(orders.length / itemsPerPage);


  const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(orders);

  const rowMarkup = paginatedOrders.map(
    (
      {id, order, date, customer, total, paymentStatus, fulfillmentStatus},
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {order}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{date}</IndexTable.Cell>
        <IndexTable.Cell>{customer}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            {total}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{paymentStatus}</IndexTable.Cell>
        <IndexTable.Cell>{fulfillmentStatus}</IndexTable.Cell>
      </IndexTable.Row>
    ),
  );


  const bulkActions = [
    {
      content: 'Import All',
      onAction: () => console.log('Import all Products'),
    },

  ];

  return (
    <Page fullWidth>
    <Box paddingBlockEnd="400">
      <LegacyCard>
        <IndexTable
          resourceName={resourceName}
          itemCount={orders.length}
          selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
          }
          bulkActions={bulkActions}
          onSelectionChange={handleSelectionChange}
          headings={[
            {title: 'Order'},
            {title: 'Date'},
            {title: 'Customer'},
            {title: 'Total', alignment: 'end'},
            {title: 'Payment status'},
            {title: 'Fulfillment status'},
          ]}
          pagination={{
            hasPrevious: currentPage > 1,
            onPrevious: () => setCurrentPage(currentPage - 1),
            hasNext: currentPage * itemsPerPage < orders.length,
            onNext: () => setCurrentPage(currentPage + 1),

            label:`${currentPage} of ${totalPages}`,
          }}
        >
          {rowMarkup}
        </IndexTable>

      </LegacyCard>
    </Box>
    </Page>
  );
}
