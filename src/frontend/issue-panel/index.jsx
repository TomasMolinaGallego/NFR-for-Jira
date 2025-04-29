import React, { useState, useEffect, useRef } from 'react';
import ForgeReconciler, {
  Box,
  Text,
  DynamicTable,
  Tag,
  Button,
  ButtonGroup
} from '@forge/react';
import { useProductContext } from '@forge/ui';
import { invoke, view } from '@forge/bridge';
import RequirementSearch from './RequirementSearch';
import { use } from 'react';

const App = () => {
  const context = useProductContext();
  const issueKey = useRef(null);

  const [linkedRequirements, setLinkedRequirements] = useState([]);

  useEffect(async () => {
    const context = await view.getContext();
    issueKey.current = context.extension.issue.key;
    loadLinkedRequirements();

  }, []);

  const loadLinkedRequirements = async () => {
    const requirements = await invoke('getLinkedRequirements', { issueKey: issueKey.current });
    setLinkedRequirements(requirements);
  };

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

  const handleUnlink = async (reqId, catalogId) => {
    await invoke('unlinkRequirement', { reqId, catalogId, issueKey: issueKey.current });
    await loadLinkedRequirements();
  };

  const setStatusRequirement = async (reqId, catalogId, status) => {
    await invoke('setStatusRequirement', { reqId,catalogId,  issueKey: issueKey.current, status });
    await loadLinkedRequirements();
  };


  const head = {
    cells: [
      {
        key: "Requisito",
        content: "Requisito",
        isSortable: true,
      },
      {
        key: "title",
        content: "Title",
        isSortable: false,
      },
      {
        key: "description",
        content: "Description",
        isSortable: false,
      },
      {
        key: "status",
        content: "Status",
        isSortable: false,
      },
      {
        key: "type",
        content: "Type",
        isSortable: false,
      },
      {
        key: "category",
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

  const linkedTableRows = linkedRequirements.map(req => ({
    cells: [
      { content: <Tag text={req.reqId} appearance="primary" /> },
      { content: req.title },
      { content: req.description },
      { content: req.status },
      { content: req.type },
      { content: req.category },
      { content: req.catalogTitle },
      { content: <ButtonGroup label="Default button group">
                    <Button onClick={() => setStatusRequirement(req.reqId, req.catalogId, 'Validated')}>Validar</Button> 
                    <Button onClick={() => setStatusRequirement(req.reqId, req.catalogId, 'Invalidated')}>Invalidar</Button> 
                    <Button onClick={() => handleUnlink(req.reqId, req.catalogId)}>Desvincular</Button> 
                  </ButtonGroup> }
    ]
  }));

  return (
    <Box padding="medium">
      <Text size="xlarge" weight="bold" marginBottom="large">
        Gestión de Requisitos NFR
      </Text>

      <Box marginBottom="xlarge">
        <RequirementSearch onSelect={handleLinkRequirement} />
      </Box>

      <Text size="large" weight="bold" marginBottom="medium">
        Requisitos Vinculados ({linkedRequirements.length})
      </Text>

      <DynamicTable
        head={head}
        rows={linkedTableRows}
        emptyView={
          <Text color="subtlest">
            No hay requisitos vinculados a este issue. Busca y selecciona requisitos arriba.
          </Text>
        }
      />
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
