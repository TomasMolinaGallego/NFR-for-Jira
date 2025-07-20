import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ModalTransition,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Textfield,
  TextArea,
  Button,
  Text,
  Inline,
  Box,
  Tag
} from '@forge/react';
import Notification from '../Notification';

const RequirementModal = ({ catalog, formState, onFormChange, onSubmit, onClose }) => {
  const [allRequirements, setAllRequirements] = useState([]);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [dependencySearch, setDependencySearch] = useState('');
  const [dependencyOptions, setDependencyOptions] = useState([]);
  const searchTimerRef = useRef(null);

  // Calculate the next requirement ID
  const getIdLastRequirement = useCallback(() => {
    if (catalog?.requirements?.length > 0) {
      const lastRequirement = catalog.requirements[catalog.requirements.length - 1].id;
      const lastNumber = parseInt(lastRequirement.split('-')[1], 10);
      return `${catalog.prefix}-${lastNumber + 1}`;
    }
    return `${catalog?.prefix}-1`;
  }, [catalog]);

  // Load requirements and set initial form state
  useEffect(() => {
    if (catalog) {
      const requirements = Array.isArray(catalog.requirements) 
        ? catalog.requirements.filter(req => !req.isContainer)
        : [];
      
      setAllRequirements(requirements);
      
      // Set initial form state with next ID
      if (!formState.id) {
        onFormChange(prev => ({
          ...prev,
          id: getIdLastRequirement(),
          reqDependencies: []
        }));
      }
    }
  }, [catalog, onFormChange, getIdLastRequirement]);

  // Search dependencies with debouncing
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    if (dependencySearch.trim() === '') {
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

  // Add dependency to form state
  const handleAddDependency = useCallback((requirement) => {
    if (!formState.reqDependencies.some(dep => dep.id === requirement.id)) {
      onFormChange(prev => ({
        ...prev,
        reqDependencies: [...prev.reqDependencies, requirement]
      }));
    }
    setDependencySearch('');
    setDependencyOptions([]);
  }, [formState.reqDependencies, onFormChange]);

  // Remove dependency from form state
  const handleRemoveDependency = useCallback((id) => {
    onFormChange(prev => ({
      ...prev,
      reqDependencies: prev.reqDependencies.filter(dep => dep.id !== id)
    }));
  }, [onFormChange]);

  const showSuccess = (msg) => setNotification({ type: 'success', message: msg });

  return (
    <ModalTransition>
      {catalog && (
        <Modal onClose={onClose}>
          <ModalHeader>
            <Text size="xlarge">Requirements Management: {catalog.title}</Text>
          </ModalHeader>

          <ModalBody>
            <Form>
              <Text>Requirement ID</Text>
              <Textfield
                value={formState.id || getIdLastRequirement()}
                isReadOnly
                marginBottom="medium"
              />

              <Text>Title of Requirement</Text>
              <TextArea
                label="Title of Requirement"
                value={formState.reqTitle}
                onChange={e => onFormChange(prev => ({ ...prev, reqTitle: e.target.value }))}
                isRequired
              />

              <Text>Description of the Requirement</Text>
              <TextArea
                label="Description of the Requirement"
                value={formState.reqDesc}
                onChange={e => onFormChange(prev => ({ ...prev, reqDesc: e.target.value }))}
                isRequired
              />

              <Text>Importance (0-100)</Text>
              <Textfield
                type="number"
                label="Importance"
                value={formState.reqImportant}
                onChange={e => onFormChange(prev => ({ 
                  ...prev, 
                  reqImportant: Math.min(100, Math.max(0, e.target.value))
                }))}
                isRequired
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
                      <Button 
                        key={req.id}
                        padding="small"
                        hoverBackground="neutral"
                        onClick={() => handleAddDependency(req)}
                      >
                        <Text>{req.heading} <Tag text={req.id} /></Text>
                      </Button>
                    ))}
                  </Box>
                )}
                
                {formState.reqDependencies?.length > 0 && (
                  <Box marginTop="small">
                    <Inline space="small">
                      {formState.reqDependencies.map(dep => (
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
              
              <Notification {...notification} />
            </Form>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
            <Button
              onClick={() => { 
                onSubmit(); 
                showSuccess('Requirement added successfully');
              }}
              appearance="primary"
              isDisabled={
                !formState.reqTitle?.trim() || 
                !formState.reqDesc?.trim() || 
                !formState.reqImportant ||
                isNaN(formState.reqImportant) || 
                formState.reqImportant < 0 || 
                formState.reqImportant > 100
              }
            >
              Add Requirement
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};

export default RequirementModal;