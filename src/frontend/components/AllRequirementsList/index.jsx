import React, { useEffect, useState, useCallback } from 'react';
import { Text } from '@forge/react';
import { invoke } from '@forge/bridge';
import Card from '../Card';
import RequirementSearch from '../RequirementSearch';

const AllRequirementsList = ({ onUpdateRequirement, onDeleteRequirement }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [toSynchronise, setToSynchronise] = useState(false);

  // Función para cargar datos, memorizada para evitar recreaciones.
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const catalogs = await invoke('getAllCatalogs');
      const allReqs = catalogs.flatMap(catalog =>
        (catalog.requirements || []).map(req => ({
          ...req,
          catalogTitle: catalog.title,
          catalogId: catalog.id,
        }))
      );
      setRequirements(allReqs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto que se ejecuta al montar el componente y cuando cambia toSynchronise.
  useEffect(() => {
    fetchData();
    }, []);

  const handleDeleteRequirement = (catalogId, reqId) => {
    setRequirements((prev) => prev.filter((req) => req.id !== reqId));
    onDeleteRequirement(catalogId, reqId);
    toSynchronise(true);
  }

  const handleUpdateRequirement = (catalogId, reqId, updatedData) => {
    setRequirements((prev) =>
      prev.map((req) => (req.id === reqId ? { ...req, ...updatedData } : req))
    );
    onUpdateRequirement(catalogId, reqId, updatedData);
  }


  // Maneja el estado "buscando" llegado desde el componente RequirementSearch.
  const handleSearching = useCallback((searching) => {
    setIsSearching(searching);
  }, []);

  if (loading) return <Text>Loading requirements...</Text>;
  if (error) return <Text color="danger">Error: {error}</Text>;

  return (
    <>
      <RequirementSearch
        onValueChange={handleSearching}
        onUpdateRequirement={handleUpdateRequirement}
        onDeleteRequirement={handleDeleteRequirement}
        allReqs={requirements}
      />
      {!isSearching && (
        <>
          <Text size="xlarge" weight="bold" marginBottom="large">
            Todos los Requisitos ({requirements.length})
          </Text>
          {requirements.map((req) => (
            <Card
              req={req}
              onUpdateRequirement={handleUpdateRequirement}
              onDeleteRequirement={handleDeleteRequirement}
            />
          ))}
        </>
      )}
    </>
  );
};

export default AllRequirementsList;
