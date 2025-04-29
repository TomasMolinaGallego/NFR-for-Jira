import React, { useState, useCallback, memo } from 'react';
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

// Función para determinar la apariencia del badge de importancia
const getImportanceAppearance = (value) => {
  const num = parseInt(value) || 0;
  if (num < 33) return 'added';
  if (num < 66) return 'primary';
  return 'important';
};

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
  const [isCsvImporterOpen, setIsCsvImporterOpen] = useState(false);

  // Handlers memoizados
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleEditRequirement = useCallback((requirement) => {
    setEditingRequirement(requirement);
  }, []);

  const handleSaveChanges = useCallback(async (updatedData) => {
    await onUpdateRequirement(catalog.id, editingRequirement.id, updatedData);
    setEditingRequirement(null);
  }, [catalog.id, editingRequirement, onUpdateRequirement]);

  const handleCsvImportComplete = useCallback(async () => {
    await onUpdateCsv?.();
    setIsCsvImporterOpen(false);
  }, [onUpdateCsv]);

  const changeLocation = useCallback(() => {
    history.push(`/catalogues/${catalog.id}`);
  }, [catalog.id, history]);

  // Renderizado optimizado de requisitos
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
      <Text weight="medium">{req.id}</Text>
      <Text color="subtlest">{req.description}</Text>
      {renderRequirementBadges(req)}
      {req.validation && <Text size="small">Validación: {req.validation}</Text>}
      {req.correlation && <Text size="small">Correlación: {req.correlation.join(', ')}</Text>}
      {req.dependencies && <Text size="small">Dependencias: {req.dependencies.join(', ')}</Text>}
    </Stack>
  ), [renderRequirementBadges]);

  const renderRequirements = useCallback(() => {
    if (!catalog.requirements?.length) {
      return <Text color="disabled">No hay requisitos en este catálogo</Text>;
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
        {/* Cabecera del catálogo */}
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
                {catalog.requirements?.length || 0} requisitos
              </Text>
            </Stack>
          </Inline>

          <Inline space="medium">
            <Button 
              onClick={changeLocation}
              iconBefore="eye-open"
              appearance="primary"
            >
              Detalles
            </Button>
            <Button 
              onClick={handleOpenModal}
              iconBefore="add"
              appearance="default"
            >
              Nuevo Requisito
            </Button>
            <Button
              onClick={() => setIsCsvImporterOpen(isCsvImporterOpen => !isCsvImporterOpen)}
              iconBefore="upload"
              appearance="default"
            >
              Importar CSV
            </Button>
            <Button
              onClick={() => onDelete(catalog.id)}
              iconBefore="trash"
              appearance="danger"
              aria-label="Eliminar catálogo"
            />
          </Inline>
        </Inline>

        {/* Contenido expandible */}
        {isExpanded && (
          <Box padding="medium" border="standard" borderRadius="normal">
            {renderRequirements()}
          </Box>
        )}

        {/* Modales */}
        {editingRequirement && (
          <EditRequirementModal
            requirement={editingRequirement}
            onClose={() => setEditingRequirement(null)}
            onSave={handleSaveChanges}
          />
        )}

        {isCsvImporterOpen && (
          <CSVImporter
            catalogId={catalog.id}
            onComplete={handleCsvImportComplete}
            onClose={() => setIsCsvImporterOpen(false)}
          />
        )}
      </Stack>
    </ListItem>
  );
});

export default CatalogListItem;