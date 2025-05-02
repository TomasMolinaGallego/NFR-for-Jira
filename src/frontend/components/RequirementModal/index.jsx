import React, { useState, useEffect } from 'react';
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
} from '@forge/react';
import SearchableDropdown from '../SearchableDropdown';
import Notification from '../Notification';

/**
 * Component to create a new requirement for a catalog with a form in a modal.
 * It includes fields for the requirement title, description, type, validation method, importance, correlation, dependencies and category.
 * It also includes a notification component to display success or error messages.
 */
const RequirementModal = ({ catalog, formState, onFormChange, onSubmit, onClose }) => {
  const [allRequirements, setAllRequirements] = useState([]);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Calculate the ID of the last requirement based on the catalog prefix and the last number in the ID.
  // The ID format is expected to be "prefix-number", e.g., "CAT-1", "CAT-2", etc.
  function getIdLastRequirement() {
    if (catalog && catalog.requirements && catalog.requirements.length > 0) {
      const lastRequirement = catalog.requirements[catalog.requirements.length - 1].id;
      const lastNumber = parseInt(lastRequirement.split('-')[1], 10);
      const newNumber = lastNumber + 1;
      return catalog.prefix + "-" + newNumber;
    }
    return catalog.prefix + "-0"; // Default value if no requirements exist
  }

  // Set the ID of the new requirement in the form state when the catalog changes.
  useEffect(() => {
    if (catalog) {
      setAllRequirements(Array.isArray(catalog.requirements) ? catalog.requirements : []);
    }
  }, [catalog]);
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
              <Text>Title of Requirement</Text>
              <Textfield
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

              <Text>Type of Requirement</Text>
              <Textfield
                label="Type of Requirement"
                value={formState.reqType}
                onChange={e => onFormChange(prev => ({ ...prev, reqType: e.target.value }))}
                isRequired
              />

              <Text>Requirement Category</Text>
              <Textfield
                label="Requirement Category"
                value={formState.reqCategory}
                onChange={e => onFormChange(prev => ({ ...prev, reqCategory: e.target.value }))}
                isRequired
              />

              <Text>Importance of the Requirement (from 0 to 100)</Text>
              <Textfield
                type="number"
                label="Importance of the Requirement"
                min={0}
                max={100}
                minLength={1}
                maxLength={3}
                value={formState.reqImportant || 0}
                onChange={e => onFormChange(prev => ({ ...prev, reqImportant: e.target.value }))}
                isRequired
              />

              <Text>Method of validation</Text>
              <Textfield
                label="Method of validation"
                value={formState.reqValidation}
                onChange={e => onFormChange(prev => ({ ...prev, reqValidation: e.target.value }))}
              />

              <Text>Correlation Rule Finder (Select from the different requirements shown)</Text>
              <SearchableDropdown
                label="Select correlated requirements"
                options={allRequirements}
                selected={formState.reqCorrelation || []}
                onSelect={(selected) =>
                  onFormChange(prev => ({ ...prev, reqCorrelation: selected }))
                }
              />

              <Text>Dependency Finder (Select from the different requirements shown)</Text>
              <SearchableDropdown
                label="Select dependencies"
                options={allRequirements}
                selected={formState.reqDependencies || []}
                onSelect={(selected) =>
                  onFormChange(prev => ({ ...prev, reqDependencies: selected }))
                }
              />
              <Notification {...notification} />
            </Form>

          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
            <Button
              onClick={() => { onSubmit(); showSuccess('Requirement ' + getIdLastRequirement() + ' added') }}
              appearance="primary"
              isDisabled={!formState.reqTitle.trim() || !formState.reqDesc.trim() || !formState.reqCategory.trim() 
                ||!formState.reqType.trim() ||!formState.reqImportant.trim() ||!formState.reqValidation.trim()
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
