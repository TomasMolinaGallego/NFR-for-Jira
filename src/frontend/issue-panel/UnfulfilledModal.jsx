import React, { useState } from 'react';
import {
  ModalTransition,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Text,
  TextArea,
  ButtonGroup
} from '@forge/react';

const UnfulfilledStatusModal = ({ 
  requirementId,
  onClose,
  onConfirm 
}) => {
  const [status, setStatus] = useState('');
  const [explanation, setExplanation] = useState('');

  const handleConfirm = () => {
    onConfirm({
      status,
      explanation
    });
    onClose();
  };

  return (
    <ModalTransition>
      <Modal onClose={onClose}>
        <ModalHeader>
          <Text size="xlarge">Set Requirement Status - {requirementId}</Text>
        </ModalHeader>

        <ModalBody>
          <Text weight="medium">Select status:</Text>
          <ButtonGroup>
            <Button 
              appearance={status === 'Unfulfilled' ? 'primary' : 'default'}
              onClick={() => setStatus('Unfulfilled')}
            >
              Unfulfilled
            </Button>
            <Button
              appearance={status === 'accept_risk' ? 'primary' : 'default'}
              onClick={() => setStatus('accept_risk')}
            >
              Accept Risk
            </Button>
          </ButtonGroup>

          <Box marginTop="medium">
            <Text weight="medium">Explanation</Text>
            <TextArea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Describe the reason for this status..."
              resize="vertical"
              minimumRows={3}
            />
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            appearance="primary"
            onClick={handleConfirm}
            isDisabled={!status}
          >
            Confirm Status
          </Button>
        </ModalFooter>
      </Modal>
    </ModalTransition>
  );
};

export default UnfulfilledStatusModal;