import React from 'react';
import { Box, Text, List } from '@forge/react';
import CatalogListItem from '../CatalogListItem';

const CatalogList = ({ catalogs, onSelect, onDelete, onUpdateRequirement, history, onUpdateCsv}) => (
  <Box paddingTop="xlarge">
    <Text size="large" weight="bold">Catálogos Existentes</Text>
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