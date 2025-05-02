import React, { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Form, Text, Textfield, TextArea, Button } from '@forge/react';

/**
 * Component to edit a requirement of a catalog.
 * It allows editing the requirement's title, description, type, validation method, importance, correlation, dependencies and category.
 */
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

  const handleSubmit = () => {
    onSave(editedData);
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader>
        <Text size="xlarge">Edit Requirement</Text>
      </ModalHeader>
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          <Text>Title</Text>
          <Textfield
            value={editedData.title || ''}
            onChange={e => setEditedData(prev => ({ ...prev, title: e.target.value }))}
            isRequired
          />
          <Text>Description</Text>
          <TextArea
            label="Description"
            value={editedData.description || ''}
            onChange={e => setEditedData(prev => ({ ...prev, description: e.target.value }))}
            isRequired
          />

          <Text>Importance</Text>
          <Textfield
            label="Importance"
            type="number"
            value={editedData.important || 0}
            min={0}
            max={100}
            onChange={e => setEditedData(prev => ({ ...prev, important: Number(e.target.value) }))}
            isRequired
          />

          <Text>Type</Text>
          <Textfield
            label="Type"
            value={editedData.type || ''}
            onChange={e => setEditedData(prev => ({ ...prev, type: e.target.value }))}
            isRequired
          />
          <Text>Category</Text>
          <Textfield
            label="Category"
            value={editedData.category || ''}
            onChange={e => setEditedData(prev => ({ ...prev, category: e.target.value }))}
            isRequired
          />

          <Text>Method of validation</Text>
          <Textfield
            label="Method of validation"
            value={editedData.validation || ''}
            onChange={e => setEditedData(prev => ({ ...prev, validation: e.target.value }))}
            isRequired
          />


          <Text>Requirement correlated</Text>
          <Textfield
            label="Correlation"
            value={editedData.correlation || ''}
            onChange={e => setEditedData(prev => ({ ...prev, correlation: e.target.value }))}
          />

          <Text>Requirements dependency</Text>
          <Textfield
            label="dependencies"
            value={editedData.dependencies || ''}
            onChange={e => setEditedData(prev => ({ ...prev, dependencies: e.target.value }))}
          />

        </Form>
      </ModalBody>
      <ModalFooter>
        <Button appearance="subtle" onClick={onClose}>Cancel</Button>
        <Button appearance="primary" onClick={handleSubmit}>Save changes</Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditRequirementModal;