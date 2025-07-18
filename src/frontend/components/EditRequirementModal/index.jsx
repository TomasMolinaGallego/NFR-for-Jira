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
        heading: requirement.heading,
        text: requirement.text,
        important: requirement.important,
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
            value={editedData.heading || ''}
            onChange={e => setEditedData(prev => ({ ...prev, heading: e.target.value }))}
            isRequired
          />
          <Text>Description</Text>
          <TextArea
            label="Description"
            value={editedData.text || ''}
            onChange={e => setEditedData(prev => ({ ...prev, text: e.target.value }))}
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