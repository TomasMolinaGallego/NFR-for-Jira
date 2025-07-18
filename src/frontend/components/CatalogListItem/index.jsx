import React, { useState, useCallback, memo, useEffect } from 'react';
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
import CSVImporter from '../CsvImporter';
import CSVRequirementsLoader from '../CsvImporter/csvImporter';

const getImportanceAppearance = (value) => {
  const num = parseInt(value) || 0;
  if (num < 33) return 'added';
  if (num < 66) return 'primary';
  return 'important';
};
/**
 * Component to display a requirement of a catalog, it can be expanded to show more details.
 * It allows editing and deleting the requirement.
 */
const CatalogListItem = memo(({
  catalog,
  onSelect,
  onDelete,
  onUpdateRequirement,
  history,
  onUpdateCsv
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);

  useEffect(() => {
    catalog.requirements = catalog.requirements.filter(req => !req.isContainer);
  });

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  /**
   * * Handler to edit a requirement. It assigns the selected requirement to the editingRequirement state.
   */
  const handleEditRequirement = useCallback((requirement) => {
    setEditingRequirement(requirement);
  }, []);

  /**
   * Handler to save changes made to a requirement. It calls the onUpdateRequirement function passed as a prop.
   */
  const handleSaveChanges = useCallback(async (updatedData) => {
    await onUpdateRequirement(catalog.id, editingRequirement.id, updatedData);
    setEditingRequirement(null);
  }, [catalog.id, editingRequirement, onUpdateRequirement]);

  /**
   * * Handler to import a CSV file. It calls the onUpdateCsv function passed as a prop.
   */
  const handleCsvImportComplete = useCallback(async () => {
    await onUpdateCsv?.();
    setIsCsvImporterOpen(false);
  }, [onUpdateCsv]);

  /**
   * Handler to change the location of the catalog only used to consult the details of a catalog.
   */
  const changeLocation = useCallback(() => {
    history.push(`/catalogues/${catalog.id}`);
  }, [catalog.id, history]);

  const renderRequirementBadges = useCallback((req) => (
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
  ), []);

  const renderRequirementDetails = useCallback((req) => (
    <Stack space="small">
      <Text weight="bold">{req.heading}</Text>
      <Text>Section: {req.section}</Text>
      <Text>{req.text}</Text>
      {renderRequirementBadges(req)}
      {req.dependencies?.length !== 0 ? <Text>Dependencies: {req.dependencies.join(', ')}</Text> : ""}
      {req.childrenIds?.length !== 0 ? <Text>Children requirements : {req.childrenIds?.join(', ')}</Text> : ""}
    </Stack>
  ), [renderRequirementBadges]);

  const renderRequirements = useCallback(() => {
    if (!catalog.requirements?.length) {
      return <Text color="disabled">There are no requirements in this catalogue</Text>;
    }

    return (
      <List testId="requirements-list">
        {catalog.requirements.map((req) => (
          <ListItem key={req.id}>
            <Inline spread="space-between" alignBlock="center">
              {renderRequirementDetails(req)}
              <Button
                iconBefore="edit"
                appearance="subtle"
                onClick={() => handleEditRequirement(req)}
                aria-label={`Editar requisito ${req.id}`}
              />
            </Inline>
          </ListItem>
        ))}
      </List>
    );
  }, [catalog.requirements, handleEditRequirement, renderRequirementDetails]);

  const handleOpenModal = () => {
    onSelect(catalog)
  }

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
                {catalog.requirements?.length || 0} requirements
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
            {renderRequirements()}
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