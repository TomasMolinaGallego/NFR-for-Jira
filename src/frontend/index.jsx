import React, { useState, useEffect, useRef, useCallback } from "react";
import ForgeReconciler, { Box, Text } from "@forge/react";
import { invoke, view } from "@forge/bridge";
import CatalogList from './components/CatalogList';
import Notification from './components/Notification';
import RequirementModal from './components/RequirementModal';
import AllRequirementsList from './components/AllRequirementsList';
import CatalogDetailPage from "./components/CatalogDetailPage/Index";
import CSVRequirementsLoader from './components/CsvImporter/csvImporter';

const INITIAL_FORM_STATE = {
  catalogTitle: '',
  catalogDesc: '',
  reqTitle: '',
  reqDesc: '',
  reqType: '',
  reqCategory: '',
  reqImportant: '',
  reqValidation: '',
  reqDependencies: [],
  reqCorrelation: []
};

/**
 * Main component for the Forge app.
 * It handles the loading of catalogs, creating and deleting catalogs and requirements,
 * and displaying notifications.
 * It also handles the routing of the app and the rendering of different pages.
 * It manages the pages of creation catalogs, requirements and all requirements.
 */
const App = () => {
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [selectedPage, setSelectedPage] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  
  const historyRef = useRef(null);
  const isMountedRef = useRef(true);

  const loadCatalogs = useCallback(async () => {
    try {
      const data = await invoke('getAllCatalogs');
      setCatalogs(data);
    } catch (err) {
      showNotification('error', `Error loading catalogues: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const [history, context] = await Promise.all([
          view.createHistory(),
          view.getContext()
        ]);

        if (!isMountedRef.current) return;

        const handleHistoryChange = (location) => {
          const newPath = location.pathname.replace(/^\//, '');
          setSelectedPage(newPath);
          setSelectedCatalog(null);
          setFormState(INITIAL_FORM_STATE);
        };

        historyRef.current = history;
        history.listen(handleHistoryChange);
        handleHistoryChange(history.location);
        await loadCatalogs();
      } catch (error) {
        console.error('Initialisation error:', error);
        showNotification('error', 'Error initialising the application');
      }
    };

    initializeApp();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadCatalogs]);

  const handleCatalogAction = async (action, params, successMessage) => {
    try {
      await invoke(action, params);
      await loadCatalogs();
      showNotification('success', successMessage);
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  const createCatalog = async () => {
    const context = await view.getContext();
    await handleCatalogAction(
      'createCatalog',
      {
        title: formState.catalogTitle,
        description: formState.catalogDesc,
        prefix: formState.catalogPrefix,
        userId: context.accountId
      },
      'Catalog created!'
    );
    setFormState(prev => ({ ...prev, ...INITIAL_FORM_STATE }));
  };

  const deleteCatalog = async (catalogId) => {
    if (confirm('Delete this catalogue and its requirements?')) {
      await handleCatalogAction('deleteCatalog', { catalogId }, 'Catalogue deleted');
    }
  };

  const deleteRequirement = async (catalogId, requirementId) => {
    if (confirm('Remove this requirement?')) {
      await handleCatalogAction('deleteRequirement', { catalogId, requirementId }, 'Requirement removed');
      return true;
    }
    return false
  }

  const handleRequirementAction = async (action, params, successMessage) => {
    try {
      const context = await view.getContext();
      await invoke(action, { 
        ...params,
        userId: context.accountId
      });
      
      const updatedCatalogs = await invoke('getAllCatalogs');
      setCatalogs(updatedCatalogs);
      
      if (selectedCatalog) {
        const updated = updatedCatalogs.find(c => c.id === selectedCatalog.id);
        setSelectedCatalog(updated);
      }
      
      showNotification('success', successMessage);
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  // Add a new requirement to the selected catalog
  const addRequirement = async () => {
    let reqDependencies = formState.reqDependencies;
    if (Array.isArray(reqDependencies)) {
      reqDependencies = reqDependencies.map(dep =>
      typeof dep === 'object' && dep !== null && dep.id ? dep.id : dep
      );
    }
    const updatedFormState = { ...formState, reqDependencies };
    let nextSectionNumber = 1;
    if (selectedCatalog && Array.isArray(selectedCatalog.requirements) && selectedCatalog.requirements.length > 0) {
      const lastReq = selectedCatalog.requirements[selectedCatalog.requirements.length - 1];
      const lastSection = parseFloat(lastReq.section);
      if (!isNaN(lastSection)) {
        nextSectionNumber = Math.floor(lastSection) + 1.1;
      }
    }
    updatedFormState.section = nextSectionNumber;
    await handleRequirementAction(
      'addRequirement',
      {
        catalogId: selectedCatalog.id,
        prefix: selectedCatalog.prefix,
        formState: updatedFormState
      },
      'Requirement added'
    );
    setFormState(prev => ({ ...prev, ...INITIAL_FORM_STATE }));
  };

  // Update an existing requirement
  const updateRequirement = async (catalogId, requirementId, updates) => {
    await handleRequirementAction(
      'updateRequirement',
      { catalogId, requirementId, updates },
      'Requirement updated'
    );
  };

  // Notifications
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  const renderPageContent = () => {
    if (selectedPage.startsWith('catalogues/')) {
      return <CatalogDetailPage catalogId={selectedPage.split('/')[1]} history={historyRef.current}/>;
    }

    switch (selectedPage) {
      case 'catalogues':
        return (
          <>
            <CatalogList
              catalogs={catalogs}
              onSelect={setSelectedCatalog}
              onDelete={deleteCatalog}
              onUpdateRequirement={updateRequirement}
              history={historyRef.current}
              onUpdateCsv={loadCatalogs}
            />
            {selectedCatalog && (
              <RequirementModal
                catalog={selectedCatalog}
                formState={formState}
                onFormChange={setFormState}
                onSubmit={addRequirement}
                onClose={() => setSelectedCatalog(null)}
              />
            )}
          </>
        );
      
      case 'requirements':
        return <AllRequirementsList onUpdateRequirement={updateRequirement} onDeleteRequirement={deleteRequirement} />;
      
      case 'create-catalogues':
        return (
          <>
            <CSVRequirementsLoader onSuccess={loadCatalogs} ></CSVRequirementsLoader>
            <Notification {...notification} />
            <CatalogList
              catalogs={catalogs}
              onSelect={setSelectedCatalog}
              onDelete={deleteCatalog}
              onUpdateRequirement={updateRequirement}
              history={historyRef.current}
              onUpdateCsv={loadCatalogs}
            />
            {selectedCatalog && (
              <RequirementModal
                catalog={selectedCatalog}
                formState={formState}
                onFormChange={setFormState}
                onSubmit={addRequirement}
                onClose={() => setSelectedCatalog(null)}
              />
            )}
          </>
        );
      
      default:
        return <Text>Page not found</Text>;
    }
  };

  return (
    <Box padding="medium">
      {!historyRef.current ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Notification {...notification} />
          {renderPageContent()}
        </>
      )}
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);