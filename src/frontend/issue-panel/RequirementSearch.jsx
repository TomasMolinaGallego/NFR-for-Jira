import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Box, Text, DynamicTable, Textfield, Tag, Button } from '@forge/react';
import { invoke } from '@forge/bridge';

const RequirementSearch = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [allRequirements, setAllRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimerRef = useRef(null);
  
  const MIN_SEARCH_LENGTH = 2;
  const MAX_TOKEN_LENGTH = 20;

  // Precompute optimized data structures
  const { invertedIndex, reqMap } = useMemo(() => {
    const invertedIndex = new Map();
    const reqMap = new Map();

    for (const req of allRequirements) {
      reqMap.set(req.id, req); 
      
      const searchContent = `
        ${req.heading?.toLowerCase() || ''}
        ${req.text?.toLowerCase() || ''}
        ${req.catalogTitle?.toLowerCase() || ''}
        ${req.catalogId?.toLowerCase() || ''}
        ${req.dependencies?.join(',').toLowerCase() || ''}
        ${req.id?.toLowerCase() || ''}
        ${req.issuesLinked?.map(issue => issue.issueKey.toLowerCase()).join(',') || ''}
      `.replace(/\s+/g, ' '); // Normalize spaces
      
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
    }
    
    return { invertedIndex, reqMap };
  }, [allRequirements]);

  // Search function using inverted index
  const searchRequirements = useCallback((term) => {
    const termLower = term.trim().toLowerCase();
    
    if (termLower.length < MIN_SEARCH_LENGTH) {
      setResults(allRequirements.slice(0, 200));
      return;
    }

    const effectiveTerm = termLower.length > MAX_TOKEN_LENGTH 
      ? termLower.substring(0, MAX_TOKEN_LENGTH) 
      : termLower;

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
    
    let resultIds = tokenResults.length > 0
      ? tokenResults.reduce((intersection, set) => 
          new Set([...intersection].filter(id => set.has(id)))
        , tokenResults[0])
      : new Set();

    // Convert to requirement objects
    const resultsArray = Array.from(resultIds)
      .map(id => reqMap.get(id))
      .filter(Boolean)
      .slice(0, 200);

    setResults(resultsArray);
  }, [invertedIndex, reqMap, allRequirements]);

  // Load requirements
  useEffect(() => {
    const loadCatalogs = async () => {
      const result = await invoke('getAllCatalogs');
      const allReqs = result.flatMap(catalog => 
        (catalog.requirements || [])
          .filter(req => !req.isContainer)
          .map(req => ({
            ...req,
            catalogId: catalog.id,
            catalogTitle: catalog.title
          }))
      );
      setAllRequirements(allReqs);
      setResults(allReqs.slice(0, 200));
    };
    
    loadCatalogs();
  }, []);

  // Handle search term changes
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!searchTerm.trim()) {
      setResults(allRequirements.slice(0, 200));
      setLoading(false);
      return;
    }

    setLoading(true);
    searchTimerRef.current = setTimeout(() => {
      searchRequirements(searchTerm);
      setLoading(false);
    }, 300);

    return () => clearTimeout(searchTimerRef.current);
  }, [searchTerm, allRequirements, searchRequirements]);

  const head = {
    cells: [
      { key: "id", content: "Requirement ID", isSortable: true },
      { key: "title", content: "Title", isSortable: false },
      { key: "catalog", content: "Catalog", shouldTruncate: true },
      { key: "action", content: "Action" }
    ]
  };

  const tableRows = results.map(req => ({
    key: req.id,
    cells: [
      { content: <Tag text={req.id} appearance="primary" /> },
      { content: <Text weight="medium">{req.heading}</Text> },
      { content: req.catalogTitle },
      { content: <Button onClick={() => onSelect(req)}>Select</Button> }
    ]
  }));

  return (
    <Box>
      <Textfield
        label="Search requirements"
        placeholder="Write to search..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        isRequired
      />
      
      {loading && <Text>Searching...</Text>}
      
      <DynamicTable
        head={head}
        rows={tableRows}
        rowsPerPage={5}
        defaultPage={1}
        emptyView={
          searchTerm ? 
            <Text color="subtlest">No requirements found for "{searchTerm}"</Text> :
            <Text color="subtlest">No requirements available</Text>
        }
        marginTop="medium"
      />
    </Box>
  );
};

export default RequirementSearch;