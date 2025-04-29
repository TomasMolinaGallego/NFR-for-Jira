import React, { useState, useEffect } from 'react';
import { Box, Text, DynamicTable, Textfield, Inline, Tag, Button } from '@forge/react';
import { invoke } from '@forge/bridge';

const RequirementSearch = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCatalogs = async () => {
      const result = await invoke('getAllCatalogs');
      setCatalogs(result);
      requirements = catalogs.flatMap(catalog => 
        (catalog.requirements || []).map(req => ({
          ...req,
          catalogId: catalog.id,
          catalogTitle: catalog.title
        }))
      );
    };
    
    loadCatalogs();
  }, []);

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

      if(searchTerm.length < 1 ) {
        setRequirements(allReqs);
        setLoading(false);
    }
      const filtered = allReqs.filter(req =>
        Object.values(req).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setRequirements(filtered);
      setLoading(false);

      tableRows = requirements.map(req => ({
        cells: [
          { content: <Tag text={req.id} appearance="primary" /> },
          { content: <Text weight="medium">{req.title}</Text> },
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
        key: "ID Requisito",
        content: "ID",
        isSortable: true,
      },
      {
        key: "title",
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
        content: "Select",
        shouldTruncate: true,
        isSortable: false,
      }
    ],
  };

  var tableRows = requirements.map(req => ({
    cells: [
      { content: <Tag text={req.id} appearance="primary" /> },
      { content: <Text weight="medium">{req.title}</Text> },
      { content: req.catalogTitle },
      { content: <Button onClick={() => onSelect(req)}>Seleccionar</Button> }
    ]
  }));

  return (
    <Box>
      <Textfield
        label="Buscar requisitos"
        placeholder="Escribe para buscar..."
        value={searchTerm}
        onChange={e => setSearchTerm( e.target.value )}
        isRequired
      />
      
      {loading && <Text>Buscando...</Text>}
      
      <DynamicTable
        head={head}
        rows={tableRows}
        rowsPerPage={5}
        defaultPage={1}
        emptyView={
          searchTerm ? 
            <Text color="subtlest">No se encontraron requisitos para "{searchTerm}"</Text> :
            <Text color="subtlest">Loading requirements...</Text>
        }
        marginTop="medium"
      />
    </Box>
  );
};

export default RequirementSearch;