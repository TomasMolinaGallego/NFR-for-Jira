import React from 'react';
import { Form, Textfield, TextArea, Button, Text, Box } from '@forge/react';

const CatalogForm = ({ formState, onFormChange, onSubmit }) => (
  <Form onSubmit={onSubmit}>
    <Box padding="medium">

      <Box marginTop="medium" marginBottom="medium">
        <Text>Título del catálogo</Text>
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
        <Text>Descripción del catálogo</Text>
        <TextArea
          label="Descripción"
          value={formState.catalogDesc}
          onChange={e =>
            onFormChange(prev => ({ ...prev, catalogDesc: e.target.value }))
          }
        />
      </Box>

      <Box marginBottom="5px">
        <Text>Prefijo del catálogo</Text>
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
        Crear Catálogo
      </Button>
    </Box>
  </Form>
);

export default CatalogForm;
