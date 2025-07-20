import React, { useState, useCallback, useMemo } from 'react';
import {
  Stack,
  Heading,
  Button,
  SectionMessage,
  SectionMessageAction,
  Spinner,
  Tag,
  Text,
  Box,
  TextArea,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

const REQUIRED_HEADERS = ['id', 'level', 'section', 'heading', 'text', 'important', 'dependencies'];

const parseCSV = (text) => {
  if (!text.trim()) return [];

  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must contain at least 2 lines (headers + data)');
  
  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`);

  const headerIndexMap = headers.reduce((map, header, index) => {
    map[header] = index;
    return map;
  }, {});

  return lines.slice(1).map((line, i) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;
    
    const values = trimmedLine.split(';');
    if (values.length !== headers.length) {
      throw new Error(`Line ${i + 2}: Incorrect number of fields`);
    }

    const level = parseInt(values[headerIndexMap.level], 10);
    if (isNaN(level)) throw new Error(`Line ${i + 2}: 'level' must be a number`);
    
    const important = parseInt(values[headerIndexMap.important], 10);
    if (isNaN(important)) throw new Error(`Line ${i + 2}: 'important' must be a number`);

    return {
      id: values[headerIndexMap.id].trim(),
      level,
      section: values[headerIndexMap.section].trim(),
      heading: values[headerIndexMap.heading].trim(),
      text: values[headerIndexMap.text].trim(),
      dependencies: values[headerIndexMap.dependencies] 
        ? values[headerIndexMap.dependencies].split(',').map(d => d.trim()) 
        : [],
      important,
    };
  }).filter(Boolean);
};

const buildHierarchy = (items) => {
  if (!items.length) return [];

  const map = new Map();
  items.forEach(item => map.set(item.section, { ...item, children: [] }));

  const roots = [];
  for (const [section, item] of map) {
    const parentSection = section.split('.').slice(0, -1).join('.');
    if (parentSection && map.has(parentSection)) {
      map.get(parentSection).children.push(item);
    } else {
      roots.push(item);
    }
  }

  const sortTree = nodes => {
    nodes.sort((a, b) => a.section.localeCompare(b.section));
    nodes.forEach(node => sortTree(node.children));
  };
  
  sortTree(roots);
  return roots;
};

const countRequirements = (nodes) => {
  if (!nodes.length) return 0;
  
  let count = 0;
  const stack = [...nodes];
  
  while (stack.length) {
    const node = stack.pop();
    count++;
    stack.push(...node.children);
  }
  
  return count;
};

const RequirementNode = React.memo(({ requirement, depth = 0 }) => (
  <Box padding="space.0" marginBottom="space.100">
    <Box
      padding="space.200"
      borderRadius="border.radius.200"
      backgroundColor="color.background.neutral"
      style={{
        marginLeft: depth ? `${depth * 20}px` : 0,
        borderLeft: depth ? '2px solid var(--ds-border)' : 'none',
      }}
    >
      <Stack space="space.100">
        <Box display="flex" alignItems="center" gap="space.100">
          <Tag text={requirement.section} appearance="primary" />
          <Text fontWeight="bold">{requirement.heading || "Untitled"}</Text>
        </Box>
        {requirement.text && (
          <Text color="color.text.subtle" whiteSpace="pre-wrap">{requirement.text}</Text>
        )}
        <Box display="flex" gap="space.100" wrap="wrap">
          <Tag text={`ID: ${requirement.id}`} />
          <Tag text={`Level: ${requirement.level}`} />
          {requirement.dependencies.length > 0 && (
            <Tag text={`Dependencies: ${requirement.dependencies.join(', ')}`} />
          )}
        </Box>
      </Stack>
    </Box>
    <Stack space="space.100">
      {requirement.children.map(child => (
        <RequirementNode key={child.id} requirement={child} depth={depth + 1} />
      ))}
    </Stack>
  </Box>
));

const CSVRequirementsLoader = ({ catalogId, onSuccess }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [catalogName, setCatalogName] = useState('');
  const [catalogDescription, setCatalogDescription] = useState('');
  const [catalogPrefix, setCatalogPrefix] = useState('');
  const [csvText, setCsvText] = useState('');
  
  const [processingResult, setProcessingResult] = useState({
    flatItems: [],
    hierarchy: [],
    showPreview: false
  });

  const handleProcessCSV = useCallback(() => {
    setError(null);
    setSaveStatus(null);
    setLoading(true);
    
    try {
      const flatItems = parseCSV(csvText);
      const hierarchy = buildHierarchy(flatItems);
      
      setProcessingResult({
        flatItems,
        hierarchy,
        showPreview: true
      });
    } catch (err) {
      setError(`Error processing CSV: ${err.message}`);
      setProcessingResult({
        flatItems: [],
        hierarchy: [],
        showPreview: false
      });
    } finally {
      setLoading(false);
    }
  }, [csvText]);

  const handleSaveRequirements = useCallback(async () => {
    if (!processingResult.hierarchy.length) {
      setError('There are no valid requirements to save');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const accountId = await view.getContext();
      const result = await invoke('importRequirementsFromCustomCSV', {
        catalogId,
        catalogName,
        catalogDescription,
        requirements: processingResult.hierarchy,
        prefix: catalogPrefix,
        userId: accountId
      });
      
      setSaveStatus({
        success: result.success > 0,
        message: result.success > 0
          ? `${result.success} requirements imported successfully!`
          : 'Error importing requirements',
      });
      
      if (result.success > 0 && onSuccess) onSuccess();
    } catch (err) {
      setError(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [catalogId, catalogName, catalogPrefix, onSuccess, processingResult]);

  const resetState = useCallback(() => {
    setCsvText('');
    setProcessingResult({
      flatItems: [],
      hierarchy: [],
      showPreview: false
    });
    setError(null);
    setSaveStatus(null);
    setCatalogName('');
    setCatalogDescription('');
    setCatalogPrefix('');
  }, []);

  const totalRequirements = useMemo(() => {
    return countRequirements(processingResult.hierarchy);
  }, [processingResult.hierarchy]);

  return (
    <Stack space="space.400">
      <Heading level="h600">Import Requirements from CSV</Heading>
      <Text>
        Required format: Semicolon (;) separated with columns: id, level, section, heading, text, important.
      </Text>
      
      <Box border="1px solid" borderColor="color.border" borderRadius="border.radius.200" padding="space.200">
        <Stack space="space.200">
          <TextArea
            value={catalogName}
            onChange={e => setCatalogName(e.target.value)}
            placeholder="Catalog name..."
            resize="vertical"
            appearance="standard"
            isMonospaced
            rows={1}
          />
          <TextArea
            value={catalogDescription}
            onChange={e => setCatalogDescription(e.target.value)}
            placeholder="Catalog description..."
            resize="vertical"
            appearance="standard"
            isMonospaced
            rows={1}
          />
          <TextArea
            value={catalogPrefix}
            onChange={e => setCatalogPrefix(e.target.value)}
            placeholder="Catalog prefix..."
            resize="vertical"
            appearance="standard"
            isMonospaced
            rows={1}
          />
          <TextArea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Paste your CSV here..."
            resize="vertical"
            appearance="standard"
            isMonospaced
            rows={10}
          />
          <Box display="flex" gap="space.200">
            <Button
              iconBefore="code"
              appearance="primary"
              onClick={handleProcessCSV}
              isDisabled={
                loading ||
                !csvText ||
                !catalogName ||
                !catalogDescription ||
                !catalogPrefix
              }
            >
              {loading ? 'Processing...' : 'Process CSV'}
            </Button>
            <Button appearance="subtle" onClick={resetState}>Reset</Button>
          </Box>
        </Stack>
      </Box>
      
      {loading && (
        <Box display="flex" alignItems="center" gap="space.200">
          <Spinner size="medium" />
          <Text>Processing CSV content...</Text>
        </Box>
      )}
      
      {error && (
        <SectionMessage appearance="error" title="CSV Error">
          <Text>{error}</Text>
          <SectionMessageAction>
            <Button appearance="link" onClick={() => setError(null)}>OK</Button>
          </SectionMessageAction>
        </SectionMessage>
      )}
      
      {saveStatus && (
        <SectionMessage
          appearance={saveStatus.success ? "success" : "error"}
          title={saveStatus.success ? "Import Successful" : "Import Error"}
        >
          <Text>{saveStatus.message}</Text>
          {saveStatus.success && (
            <SectionMessageAction>
              <Button appearance="link" onClick={resetState}>Continue</Button>
            </SectionMessageAction>
          )}
        </SectionMessage>
      )}
      
      {processingResult.showPreview && processingResult.hierarchy.length > 0 && (
        <Box
          border="1px solid"
          borderColor="color.border"
          borderRadius="border.radius.200"
          padding="space.200"
          overflow="auto"
          maxHeight="500px"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="space.200">
            <Heading level="h500">Requirements Preview</Heading>
            <Tag
              text={`${totalRequirements} requirements`}
              appearance={totalRequirements > 0 ? "success" : "removed"} 
            />
          </Box>
          
          <Box marginTop="space.300" display="flex" justifyContent="flex-end">
            <Button
              appearance="primary"
              onClick={handleSaveRequirements}
              isDisabled={loading || totalRequirements === 0}
            >
              {loading ? 'Saving...' : 'Import to Catalog'}
            </Button>
          </Box>
          
          <Stack space="space.200">
            {processingResult.hierarchy.map(req => (
              <RequirementNode key={req.id} requirement={req} />
            ))}
          </Stack>
        </Box>
      )}
      
      {processingResult.showPreview && !processingResult.hierarchy.length && !loading && (
        <SectionMessage appearance="info" title="No requirements processed">
          <Text>The CSV does not contain valid requirements to display</Text>
        </SectionMessage>
      )}
    </Stack>
  );
};

export default React.memo(CSVRequirementsLoader);