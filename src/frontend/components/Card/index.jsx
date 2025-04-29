import React, { useState, useCallback, memo } from 'react';
import { Box, Text, Stack, Inline, Badge, Button, ListItem, List } from '@forge/react';
import EditRequirementModal from '../EditRequirementModal';

const getBadgeAppearance = (value) => {
    const num = Math.max(0, Math.min(value, 100));
    if (num < 33) return 'added';
    if (num < 66) return 'primary';
    return 'important';
};

const Card = memo(({ req, onUpdateRequirement, onDeleteRequirement }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

    const handleEditRequirement = useCallback(() => {
        setEditingRequirement(req);
        setIsEditModalOpen(true);
    }, [req]);

    const handleSaveChanges = useCallback(async (updatedData) => {
        try {
            await onUpdateRequirement(req.catalogId, req.id, updatedData);
        } finally {
            setIsEditModalOpen(false);
            setEditingRequirement(null);
        }
    }, [onUpdateRequirement, req.catalogId, req.id]);

    const handleDeleteConfirmation = useCallback(() => {
        onDeleteRequirement(req.catalogId, req.id);
    }, [onDeleteRequirement, req.catalogId, req.id]);

    const renderBadges = useCallback(() => (
        <>
            {req.type && <Badge>{req.type}</Badge>}
            {req.category && <Badge>{req.category}</Badge>}
            {req.important && <Badge max='100'>{req.important}</Badge>}
        </>
    ), [req.type, req.category, req.important]);

    return (
        <Box
            border="standard"
            borderRadius="normal"
            padding="medium"
            marginBottom="medium"
            background="neutralSubtle"
        >
            <Inline spread="space-between" alignBlock="center">
                <Button
                    appearance="subtle"
                    spacing="none"
                    onClick={toggleExpanded}
                    iconBefore={isExpanded ? 'chevron-down' : 'chevron-right'}
                >
                    <Text size="large" weight="bold">{`${req.id} ${req.title}`}</Text>
                </Button>
                {req.important && (
                    <Badge
                        max='100'
                        appearance={getBadgeAppearance(req.important)}
                    >
                        {req.important}
                    </Badge>
                )}
            </Inline>

            {isExpanded && (
                <Box padding="medium" marginTop="small" border="standard">
                    <List>
                        <ListItem>
                            <Stack>
                                <Inline spread="space-between" alignBlock="center">
                                    <Box>
                                        <Text>{req.description}</Text>
                                        {renderBadges()}
                                        {req.validation && <Text>Validación: {req.validation}</Text>}
                                        {req.correlation && <Text>Correlación: {req.correlation}</Text>}
                                        {req.dependencies && <Text>Dependencias: {req.dependencies}</Text>}
                                    </Box>
                                    <Inline>
                                        <Button
                                            appearance="subtle"
                                            iconBefore='edit'
                                            onClick={handleEditRequirement}
                                            aria-label="Editar requisito"
                                        />
                                        <Button
                                            appearance="subtle"
                                            iconBefore='trash'
                                            onClick={handleDeleteConfirmation}
                                            aria-label="Eliminar requisito"
                                        />
                                    </Inline>
                                </Inline>
                            </Stack>
                        </ListItem>
                    </List>
                </Box>
            )}

            {isEditModalOpen && (
                <EditRequirementModal
                    requirement={editingRequirement}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveChanges}
                />
            )}

        </Box>
    );
});

export default Card;