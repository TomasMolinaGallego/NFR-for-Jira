import React, { useState, useEffect } from 'react';
import { Box, Text, DynamicTable, Textfield, Inline, Tag, Button } from '@forge/react';
import { invoke } from '@forge/bridge';

/**
 * Component to search for requirements in all catalogs inside a Jira issue
 * It allows searching by title, description, type, validation method, importance, correlation, dependencies or category.
 */
const RequirementSearch = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all catalogs and their requirements when the component mounts
  useEffect(() => {
    const loadCatalogs = async () => {
      const result = await invoke('getAllCatalogs');
      setCatalogs(result);
      const allRequirements = result.flatMap(catalog =>
        (catalog.requirements || []).map(req => ({
          ...req,
          catalogId: catalog.id,
          catalogTitle: catalog.title
        }))
      );
      allRequirements.filter(req => !req.isContainer);
      setRequirements(allRequirements);
    };
    
    loadCatalogs();
  }, []);

  // Search for requirements based on the search term
  useEffect(() => {
    const search = async () => {
      setLoading(true);
      const allReqs = catalogs.flatMap(catalog => 
        (catalog.requirements || []).map(req => ({
          ...req,
          catalogId: catalog.id,
          catalogTitle: catalog.title
        }))
      );

      if (searchTerm.length < 1) {
        setRequirements(allReqs);
        setLoading(false);
      }
      const filtered = allReqs.filter(req =>
        Object.entries(req)
          .filter(([key]) => key !== 'dependencies' && key !== 'correlation')
          .some(([, value]) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      setRequirements(filtered);
      setLoading(false);

      tableRows = requirements.map(req => ({
        cells: [
          { content: <Tag text={req.id} appearance="primary" /> },
          { content: <Text weight="medium">{req.header}</Text> },
          { content: req.catalogTitle },
          { content: <Button onClick={() => onSelect(req)}>Seleccionar</Button> }
        ]
      }));
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, catalogs]);


  const head = {
    cells: [
      {
        key: "Requirement ID",
        content: "Requirement ID",
        isSortable: true,
      },
      {
        key: "Title",
        content: "Title",
        isSortable: false,
      },
      {
        key: "Catalog",
        content: "Catalog",
        shouldTruncate: true,
        isSortable: false,
      },
      {
        key: "Action",
        content: "Action",
        shouldTruncate: true,
        isSortable: false,
      }
    ],
  };

  var tableRows = requirements.map(req => ({
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
        onChange={e => setSearchTerm( e.target.value )}
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
            <Text color="subtlest">No requirements were found for "{searchTerm}"</Text> :
            <Text color="subtlest">Loading requirements...</Text>
        }
        marginTop="medium"
      />
    </Box>
  );
};

export default RequirementSearch;