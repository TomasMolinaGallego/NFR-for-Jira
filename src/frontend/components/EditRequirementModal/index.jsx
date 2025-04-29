import React, { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Form, Text, Textfield, TextArea, Button } from '@forge/react';
const EditRequirementModal = ({ requirement, onClose, onSave }) => {
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    if (requirement) {
      setEditedData({
        title: requirement.title,
        description: requirement.description,
        type: requirement.type,
        validation: requirement.validation,
        important: requirement.important,
        correlation: requirement.correlation,
        dependencies: requirement.dependencies,
        category: requirement.category
      });
    }
  }, [requirement]);

  const handleSubmit = (e) => {
    onSave(editedData);
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader>
        <Text size="xlarge">Editar Requisito</Text>
      </ModalHeader>
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          <Text>Título</Text>
          <Textfield
            value={editedData.title || ''}
            onChange={e => setEditedData(prev => ({ ...prev, title: e.target.value }))}
            isRequired
          />
          <Text>Descripción</Text>
          <TextArea
            label="Descripción"
            value={editedData.description || ''}
            onChange={e => setEditedData(prev => ({ ...prev, description: e.target.value }))}
            isRequired
          />

          <Text>Importancia</Text>
          <Textfield
            label="Importancia"
            type="number"
            value={editedData.important || 0}
            onChange={e => setEditedData(prev => ({ ...prev, important: Number(e.target.value) }))}
            isRequired
          />

          <Text>Tipo</Text>
          <Textfield
            label="Tipo"
            value={editedData.type || ''}
            onChange={e => setEditedData(prev => ({ ...prev, type: e.target.value }))}
            isRequired
          />
          <Text>Categoria</Text>
          <Textfield
            label="Category"
            value={editedData.category || ''}
            onChange={e => setEditedData(prev => ({ ...prev, category: e.target.value }))}
            isRequired
          />

          <Text>Validación</Text>
          <Textfield
            label="Validation"
            value={editedData.validation || ''}
            onChange={e => setEditedData(prev => ({ ...prev, validation: e.target.value }))}
            isRequired
          />


          <Text>Correlation</Text>
          <Textfield
            label="Category"
            value={editedData.correlation || ''}
            onChange={e => setEditedData(prev => ({ ...prev, correlation: e.target.value }))}
          />

          <Text>Dependencias</Text>
          <Textfield
            label="Category"
            value={editedData.dependencies || ''}
            onChange={e => setEditedData(prev => ({ ...prev, dependencies: e.target.value }))}
          />

        </Form>
      </ModalBody>
      <ModalFooter>
        <Button appearance="subtle" onClick={onClose}>Cancelar</Button>
        <Button appearance="primary" onClick={handleSubmit}>Guardar Cambios</Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditRequirementModal;