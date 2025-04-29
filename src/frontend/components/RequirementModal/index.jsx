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
  List,
  ListItem,
  Text,
  Box,
} from '@forge/react';
import SearchableDropdown from '../SearchableDropdown';
import Notification from '../Notification';
const RequirementModal = ({ catalog, formState, onFormChange, onSubmit, onClose }) => {
  // For some reason this doesn't work
  //const [allRequirements, setAllRequirements] = useState([]);
  const [allRequirements, setAllRequirements] = useState([]);
  const [notification, setNotification] = useState({ type: '', message: '' });

  function getIdLastRequirement() {
    if (catalog && catalog.requirements && catalog.requirements.length > 0) {
      const lastRequirement = catalog.requirements[catalog.requirements.length - 1].id;
      const lastNumber = parseInt(lastRequirement.split('-')[1], 10);
      const newNumber = lastNumber + 1;
      return catalog.prefix + "-" + newNumber;
    }
    return catalog.prefix + "-0"; // Default value if no requirements exist
  }

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
            <Text size="xlarge">Gestión de Requisitos: {catalog.title}</Text>
          </ModalHeader>

          <ModalBody>
            <Form>
              <Text>Título del Requisito</Text>
              <Textfield
                label="Título del Requisito"
                value={formState.reqTitle}
                onChange={e => onFormChange(prev => ({ ...prev, reqTitle: e.target.value }))}
                isRequired
              />

              <Text>Descripción del Requisito</Text>
              <TextArea
                label="Descripción"
                value={formState.reqDesc}
                onChange={e => onFormChange(prev => ({ ...prev, reqDesc: e.target.value }))}
                isRequired
              />

              <Text>Tipo del Requisito</Text>
              <Textfield
                label="Tipo del requisito"
                value={formState.reqType}
                onChange={e => onFormChange(prev => ({ ...prev, reqType: e.target.value }))}
                isRequired
              />

              <Text>Categoría del Requisito</Text>
              <Textfield
                label="Categoría del requisito"
                value={formState.reqCategory}
                onChange={e => onFormChange(prev => ({ ...prev, reqCategory: e.target.value }))}
                isRequired
              />

              <Text>Importancia del Requisito (de 0 a 100)</Text>
              <Textfield
                type="number"
                label="Importancia del requisito"
                value={formState.reqImportant || 0}
                onChange={e => onFormChange(prev => ({ ...prev, reqImportant: e.target.value }))}
                isRequired
              />

              <Text>Validación del Requisito</Text>
              <Textfield
                label="Validación del requisito"
                value={formState.reqValidation}
                onChange={e => onFormChange(prev => ({ ...prev, reqValidation: e.target.value }))}
              />

              <Text>Buscador de reglas de Correlación (Se debe de seleccionar entre los distintos requisitos mostrados)</Text>
              <SearchableDropdown
                label="Selecciona requisitos correlacionados"
                options={allRequirements}
                selected={formState.reqCorrelation || []}
                onSelect={(selected) =>
                  onFormChange(prev => ({ ...prev, reqCorrelation: selected }))
                }
              />

              <Text>Buscador de Dependencias (Se debe de seleccionar entre los distintos requisitos mostrados)</Text>
              <SearchableDropdown
                label="Selecciona dependencias"
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
            <Button onClick={onClose}>Cerrar</Button>
            <Button
              onClick={() => { onSubmit(); showSuccess('Requisito ' + getIdLastRequirement() + ' añadido') }}
              appearance="primary"
              isDisabled={!formState.reqTitle.trim() || !formState.reqDesc.trim() || !formState.reqCategory.trim() 
                ||!formState.reqType.trim() ||!formState.reqImportant.trim() ||!formState.reqValidation.trim()
              }
            >
              Añadir Requisito
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};

export default RequirementModal;
