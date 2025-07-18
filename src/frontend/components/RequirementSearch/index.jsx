import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, TextArea, Button } from '@forge/react';
import Card from '../Card';

// Component disabled due to issues with the search performance and the need for a more robust solution.

const RequirementSearch = ({ 
  onValueChange, 
  onUpdateRequirement, 
  onDeleteRequirement, 
  allReqs 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const searchTimerRef = useRef(null);
  const latestSearchRef = useRef('');

  // Función de búsqueda con cancelación de solicitudes anteriores
  const searchRequirements = useCallback((term) => {
    const currentTerm = term.trim().toLowerCase();
    latestSearchRef.current = currentTerm;
    console.log(`Searching for: ${currentTerm}`);
    if (!currentTerm) {
        console.log('Search term is empty, clearing results');
      onValueChange(false);
      setResults([]);
      return;
    }

    onValueChange(true);
    
    let filtered = [];
    if (!searchFilter) {
      filtered = allReqs.filter(req => {
        const searchContent = `
          ${req.heading?.toLowerCase()}
          ${req.text?.toLowerCase()}
          ${req.catalogTitle?.toLowerCase()}
          ${req.catalogId.toLowerCase()}
          ${req.dependencies?.join(',').toLowerCase()}
          ${req.id.toLowerCase()}
          ${req.issuesLinked?.map(issue => issue.issueKey.toLowerCase()).join(', ')}
        `;
        return searchContent.includes(currentTerm);
      });
    } else {
      switch (searchFilter) {
        case 'title':
          filtered = allReqs.filter(req => 
            req.header?.toLowerCase().includes(currentTerm)
          );
          break;
        case 'description':
          filtered = allReqs.filter(req => 
            req.text?.toLowerCase().includes(currentTerm)
          );
          break;
        case 'catalogTitle':
          filtered = allReqs.filter(req => 
            req.catalogTitle?.toLowerCase().includes(currentTerm)
          );
          break;
        default: break;
      }
    }
    
    // Solo actualiza resultados si es la última solicitud
    if (latestSearchRef.current === currentTerm) {
      setResults(filtered);
    }
  }, [searchFilter, allReqs, onValueChange]);

  useEffect(() => {
    console.log('Search results updated:', results);
  }, [results]);

  // Debounce mejorado con cancelación de búsquedas obsoletas
  useEffect(() => {
    const term = searchTerm.trim();
    
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (term === '') {
      onValueChange(false);
      setResults([]);
      return;
    }

    searchTimerRef.current = setTimeout(() => {
      searchRequirements(term);
    }, 300);

    return () => clearTimeout(searchTimerRef.current);
  }, [searchTerm, searchRequirements, onValueChange]);

  // Handlers optimizados
  const handleSearchChange = (e) => {
    console.log('Search input changed:', e.target.value);
    const value = e.target.value;
    setSearchTerm(value);
    
    // Respuesta inmediata al borrado completo
    if (!value.trim()) {
        console.log('Search term cleared');
      onValueChange(false);
      setResults([]);
    }
  };
  
  const toggleFilter = (filter) => {
    setSearchFilter(prev => prev === filter ? '' : filter);
  };

  const handleUpdate = (catalogId, reqId, updatedData) => {
    onUpdateRequirement(catalogId, reqId, updatedData);
    setResults(prev => 
      prev.map(req => req.id === reqId ? { ...req, ...updatedData } : req)
    );
  };

  const handleDelete = (catalogId, reqId) => {
    setResults(prev => prev.filter(req => req.id !== reqId));
    onDeleteRequirement(catalogId, reqId);
  };

  // Componente de botón de filtro reutilizable
  const FilterButton = ({ name, label }) => (
    <Button
      spacing="none"
      appearance={searchFilter === name ? 'primary' : 'default'}
      onClick={() => toggleFilter(name)}
    >
      <Text>{label}</Text>
    </Button>
  );

  return (
    <Box padding="medium">
      <Text size="xlarge" weight="bold" marginBottom="large">
        Requirements Finder
      </Text>

      <Box marginBottom="xlarge">
        <TextArea
          placeholder="Search requirements..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        
        <Text>Search by:</Text>
        <Box marginTop="small" display="flex" gap="small">
          <FilterButton name="title" label="Title" />
          <FilterButton name="description" label="Description" />
          <FilterButton name="catalogTitle" label="Catalog title" />
        </Box>
        
        <Text color="subtlest" marginTop="xsmall">
          Search by title, description, category, type, validation or catalogue.
        </Text>
      </Box>

      <Box>
        {results.map(req => (
          <Card
            key={req.id}
            req={req}
            onUpdateRequirement={handleUpdate}
            onDeleteRequirement={handleDelete}
          />
        ))}

        {searchTerm && results.length === 0 && (
          <Text color="disabled">No results were found for "{searchTerm}"</Text>
        )}
      </Box>
    </Box>
  );
};

export default RequirementSearch;