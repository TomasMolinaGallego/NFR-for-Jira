// CSVImporter.jsx
import React, { useState } from 'react';
import {
    Box,
    Text,
    Button,
    TextArea,
    Form
} from '@forge/react';
import { invoke, view } from "@forge/bridge";

/**
 * Component to import requirements from a CSV file.
 * It allows the user to paste CSV data into a text area and submit it for processing.
 * @returns 
 */
const CSVImporter = (catalog) => {
    const [csvData, setCsvData] = useState('');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * * Handler to process the CSV data when the form is submitted.
     * It calls the backend function to import the requirements and reload the state with the results.
     */
    const handleImport = async () => {
        setIsLoading(true);
        const importResults = await invoke('importRequirementsFromCSV', {
            csvData,
            catalogId: catalog.catalogId,
            userId: view.getContext().accountId
        });
        setCsvData('');
        setIsLoading(false);
        setResults(importResults);
    }


    return (
        <Box padding="medium">
            <Text size="xlarge" weight="bold">Requirements CSV Importer</Text>
            <Text>Enter the requirements in CSV format. Make sure the format is correct.</Text>
            <Text>Example of CSV format:</Text>
            <Text>ID,Title,Description,Type,Category,Important,Validation,CorrelationRules,Dependencies</Text>
            <Text>1,Fast Page Load,Ensure that webpages load within 2 seconds under normal load,Non-Functional,Performance,90,Load tests measuring page response times,2;3,4;5</Text>

            <Form onSubmit={handleImport}>
                <Box marginTop="medium">
                    <TextArea
                        label="CSV data"
                        placeholder="Paste here the content of the CSV..."
                        value={csvData}
                        onChange={e => setCsvData(e.target.value)}
                        rows={10}
                        isRequired
                    />
                </Box>
                <Text></Text>
                <Box marginTop="large">
                    <Button
                        appearance="primary"
                        type="submit"
                        isDisabled={isLoading}
                    >
                        {isLoading ? 'Importing...' : 'Start import'}
                    </Button>
                </Box>
            </Form>

            {results && (
                <Box marginTop="xlarge">
                    <Text weight="bold">Results:</Text>
                    <Text>Total requirements added: {results.total}</Text>
                </Box>
            )}
        </Box>
    );
};

export default CSVImporter;