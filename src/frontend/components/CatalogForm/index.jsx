import React from 'react';
import { Form, Textfield, TextArea, Button, Text, Box } from '@forge/react';

/**
 * Form component to create a new catalog.
 * It includes fields for the catalog title, description, and prefix.
 */
const CatalogForm = ({ formState, onFormChange, onSubmit }) => (
  <Form onSubmit={onSubmit}>
    <Box padding="medium">
      <Box marginTop="medium" marginBottom="medium">
        <Text>Catalogue title</Text>
        <Textfield
          label="Título del Catálogo"
          value={formState.catalogTitle}
          onChange={e =>
            onFormChange(prev => ({ ...prev, catalogTitle: e.target.value }))
          }
          isRequired
        />
      </Box>

      <Box marginBottom="5px">
        <Text>Catalogue description</Text>
        <TextArea
          label="Descripción"
          value={formState.catalogDesc}
          onChange={e =>
            onFormChange(prev => ({ ...prev, catalogDesc: e.target.value }))
          }
        />
      </Box>

      <Box marginBottom="5px">
        <Text>Catalogue prefix</Text>
        <TextArea
          label="Prefijo"
          isRequired
          value={formState.catalogPrefix}
          onChange={e =>
            onFormChange(prev => ({ ...prev, catalogPrefix: e.target.value }))
          }
        />
      </Box>
          <Text></Text>
      <Button type="submit" appearance="primary">
        Create catalogue
      </Button>
    </Box>
  </Form>
);

export default CatalogForm;
