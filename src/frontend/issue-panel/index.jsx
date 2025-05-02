import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ForgeReconciler, {
  Box,
  Text,
  DynamicTable,
  Tag,
  Button,
  ButtonGroup,
  Lozenge,
  Modal,
  TextArea
} from '@forge/react';
import { invoke, view } from '@forge/bridge';
import RequirementSearch from './RequirementSearch';
import UnfulfilledStatusModal from './UnfulfilledModal';

/**
 * Main component for the issue panel.
 * It loads the linked requirements and allows to link/unlink them.
 * It also allows to set the status of the requirements.
 */
const App = () => {
  const issueKey = useRef(null);
  const [linkedRequirements, setLinkedRequirements] = useState([]);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleUnfulfilledClick = (reqId, catalogId) => {
    setSelectedRequirement({ reqId, catalogId });
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async ({ status, explanation }) => {
    await invoke('setStatusRequirement', { 
      reqId: selectedRequirement.reqId,
      catalogId: selectedRequirement.catalogId,
      issueKey: issueKey.current,
      status,
      explanation
    });
    await loadLinkedRequirements();
  };

  // Actualiza la definición de STATUS_APPEARANCE
  const STATUS_APPEARANCE = {
    Validated: 'success',
    pending_validation: 'inprogress',
    Unfulfilled: 'removed',
    accept_risk: 'new',
    noStatus: 'moved',
    unknown: 'default'
  };

  // Load the linked requirements when the component mounts
  useEffect(async () => {
    const context = await view.getContext();
    issueKey.current = context.extension.issue.key;
    loadLinkedRequirements();

  }, []);

  // Load the linked requirements from the server
  const loadLinkedRequirements = async () => {
    const requirements = await invoke('getLinkedRequirements', { issueKey: issueKey.current });
    setLinkedRequirements(requirements);
  };

  // Handle the linking of a requirement to the issue
  // Check if the requirement is already linked before linking it
  const handleLinkRequirement = async (requirement) => {
    if (linkedRequirements.some(req => req.reqId === requirement.id)) {
      console.error("Requisito ya vinculado");
      return;
    }
    await invoke('linkRequirementToIssue', {
      issueKey: issueKey.current,
      reqId: requirement.id,
      catalogId: requirement.catalogId,
    });
    await loadLinkedRequirements();
  };

  // Handle the unlinking of a requirement from the issue
  const handleUnlink = async (reqId, catalogId) => {
    await invoke('unlinkRequirement', { reqId, catalogId, issueKey: issueKey.current });
    await loadLinkedRequirements();
  };

  // Handle the setting of the status of a requirement
  const setStatusRequirement = async (reqId, catalogId, status) => {
    await invoke('setStatusRequirement', { reqId,catalogId,  issueKey: issueKey.current, status });
    await loadLinkedRequirements();
  };

  // Define the table head for the linked requirements
  const head = {
    cells: [
      {
        key: "Requirement",
        content: "Requirement",
        isSortable: true,
      },
      {
        key: "Title",
        content: "Title",
        isSortable: false,
      },
      {
        key: "Description",
        content: "Description",
        isSortable: false,
      },
      {
        key: "Status",
        content: "Status",
        isSortable: false,
      },
      {
        key: "Type",
        content: "Type",
        isSortable: false,
      },
      {
        key: "Category",
        content: "Category",
        isSortable: false,
      },
      {
        key: "Catalog",
        content: "Catalog",
        shouldTruncate: true,
        isSortable: false,
      },
      {
        key: "Actions",
        content: "Actions",
        shouldTruncate: true,
        isSortable: false,
      }
    ],
  };

    const getStatusLozenge = useCallback((status) => (
        <Lozenge appearance={STATUS_APPEARANCE[status] || 'default'}>
            {status}
        </Lozenge>
    ), []);

  // Define the table rows for the linked requirements
  const linkedTableRows = linkedRequirements.map(req => ({
    cells: [
      { content: <Tag text={req.reqId} appearance="primary" /> },
      { content: req.title },
      { content: req.description },
      { content: getStatusLozenge(req.status)} ,
      { content: req.type },
      { content: req.category },
      { content: req.catalogTitle },
      { content: <ButtonGroup label="Default button group">
                    <Button onClick={() => setStatusRequirement(req.reqId, req.catalogId, 'Validated')}>Validate</Button> 
                    <Button onClick={() => handleUnfulfilledClick(req.reqId, req.catalogId)}>Unfulfilled</Button>
                    <Button onClick={() => handleUnlink(req.reqId, req.catalogId)}>Unlink</Button> 
                  </ButtonGroup> }
    ]
  }));

  return (
    <Box padding="medium">
      <Text size="xlarge" weight="bold" marginBottom="large">
        NFR Requirements Management
      </Text>

      <Box marginBottom="xlarge">
        <RequirementSearch onSelect={handleLinkRequirement} />
      </Box>

      <Text size="large" weight="bold" marginBottom="medium">
        Linked Requirements ({linkedRequirements.length})
      </Text>

      <DynamicTable
        head={head}
        rows={linkedTableRows}
        emptyView={
          <Text color="subtlest">
            There are no requirements linked to this issue. Search and select requirements above
          </Text>
        }
      />
      {showStatusModal && (
        <UnfulfilledStatusModal
          requirementId={selectedRequirement?.reqId}
          onClose={() => setShowStatusModal(false)}
          onConfirm={handleStatusConfirm}
        />
      )}

    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
