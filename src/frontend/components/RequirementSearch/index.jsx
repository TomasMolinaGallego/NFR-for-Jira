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

/**
 * Component to search for requirements in all catalogs.
 * It allows searching by title, description, type, validation method, importance, correlation, dependencies or category.
 */
const RequirementSearch = ({ onValueChange, onUpdateRequirement, onDeleteRequirement, allReqs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [allRequirements, setAllRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerms, setSearchTerms] = useState('');

    const selectSearchTerm = (term) => {
        // If the term is already selected, deselect it
        if (searchTerms === term) {
            setSearchTerms('');
        } else {
            // Otherwise, set the selected term
            setSearchTerms(term);
        }
    }

    // Load all requirements from the catalog
    // and set the loading state to false
    const loadRequirements = async () => {
        const requirements = allReqs;
        setAllRequirements(requirements);
        setLoading(false);
    };

    // Load the requirements when the component mounts
    // and when the allReqs prop changes
    useEffect(() => {
        const loadData = async () => {
            await loadRequirements();
        };
        loadData();
    }, [allReqs]);

    // Update the results when the allRequirements state changes
    const handleUpdateRequirement = (catalogId, reqId, updatedData) => {
        onUpdateRequirement(catalogId, reqId, updatedData);
        setResults((prev) =>
            prev.map((req) => (req.id === reqId ? { ...req, ...updatedData } : req))
        );
    };

    // Delete the requirement from the results and call the onDeleteRequirement function
    // to delete it from the catalog
    const handleDeleteRequirement = (catalogId, reqId) => {
        setResults((prev) => prev.filter((req) => req.id !== reqId));
        onDeleteRequirement(catalogId, reqId);
    };

    // Search for requirements based on the search term and selected search term
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
            // If no search term is selected, search in all fields
            // This is a fallback to search in all fields if no specific term is selected
            filtered = allRequirements.filter(req => {
                const searchableText = `
            ${req.title?.toLowerCase()}
            ${req.description?.toLowerCase()}
            ${req.type?.toLowerCase()}
            ${req.category?.toLowerCase()} 
            ${req.validation?.toLowerCase()}
            ${req.catalogTitle?.toLowerCase()}
            ${req.catalogId.toLowerCase()}
            ${req.id.toLowerCase()}
            ${req.issuesLinked?.map(issue => issue.issueKey.toLowerCase()).join(', ')}
          `;
                // The catalog id is only added to update the requirement
                // and not to search for it
                return searchableText.includes(lowerTerm);
            });

        } else {
            // Filter based on the selected search term
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
                Requirements Finder
            </Text>

            <Box marginBottom="xlarge">
                <Textfield
                    placeholder="Search requirements..."
                    iconBefore='search'
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchRequirements(e.target.value);
                    }}
                />
                <Text> Search by: </Text>
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
                    appearance={searchTerms == 'catalogTitle' ? 'primary' : 'default'}
                    onClick={() => { selectSearchTerm('catalogTitle'); }}>
                    <Text>Catalog title</Text>
                </Button>
                <Text color="subtlest" marginTop="xsmall">
                    Search by title, description, category, type, validation or catalogue.
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
                        <Text color="disabled">No results were found for "{searchTerm}"</Text>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default RequirementSearch;