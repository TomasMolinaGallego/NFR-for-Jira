import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Box, Text, TextArea, Button } from '@forge/react';
import Card from '../Card';

const RequirementSearch = ({ 
  onValueChange, 
  onResultsChange,
  allReqs 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const searchTimerRef = useRef(null);
  const MAX_TOKEN_LENGTH = 20;
  const MIN_SEARCH_LENGTH = 2;

  // Precompute optimized data structures
  const { invertedIndex, fieldIndices, reqMap } = useMemo(() => {
    const invertedIndex = new Map();
    const reqMap = new Map();
    const fieldIndices = {
      title: new Map(),
      description: new Map(),
      catalogTitle: new Map()
    };

    for (const req of allReqs) {
      reqMap.set(req.id, req);
      
      // Combined search fields
      const searchContent = `
        ${req.heading?.toLowerCase() || ''}
        ${req.text?.toLowerCase() || ''}
        ${req.catalogTitle?.toLowerCase() || ''}
        ${req.catalogId?.toLowerCase() || ''}
        ${req.dependencies?.join(',').toLowerCase() || ''}
        ${req.id?.toLowerCase() || ''}
        ${req.issuesLinked?.map(issue => issue.issueKey.toLowerCase()).join(',') || ''}
      `.replace(/\s+/g, ' '); // Normalizar espacios
      
      // Sliding window tokenization
      for (let start = 0; start < searchContent.length; start++) {
        for (let length = 1; length <= MAX_TOKEN_LENGTH; length++) {
          if (start + length > searchContent.length) break;
          
          const token = searchContent.substring(start, start + length);
          if (!invertedIndex.has(token)) {
            invertedIndex.set(token, new Set());
          }
          invertedIndex.get(token).add(req.id);
        }
      }
      
      // Field-specific indices
      const fields = {
        title: req.heading?.toLowerCase() || '',
        description: req.text?.toLowerCase() || '',
        catalogTitle: req.catalogTitle?.toLowerCase() || ''
      };
      
      for (const [field, value] of Object.entries(fields)) {
        if (value) {
          if (!fieldIndices[field].has(value)) {
            fieldIndices[field].set(value, new Set());
          }
          fieldIndices[field].get(value).add(req.id);
        }
      }
    }
    
    return { invertedIndex, fieldIndices, reqMap };
  }, [allReqs]);

  const searchRequirements = useCallback((term) => {
    const termLower = term.trim().toLowerCase();
    
    if (!termLower || termLower.length < MIN_SEARCH_LENGTH) {
      if (onResultsChange) onResultsChange([]);
      return;
    }

    const effectiveTerm = termLower.length > MAX_TOKEN_LENGTH 
      ? termLower.substring(0, MAX_TOKEN_LENGTH) 
      : termLower;

    let resultIds = new Set();

    // Field-specific search
    if (searchFilter) {
      const fieldIndex = fieldIndices[searchFilter];
      
      if (fieldIndex) {
        // Exact match
        if (fieldIndex.has(effectiveTerm)) {
          resultIds = new Set(fieldIndex.get(effectiveTerm));
        } 
        // Partial match
        else {
          for (const [key, ids] of fieldIndex) {
            if (key && key.includes(effectiveTerm)) {
              ids.forEach(id => resultIds.add(id));
            }
          }
        }
      }
    } 
    // Global search
    else {
      const tokens = [];
      for (let i = 0; i < effectiveTerm.length; i++) {
        for (let len = MIN_SEARCH_LENGTH; len <= MAX_TOKEN_LENGTH; len++) {
          if (i + len > effectiveTerm.length) break;
          tokens.push(effectiveTerm.substring(i, i + len));
        }
      }

      const tokenResults = tokens
        .map(token => invertedIndex.get(token) || new Set())
        .filter(set => set.size > 0);
      
      if (tokenResults.length > 0) {
        // Intersection of relevant tokens
        resultIds = new Set(
          [...tokenResults.reduce((intersection, set) => 
            new Set([...intersection].filter(id => set.has(id))), tokenResults[0])]
        );
      }
    }

    // Convert to requirement objects
    const resultsArray = Array.from(resultIds)
      .map(id => reqMap.get(id))
      .filter(Boolean)
      .slice(0, 200); // Limit to 200 results

    if (onResultsChange) onResultsChange(resultsArray);
  }, [invertedIndex, fieldIndices, reqMap, searchFilter, onResultsChange, onValueChange]); // Añadido onValueChange

  useEffect(() => {
    console.log('Search term changed:', searchTerm);
    
    if (searchTimerRef.current) {
      cancelAnimationFrame(searchTimerRef.current);
    }

    if (!searchTerm.trim()) {
      console.log('Empty search term');
      if (onResultsChange) onResultsChange([]);
      if (onValueChange) onValueChange(false);
      return;
    }

    console.log('Starting search for:', searchTerm);
    if (onValueChange) onValueChange(true);
    
    const currentSearchTerm = searchTerm;

    console.log('Executing search for:', currentSearchTerm);
    searchRequirements(currentSearchTerm);

    return () => {
      if (searchTimerRef.current) {
        cancelAnimationFrame(searchTimerRef.current);
      }
    };
  }, [searchTerm, onValueChange, onResultsChange]);

  // Handle filter changes
  const toggleFilter = useCallback((filter) => {
    const newFilter = searchFilter === filter ? '' : filter;
    setSearchFilter(newFilter);
    
    if (searchTerm) {
      const handler = requestAnimationFrame(() => {
        searchRequirements(searchTerm);
      });
      return () => cancelAnimationFrame(handler);
    }
  }, [searchFilter, searchTerm, searchRequirements]);

  // Handlers
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setResults([]);
      if (onResultsChange) onResultsChange([]);
      if (onValueChange) onValueChange(false);
    }
  }, [onValueChange, onResultsChange]);

  // Filter button component
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
    <Box padding="medium" marginBottom="large">
      <Text size="xlarge" weight="bold" marginBottom="large">
        Requirements Finder
      </Text>

      <Box marginBottom="medium">
        <TextArea
          placeholder="Search requirements..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        
        <Box marginTop="small" display="flex" alignItems="center" gap="small">
          <Text>Search by:</Text>
          <FilterButton name="title" label="Title" />
          <FilterButton name="description" label="Description" />
          <FilterButton name="catalogTitle" label="Catalog title" />
        </Box>
        
        <Text color="subtlest" marginTop="xsmall">
          Minimum {MIN_SEARCH_LENGTH} characters. Searches by title, description, category, type, validation or catalogue.
        </Text>
      </Box>
    </Box>
  );
};

export default RequirementSearch;