import React from 'react';
import {
  ModalTransition,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Lozenge,
  Stack
} from '@forge/react';

const STATUS_APPEARANCE = {
  Unfulfilled: 'removed',
  validated_with_risk: 'inprogress',
  accept_risk: 'new'
};

const MotivesUnfullfilmentModal = ({ requirement, onClose }) => {
  const motives = requirement?.issuesLinked?.filter(issue => 
    ['Unfulfilled', 'validated_with_risk', 'accept_risk'].includes(issue.status)
  || []);

  return (
    <ModalTransition>
      <Modal onClose={onClose}>
        <ModalHeader>
          <Text size="xlarge">Motivos - {requirement?.id}</Text>
        </ModalHeader>

        <ModalBody>
          <Stack>
            {motives.length > 0 ? (
              motives.map((issue, index) => (
                <Box key={index} padding="small" border="standard" marginBottom="small">
                  <Inline spread="space-between">
                    <Lozenge appearance={STATUS_APPEARANCE[issue.status] || 'default'}>
                      {issue.status}
                    </Lozenge>
                    <Text color="subtlest" size="small">{issue.issueKey}</Text>
                  </Inline>
                  <Text marginTop="small">{issue.explanation || 'Sin explicación proporcionada'}</Text>
                </Box>
              ))
            ) : (
              <Text color="subtlest">No se encontraron motivos registrados</Text>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </ModalFooter>
      </Modal>
    </ModalTransition>
  );
};

export default MotivesUnfullfilmentModal;