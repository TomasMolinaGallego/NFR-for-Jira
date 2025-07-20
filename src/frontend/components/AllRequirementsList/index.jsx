import React, { useEffect, useState, useCallback } from 'react';
import { Text, Box } from '@forge/react';
import { invoke } from '@forge/bridge';
import Card from '../Card';
import RequirementSearch from '../RequirementSearch';

const AllRequirementsList = ({ onUpdateRequirement, onDeleteRequirement }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Fetch all requirements from all catalogs
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
      
      // Filter out container requirements
      const filteredAndSorted = allReqs
        .filter(req => !req.isContainer)
        .sort((a, b) => {
          // Natural sort function for IDs
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
      console.error('Error fetching requirements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle requirement deletion
  const handleDeleteRequirement = async (catalogId, reqId) => {
    try {
      await onDeleteRequirement(catalogId, reqId);
      setRequirements(prev => prev.filter(req => req.id !== reqId));
      setSearchResults(prev => prev.filter(req => req.id !== reqId));
    } catch (err) {
      console.error('Error deleting requirement:', err);
    }
  };

  // Handle requirement update
  const handleUpdateRequirement = (catalogId, reqId, updatedData) => {
    const updateList = list => list.map(req => 
      req.id === reqId ? { ...req, ...updatedData } : req
    );
    
    setRequirements(updateList);
    setSearchResults(updateList);
    onUpdateRequirement(catalogId, reqId, updatedData);
  };

  // Handle search toggle
  const handleSearchToggle = useCallback((isActive) => {
    setIsSearching(isActive);
    if (!isActive) {
      setSearchResults([]);
    }
  }, []);

  // Handle search results
  const handleSearchResults = useCallback((results) => {
    setSearchResults(results);
  }, []);

  if (loading) return <Text>Loading requirements...</Text>;
  if (error) return <Text color="danger">Error: {error}</Text>;

  return (
    <Box padding="medium">
      {/* Requirement Search Component */}
      <RequirementSearch 
        onValueChange={handleSearchToggle}
        onResultsChange={handleSearchResults}
        onUpdateRequirement={handleUpdateRequirement}
        onDeleteRequirement={handleDeleteRequirement}
        allReqs={requirements}
      />

      {/* Search Results */}
      {isSearching && (
        <Box marginTop="large">
          {searchResults.length > 0 ? (
            <>
              <Text size="xlarge" weight="bold" marginBottom="large">
                Search Results ({searchResults.length})
              </Text>
              {searchResults.map(req => (
                <Card
                  key={`${req.id}-search`}
                  req={req}
                  onUpdateRequirement={handleUpdateRequirement}
                  onDeleteRequirement={handleDeleteRequirement}
                />
              ))}
            </>
          ) : (
            <Text color="disabled" marginTop="medium">
              No requirements found matching your search
            </Text>
          )}
        </Box>
      )}

      {/* All Requirements List */}
      {!isSearching && (
        <Box marginTop="large">
          <Text size="xlarge" weight="bold" marginBottom="large">
            All Requirements ({requirements.length})
          </Text>
          {requirements.map(req => (
            <Card
              key={`${req.id}-list`}
              req={req}
              onUpdateRequirement={handleUpdateRequirement}
              onDeleteRequirement={handleDeleteRequirement}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AllRequirementsList;