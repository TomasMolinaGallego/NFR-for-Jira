// CSVImporter.jsx
import React, { useState } from 'react';
import {
    Box,
    Text,
    Button,
    TextArea,
    DynamicTable,
    Form
} from '@forge/react';
import { invoke, view } from "@forge/bridge";

const CSVImporter = (catalog, onUpdate) => {
    const [csvData, setCsvData] = useState('');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
            <Text size="xlarge" weight="bold">Importador CSV de Requisitos</Text>
            <Text>Introduce los requisitos en formato CSV. Asegúrate de que el formato sea correcto.</Text>
            <Text>Ejemplo de formato CSV:</Text>
            <Text>Title,Description,Type,Category,Important,Validation,CorrelationRules,Dependencies</Text>
            <Text>User Data Encryption,Ensure that user data is encrypted in transit and at rest,Privacy,Security,90,Encryption protocols in place,REQ-1;REQ-2,REQ-1;REQ-2</Text>

            <Form onSubmit={handleImport}>
                <Box marginTop="medium">
                    <TextArea
                        label="Datos CSV"
                        placeholder="Pega aquí el contenido del CSV..."
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
                        {isLoading ? 'Importando...' : 'Iniciar Importe'}
                    </Button>
                </Box>
            </Form>

            {results && (
                <Box marginTop="xlarge">
                    <Text weight="bold">Resultados:</Text>
                    <Text>Total requisitos añadidos: {results.total}</Text>
                </Box>
            )}
        </Box>
    );
};

export default CSVImporter;