import React, { useState, useEffect, useRef, useCallback } from "react";
import ForgeReconciler, { Box, Text } from "@forge/react";
import { invoke, view } from "@forge/bridge";
// Importar componentes
import CatalogForm from './components/CatalogForm';
import CatalogList from './components/CatalogList';
import Notification from './components/Notification';
import RequirementModal from './components/RequirementModal';
import AllRequirementsList from './components/AllRequirementsList';
import CatalogDetailPage from "./components/CatalogDetailPage/Index";

// Configuración inicial
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

// Componente principal
const App = () => {
  // Estados principales
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [selectedPage, setSelectedPage] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  
  // Refs y estado de montaje
  const historyRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cargar catálogos memoizado
  const loadCatalogs = useCallback(async () => {
    try {
      const data = await invoke('getAllCatalogs');
      setCatalogs(data);
    } catch (err) {
      showNotification('error', `Error cargando catálogos: ${err.message}`);
    }
  }, []);

  // Efecto principal de inicialización
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const [history, context] = await Promise.all([
          view.createHistory(),
          view.getContext()
        ]);

        if (!isMountedRef.current) return;

        // Configurar historial
        const handleHistoryChange = (location) => {
          const newPath = location.pathname.replace(/^\//, '');
          setSelectedPage(newPath);
          setSelectedCatalog(null);
          setFormState(INITIAL_FORM_STATE);
        };

        historyRef.current = history;
        history.listen(handleHistoryChange);
        handleHistoryChange(history.location);
        // Carga inicial
        await loadCatalogs();
      } catch (error) {
        console.error('Error de inicialización:', error);
        showNotification('error', 'Error inicializando la aplicación');
      }
    };

    initializeApp();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadCatalogs]);

  // Manejo de catálogos y requisitos
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
      'Catálogo creado!'
    );
    setFormState(prev => ({ ...prev, ...INITIAL_FORM_STATE }));
  };

  const deleteCatalog = async (catalogId) => {
    if (confirm('¿Eliminar este catálogo y sus requisitos?')) {
      await handleCatalogAction('deleteCatalog', { catalogId }, 'Catálogo eliminado');
    }
  };

  const deleteRequirement = async (catalogId, requirementId) => {
    if (confirm('¿Eliminar este requisito?')) {
      await handleCatalogAction('deleteRequirement', { catalogId, requirementId }, 'Requisito eliminado');
    }
  }

  // Manejo de requisitos
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

  const addRequirement = async () => {
    await handleRequirementAction(
      'addRequirement',
      {
        catalogId: selectedCatalog.id,
        prefix: selectedCatalog.prefix,
        formState
      },
      'Requisito añadido'
    );
    setFormState(prev => ({ ...prev, ...INITIAL_FORM_STATE }));
  };

  const updateRequirement = async (catalogId, requirementId, updates) => {
    await handleRequirementAction(
      'updateRequirement',
      { catalogId, requirementId, updates },
      'Requisito actualizado'
    );
  };

  // Notificaciones
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  // Renderizado condicional
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
            <Text size="xlarge" weight="bold" spacing="medium">
              Gestión de Requisitos No Funcionales
            </Text>
            <CatalogForm
              formState={formState}
              onFormChange={setFormState}
              onSubmit={createCatalog}
            />
            <Notification {...notification} />
            <CatalogList
              catalogs={catalogs}
              onSelect={setSelectedCatalog}
              onDelete={deleteCatalog}
              onUpdateRequirement={updateRequirement}
              history={historyRef.current}
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
        return <Text>Página no encontrada</Text>;
    }
  };

  return (
    <Box padding="medium">
      {!historyRef.current ? (
        <Text>Cargando...</Text>
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