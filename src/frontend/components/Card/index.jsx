import React, { useState, useCallback, memo, useEffect } from 'react';
import { Box, Text, Stack, Inline, Badge, Button, ListItem, List, Lozenge } from '@forge/react';
import EditRequirementModal from '../EditRequirementModal';

const getBadgeAppearance = (value) => {
    const num = Math.max(0, Math.min(value, 100));
    if (num < 33) return 'added';
    if (num < 66) return 'primary';
    return 'important';
};
/**
 * Component to display a requirement card.
 * It shows the requirement title, description, and other details.
 * It also allows editing and deleting the requirement.
 * {@param {Object} req - The requirement object to display.
 * @param {Function} onUpdateRequirement - Function to call when updating the requirement.
 * @param {Function} onDeleteRequirement - Function to call when deleting the requirement.
 */
const Card = memo(({ req, onUpdateRequirement, onDeleteRequirement }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Switches the expanded state of the card.
    const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

    // Opens the edit modal with the current requirement data.
    const handleEditRequirement = useCallback(() => {
        setEditingRequirement(req);
        setIsEditModalOpen(true);
    }, [req]);

    // Handles the save action in the edit modal, updates the requirement, and closes the modal.
    const handleSaveChanges = useCallback(async (updatedData) => {
        try {
            await onUpdateRequirement(req.catalogId, req.id, updatedData);
        } finally {
            setIsEditModalOpen(false);
            setEditingRequirement(null);
        }
    }, [onUpdateRequirement, req.catalogId, req.id]);

    // Handles the delete action, confirms with the user, and calls the delete function.
    const handleDeleteConfirmation = useCallback(() => {
        onDeleteRequirement(req.catalogId, req.id);
    }, [onDeleteRequirement, req.catalogId, req.id]);

    const renderBadges = useCallback(() => (
        <>
            {req.type && <Badge>{req.type}</Badge>}
            {req.category && <Badge>{req.category}</Badge>}
            {req.important && <Lozenge max='100'>Importance: {req.important}</Lozenge>}
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
                    <Text size="large" weight="bold">{`${req.id} ${req.heading}`}</Text>
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
                                        <Text>Section: {req.section}</Text>
                                        <Text>{req.text}</Text>
                                        {renderBadges()}
                                        {req.dependencies?.length !== 0 && <Text>Dependencies: {req.dependencies.join(', ')}</Text>}
                                        {req.childrenIds?.length !== 0 && <Text>Children requirements : {req.childrenIds?.join(', ')}</Text>}
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