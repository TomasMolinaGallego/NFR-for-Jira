import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Modal, ModalHeader, ModalBody, ModalFooter, Form, 
  Text, Textfield, TextArea, Button, Box, 
  Inline, Tag 
} from '@forge/react';

const EditRequirementModal = ({ requirement, catalog, onClose, onSave }) => {
  const [editedData, setEditedData] = useState({});
  const [dependencySearch, setDependencySearch] = useState('');
  const [dependencyOptions, setDependencyOptions] = useState([]);
  const [allRequirements, setAllRequirements] = useState([]);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (requirement) {
      setEditedData({
        ...requirement,
        dependencies: requirement.dependencies || []
      });
    }

    if (catalog) {
      const requirements = (catalog.requirements || [])
        .filter(req => 
          !req.isContainer && 
          req.id !== requirement.id
        );
      setAllRequirements(requirements);
    }
  }, [requirement, catalog]);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    if (!dependencySearch.trim()) {
      setDependencyOptions([]);
      return;
    }
    
    searchTimerRef.current = setTimeout(() => {
      const searchTerm = dependencySearch.toLowerCase();
      const filtered = allRequirements.filter(req => 
        req.heading?.toLowerCase().includes(searchTerm) || 
        req.id?.toLowerCase().includes(searchTerm)
      ).slice(0, 10);
      
      setDependencyOptions(filtered);
    }, 300);
    
    return () => clearTimeout(searchTimerRef.current);
  }, [dependencySearch, allRequirements]);

  const handleAddDependency = useCallback((dep) => {
    if (!editedData.dependencies.some(d => d.id === dep.id)) {
      setEditedData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, dep]
      }));
    }
    setDependencySearch('');
    setDependencyOptions([]);
  }, [editedData.dependencies]);

  const handleRemoveDependency = useCallback((id) => {
    setEditedData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(dep => dep.id !== id)
    }));
  }, []);

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
          <Box marginBottom="medium">
            <Text>Requirement ID</Text>
            <Textfield
              value={editedData.id || ''}
              isReadOnly
            />
          </Box>

          <Text>Title</Text>
          <Textfield
            value={editedData.heading || ''}
            onChange={e => setEditedData(prev => ({ 
              ...prev, 
              heading: e.target.value 
            }))}
            isRequired
            marginBottom="medium"
          />
          
          <Text>Description</Text>
          <TextArea
            label="Description"
            value={editedData.text || ''}
            onChange={e => setEditedData(prev => ({ 
              ...prev, 
              text: e.target.value 
            }))}
            isRequired
            marginBottom="medium"
          />

          <Text>Importance (0-100)</Text>
          <Textfield
            label="Importance"
            type="number"
            value={editedData.important || 0}
            min={0}
            max={100}
            onChange={e => setEditedData(prev => ({
              ...prev,
              important: Math.min(100, Math.max(0, e.target.value))
            }))}
            isRequired
            marginBottom="medium"
          />

          <Text>Dependencies</Text>
          <Box marginBottom="medium">
            <Textfield
              placeholder="Search requirements..."
              value={dependencySearch}
              onChange={e => setDependencySearch(e.target.value)}
            />
            
            {dependencyOptions.length > 0 && (
              <Box 
                border="1px solid #DFE1E6" 
                borderRadius="3px" 
                marginTop="small"
                maxHeight="200px"
                overflow="auto"
              >
                {dependencyOptions.map(req => (
                  <Box 
                    key={req.id}
                    padding="small"
                    hoverBackground="neutral"
                    onClick={() => handleAddDependency(req)}
                  >
                    <Text>{req.heading} <Tag text={req.id} /></Text>
                  </Box>
                ))}
              </Box>
            )}
            
            {editedData.dependencies?.length > 0 && (
              <Box marginTop="small">
                <Inline space="small">
                  {editedData.dependencies.map(dep => (
                    <Tag 
                      key={dep.id}
                      text={`${dep.heading} (${dep.id})`}
                      onRemove={() => handleRemoveDependency(dep.id)}
                      isRemovable
                    />
                  ))}
                </Inline>
              </Box>
            )}
          </Box>
        </Form>
      </ModalBody>
      
      <ModalFooter>
        <Button appearance="subtle" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          appearance="primary" 
          onClick={handleSubmit}
          isDisabled={!editedData.heading?.trim() || !editedData.text?.trim()}
        >
          Save changes
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditRequirementModal;