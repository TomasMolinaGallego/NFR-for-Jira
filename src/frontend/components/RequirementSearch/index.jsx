import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import {
    Box,
    Text,
    Textfield,
    List,
    Button,
} from '@forge/react';
import Card from '../Card';

const RequirementSearch = ({ onValueChange, onUpdateRequirement, onDeleteRequirement, allReqs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [allRequirements, setAllRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerms, setSearchTerms] = useState('');
    const [searchText, setSearchText] = useState('');

    const selectSearchTerm = (term) => {
        if (searchTerms === term) {
            setSearchTerms('');
        } else {
            setSearchTerms(term);
        }
    }

    const loadRequirements = async () => {
        const requirements = allReqs;
        setAllRequirements(requirements);
        setLoading(false);
    };


    useEffect(() => {
        const loadData = async () => {
            await loadRequirements();
        };
        loadData();
    }, [allReqs]);

    const handleUpdateRequirement = (catalogId, reqId, updatedData) => {
        onUpdateRequirement(catalogId, reqId, updatedData);
        setResults((prev) =>
            prev.map((req) => (req.id === reqId ? { ...req, ...updatedData } : req))
        );
    };

    const handleDeleteRequirement = (catalogId, reqId) => {
        setResults((prev) => prev.filter((req) => req.id !== reqId));
        onDeleteRequirement(catalogId, reqId);
    };

    // Función de búsqueda
    const searchRequirements = (term) => {
        setSearchTerm(term);
        if (!term) {
            onValueChange(false);
            setResults([]);
            return;
        }
        
        onValueChange(true);
        var filtered;
        const lowerTerm = term.toLowerCase();
        if (searchTerms.length == 0) {
            // todo reañadir las dependencias y las correlaciones, las considera como string y no arrays
            filtered = allRequirements.filter(req => {
                const searchableText = `
            ${req.title?.toLowerCase()}
            ${req.description?.toLowerCase()}
            ${req.type?.toLowerCase()}
            ${req.category?.toLowerCase()} 
            ${req.validation?.toLowerCase()}
            ${req.catalogTitle?.toLowerCase()}
            ${req.catalogId.toLowerCase()}
          `;
                // The catalog id is only added to update the requirement
                // and not to search for it
                return searchableText.includes(lowerTerm);
            });
        } else {
            switch (searchTerms) {
                case 'title':
                    filtered = allRequirements.filter(req => { const searchableText = `${req.title?.toLowerCase()}`; return searchableText.includes(lowerTerm) });
                    break;
                case 'description':
                    filtered = allRequirements.filter(req => { const searchableText = `${req.description?.toLowerCase()}`; return searchableText.includes(lowerTerm) });
                    break;
                case 'type':
                    filtered = allRequirements.filter(req => { const searchableText = `${req.type?.toLowerCase()}`; return searchableText.includes(lowerTerm) });
                    break;
                case 'category':
                    filtered = allRequirements.filter(req => { const searchableText = `${req.category?.toLowerCase()}`; return searchableText.includes(lowerTerm) });
                    break;
                case 'validation':
                    filtered = allRequirements.filter(req => { const searchableText = `${req.validation?.toLowerCase()}`; return searchableText.includes(lowerTerm) });
                    break;
                case 'dependencies':
                    filtered = allRequirements.filter(req => { const searchableText = `${req.dependencies?.join(' ').toLowerCase()}`; return searchableText.includes(lowerTerm) });
                    break;
                case 'correlation':
                    filtered = allRequirements.filter(req => { const searchableText = `${req.correlation?.join(' ').toLowerCase()}`; return searchableText.includes(lowerTerm) });
                    break;
                case 'catalogTitle':
                    filtered = allRequirements.filter(req => { const searchableText = `${req.catalogTitle?.toLowerCase()}`; return searchableText.includes(lowerTerm) });
                    break;
                default:
                    break;
            }
        }
        setResults(filtered);
    };

    return (
        <Box padding="medium">
            <Text size="xlarge" weight="bold" marginBottom="large">
                Buscador de Requisitos
            </Text>

            <Box marginBottom="xlarge">
                <Textfield
                    placeholder="Buscar requisitos..."
                    iconBefore='search'
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchRequirements(e.target.value);
                    }}
                />
                <Text> Buscar por: </Text>
                <Button
                    spacing="none"
                    appearance={searchTerms == 'title' ? 'primary' : 'default'}
                    onClick={() => { selectSearchTerm('title'); }}>
                    <Text>Title</Text>
                </Button>
                <Button
                    spacing="none"
                    appearance={searchTerms == 'description' ? 'primary' : 'default'}
                    onClick={() => { selectSearchTerm('description'); }}>
                    <Text>Description</Text>
                </Button>
                <Button
                    spacing="none"
                    appearance={searchTerms == 'category' ? 'primary' : 'default'}
                    onClick={() => { selectSearchTerm('category'); }}>
                    <Text>Category</Text>
                </Button>
                <Button
                    spacing="none"
                    appearance={searchTerms == 'type' ? 'primary' : 'default'}
                    onClick={() => { selectSearchTerm('type'); }}>
                    <Text>Type</Text>
                </Button>
                <Button
                    spacing="none"
                    appearance={searchTerms == 'validation' ? 'primary' : 'default'}
                    onClick={() => { selectSearchTerm('validation'); }}>
                    <Text>Validation</Text>
                </Button>
                <Button
                    spacing="none"
                    appearance={searchTerms == 'dependencies' ? 'primary' : 'default'}
                    onClick={() => { selectSearchTerm('dependencies'); }}>
                    <Text>Dependencies</Text>
                </Button>
                <Button
                    spacing="none"
                    appearance={searchTerms == 'correlation' ? 'primary' : 'default'}
                    onClick={() => { selectSearchTerm('correlation'); }}>
                    <Text>Correlation</Text>
                </Button>
                <Button
                    spacing="none"
                    appearance={searchTerms == 'catalogTitle' ? 'primary' : 'default'}
                    onClick={() => { selectSearchTerm('catalogTitle'); }}>
                    <Text>Catalog title</Text>
                </Button>
                <Text color="subtlest" marginTop="xsmall">
                    Busca por título, descripción, categoría, tipo, validación o catálogo
                </Text>
            </Box>

            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <Box>
                    {results.map((req) => (
                        <Card
                            req={req}
                            onUpdateRequirement={handleUpdateRequirement}
                            onDeleteRequirement={handleDeleteRequirement}
                        />
                    ))}

                    {!loading && results.length === 0 && searchTerm && (
                        <Text color="disabled">No se encontraron resultados para "{searchTerm}"</Text>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default RequirementSearch;