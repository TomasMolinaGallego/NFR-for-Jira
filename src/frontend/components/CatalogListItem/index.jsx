import React, { useState, useCallback, memo, useMemo } from 'react';
import {
  ListItem,
  Stack,
  Inline,
  Button,
  Text,
  Box,
  List,
  Badge
} from '@forge/react';
import EditRequirementModal from '../EditRequirementModal';

const getImportanceAppearance = (value) => {
  const num = parseInt(value) || 0;
  if (num < 33) return 'added';
  if (num < 66) return 'primary';
  return 'important';
};

const RequirementItem = memo(({ req, onEdit }) => {
  const badges = useMemo(() => (
    <Inline space="small" marginTop="small">
      {req.type && <Badge appearance="primary">{req.type}</Badge>}
      {req.category && <Badge appearance="added">{req.category}</Badge>}
      {req.important && (
        <Badge
          appearance={getImportanceAppearance(req.important)}
          max={100}
        >
          {req.important}%
        </Badge>
      )}
    </Inline>
  ), [req.type, req.category, req.important]);

  return (
    <ListItem>
      <Inline spread="space-between" alignBlock="center">
        <Stack space="small">
          <Text weight="bold">{req.heading}</Text>
          <Text>Section: {req.section}</Text>
          <Text>{req.text}</Text>
          {badges}
          {req.dependencies?.length > 0 && 
            <Text>Dependencies: {req.dependencies.join(', ')}</Text>
          }
          {req.childrenIds?.length > 0 && 
            <Text>Children requirements: {req.childrenIds.join(', ')}</Text>
          }
        </Stack>
        <Button
          iconBefore="edit"
          appearance="subtle"
          onClick={() => onEdit(req)}
          aria-label={`Editar requisito ${req.id}`}
        />
      </Inline>
    </ListItem>
  );
});

const CatalogListItem = memo(({
  catalog: originalCatalog,
  onSelect,
  onDelete,
  onUpdateRequirement,
  history,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  
  const catalog = useMemo(() => ({
    ...originalCatalog,
    requirements: (originalCatalog.requirements || [])
      .filter(req => !req.isContainer)
  }), [originalCatalog]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleEditRequirement = useCallback((requirement) => {
    setEditingRequirement(requirement);
  }, []);

  const handleSaveChanges = useCallback(async (updatedData) => {
    if (editingRequirement) {
      await onUpdateRequirement(catalog.id, editingRequirement.id, updatedData);
      setEditingRequirement(null);
    }
  }, [catalog.id, editingRequirement, onUpdateRequirement]);

  const changeLocation = useCallback(() => {
    history.push(`/catalogues/${catalog.id}`);
  }, [catalog.id, history]);

  const handleOpenModal = useCallback(() => {
    onSelect(catalog);
    setIsExpanded(false);
  }, [catalog, onSelect]);

  const requirementsList = useMemo(() => {
    if (!catalog.requirements?.length) {
      return <Text color="disabled">There are no requirements in this catalogue</Text>;
    }

    return (
      <List testId="requirements-list">
        {catalog.requirements.map(req => (
          <RequirementItem 
            key={req.id} 
            req={req} 
            onEdit={handleEditRequirement} 
          />
        ))}
      </List>
    );
  }, [catalog.requirements, handleEditRequirement]);

  return (
    <ListItem padding="medium" background="neutralSubtle" borderRadius="normal">
      <Stack space="medium">
        <Inline spread="space-between" alignBlock="center">
          <Inline space="medium" alignBlock="center">
            <Button
              appearance="subtle"
              iconBefore={isExpanded ? 'chevron-down' : 'chevron-right'}
              onClick={toggleExpanded}
              aria-label={isExpanded ? 'Contraer catálogo' : 'Expandir catálogo'}
            />
            <Stack space="xsmall">
              <Text weight="bold">{catalog.title}</Text>
              <Text color="subtlest" size="small">{catalog.description}</Text>
              <Text size="small" color="disabled">
                {catalog.requirements.length} requirements
              </Text>
            </Stack>
          </Inline>

          <Inline space="medium">
            <Button
              onClick={changeLocation}
              iconBefore="eye-open"
              appearance="primary"
            >
              Details
            </Button>
            <Button
              onClick={handleOpenModal}
              iconBefore="add"
              appearance="default"
            >
              New Requirement
            </Button>
            <Button
              onClick={() => onDelete(catalog.id)}
              iconBefore="trash"
              appearance="danger"
              aria-label="Eliminar catálogo"
            />
          </Inline>
        </Inline>

        {isExpanded && (
          <Box padding="medium" border="standard" borderRadius="normal">
            {requirementsList}
          </Box>
        )}

        {editingRequirement && (
          <EditRequirementModal
            requirement={editingRequirement}
            onClose={() => setEditingRequirement(null)}
            onSave={handleSaveChanges}
          />
        )}
      </Stack>
    </ListItem>
  );
});

export default CatalogListItem;