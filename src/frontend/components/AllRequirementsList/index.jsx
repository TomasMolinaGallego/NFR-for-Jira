import React, { useEffect, useState, useCallback } from 'react';
import { Text } from '@forge/react';
import { invoke } from '@forge/bridge';
import Card from '../Card';
import RequirementSearch from '../RequirementSearch';

/**
 * Component to display requiremetnss from all catalogs.
 * They can be display in form of list with all requirements or in a searcher .
 */
const AllRequirementsList = ({ onUpdateRequirement, onDeleteRequirement }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // On loading the component, we fetch all the requirements.
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

  useEffect(() => {
    fetchData();
    }, []);

  /**
   * Handler to delete a requirement for the searcher and the list.
   * @param {*} catalogId 
   * @param {*} reqId 
   */
  const handleDeleteRequirement =  async(catalogId, reqId) => {
    const flag = await onDeleteRequirement(catalogId, reqId);
    if(flag === true) {
      setRequirements((prev) => prev.filter((req) => req.id !== reqId));

    }
  }


  /**
   * Handler to update a requirement for the searcher and the list.
   * @param {*} catalogId
   * @param {*} reqId
   * @param {*} updatedData
   * @returns
   * */
  const handleUpdateRequirement = (catalogId, reqId, updatedData) => {
    setRequirements((prev) =>
      prev.map((req) => (req.id === reqId ? { ...req, ...updatedData } : req))
    );
    onUpdateRequirement(catalogId, reqId, updatedData);
  }


  /**
   * Handler to set the searcher and disable the list.
   */
  const handleSearching = useCallback((searching) => {
    setIsSearching(searching);
  }, []);

  // If the page is loading, we show a loading message.
  if (loading) return <Text>Loading requirements...</Text>;
  // In case of some error
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
