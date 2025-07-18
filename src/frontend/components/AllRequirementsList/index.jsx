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
      // Filter out container requirements and sort them here
      const filteredAndSorted = allReqs
        .filter(req => !req.isContainer)
        .sort((a, b) => {
          // Extract prefix and number for natural sort
          const parseId = id => {
        const match = id.match(/^([a-zA-Z\-]+)?(\d+)$/i);
        if (match) {
          return { prefix: match[1] || '', num: parseInt(match[2], 10) };
        }
        return { prefix: id, num: 0 };
          };
          const aParts = parseId(a.id);
          const bParts = parseId(b.id);

          if (aParts.prefix === bParts.prefix) {
        return aParts.num - bParts.num;
          }
          return aParts.prefix.localeCompare(bParts.prefix);
        });
      setRequirements(filteredAndSorted);
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
