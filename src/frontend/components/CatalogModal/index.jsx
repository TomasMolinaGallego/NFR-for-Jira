import React from 'react';
import { ModalTransition, Modal, ModalHeader, ModalBody, ModalFooter, Form, Textfield, TextArea, Button, List, ListItem, Text, Box } from '@forge/react';

const RequirementModal = ({ catalog, formState, setFormState, onAddRequirement, onClose }) => (
  <ModalTransition>
    {catalog && (
      <Modal onClose={onClose}>
        <ModalHeader>
          <Text size="xlarge">Gestión de Requisitos: {catalog.title}</Text>
        </ModalHeader>
        
        <ModalBody>
          <Form>
            <Textfield
              label="Título del Requisito"
              value={formState.reqTitle}
              onChange={e => setFormState(prev => ({ ...prev, reqTitle: e.target.value }))}
              isRequired
            />
            
            <TextArea
              label="Descripción"
              value={formState.reqDesc}
              onChange={e => setFormState(prev => ({ ...prev, reqDesc: e.target.value }))}
              isRequired
            />
            
            <Button 
              onClick={onAddRequirement}
              appearance="primary"
              isDisabled={!formState.reqTitle.trim() || !formState.reqDesc.trim()}
            >
              Añadir Requisito
            </Button>
          </Form>

          <Box paddingTop="large">
            <Text weight="bold">Requisitos Registrados:</Text>
            {catalog.requirements?.length > 0 ? (
              <List>
                {catalog.requirements.map(req => (
                  <ListItem key={req.id}>
                    <Text weight="medium">{req.title}</Text>
                    <Text>{req.description}</Text>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Text color="disabled">No hay requisitos registrados</Text>
            )}
          </Box>
        </ModalBody>
        
        <ModalFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </ModalFooter>
      </Modal>
    )}
  </ModalTransition>
);

export default RequirementModal;