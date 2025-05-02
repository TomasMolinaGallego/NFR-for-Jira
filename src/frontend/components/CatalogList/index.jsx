import React from 'react';
import { Box, Text, List } from '@forge/react';
import CatalogListItem from '../CatalogListItem';

/**
 *  Component to display a list of existing catalogs.
 *  It calls the CatalogListItem component to display each requirement of the catalog.
 */
const CatalogList = ({ catalogs, onSelect, onDelete, onUpdateRequirement, history, onUpdateCsv}) => (
  <Box paddingTop="xlarge">
    <Text size="large" weight="bold">Existing catalogues</Text>
    <List>
      {catalogs.map(catalog => (
        <CatalogListItem
          key={catalog.id}
          catalog={catalog}
          onSelect={onSelect}
          onDelete={onDelete}
          onUpdateRequirement={onUpdateRequirement}
          history={history}
          onUpdateCsv={onUpdateCsv}
        />
      ))}
    </List>
  </Box>
);

export default CatalogList;