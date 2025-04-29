import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Text,
    Button,
    DynamicTable,
    Tag,
    User,
    Link,
    DonutChart,
    Lozenge,
    Inline,
    ButtonGroup
} from '@forge/react';
import { invoke } from "@forge/bridge";

const STATUS_APPEARANCE = {
    Validated: 'success',
    pending_validation: 'inprogress',
    noStatus: 'moved',
    unknown: 'default'
};

const CatalogDetailPage = ({ catalogId, history }) => {
    const [catalog, setCatalog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [issues, setIssues] = useState([]);
    const [filterSelected, setFilterSelected] = useState('all');
    // En la sección de estados añade
    const [selectedFilter, setSelectedFilter] = useState('all');




    // Memoized data calculations
    const { progress, reqsValidated, reqsWithoutUS, reqsPendingValidation } = useMemo(() => {
        if (!catalog?.requirements) return {};

        const requirementStats = catalog.requirements.reduce((acc, req) => {
            const hasIssues = req.issuesLinked.length > 0;
            const hasPending = req.issuesLinked.some(issue => issue.status === 'pending_validation');

            if (!hasIssues) acc.reqsWithoutUS.push(req);
            else if (hasPending) acc.reqsPendingValidation.push(req);
            else acc.reqsValidated.push(req);

            return acc;
        }, { reqsValidated: [], reqsWithoutUS: [], reqsPendingValidation: [] });

        const completed = requirementStats.reqsValidated.length;
        const total = catalog.requirements.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        return { ...requirementStats, progress };
    }, [catalog]);

    const fetchCatalogData = useCallback(async () => {
        try {
            const [catalogResult, issuesResult] = await Promise.all([
                invoke('getCatalogById', { id: catalogId }),
                invoke('getLinkedIssues', { id: catalogId })
            ]);

            if (catalogResult.error) throw new Error(catalogResult.error);

            const processedIssues = issuesResult.map(issue => {
                const issueKey = issue.key.substring(6);
                return {
                    issueKey,
                    res: issue.value
                        .filter(item => item.catalogId === catalogId)
                        .map(({ reqId, status }) => ({ id: reqId, status }))
                };
            });

            setCatalog({
                ...catalogResult,
                requirements: catalogResult.requirements || []
            });
            setIssues(processedIssues);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [catalogId]);

    useEffect(() => {
        if (catalogId) fetchCatalogData();
    }, [catalogId, fetchCatalogData]);

    const getStatusLozenge = useCallback((status, text) => (
        <Lozenge appearance={STATUS_APPEARANCE[status] || 'default'}>
            {text}
        </Lozenge>
    ), []);

    const formatIssuesList = useCallback((issues) => {
        if (!issues?.length) return 'N/A';

        const baseUrl = window.location.ancestorOrigins?.[0] || '';
        return issues.map(({ issueKey }) => (
            <Text key={issueKey} color="subtlest" size="small">
                <Link href={`${baseUrl}/browse/${issueKey}`} target="_blank">
                    {issueKey}
                </Link>
            </Text>
        ));
    }, []);

        // Modifica el memo de filteredRequirements
        const filteredRequirements = useMemo(() => {
            if (!catalog?.requirements) return [];
    
            switch (selectedFilter) {
                case 'validated':
                    return reqsValidated || [];
                case 'pending':
                    return reqsPendingValidation || [];
                case 'no-link':
                    return reqsWithoutUS || [];
                default:
                    return catalog.requirements;
            }
        }, [selectedFilter, catalog, reqsValidated, reqsPendingValidation, reqsWithoutUS]);

    // Memoized table configurations
    const { tableRowsUs, tableRows } = useMemo(() => {
        const usRows = issues.map(({ issueKey, res }) => ({
            cells: [
                {
                    content: (
                        <Text color="subtlest" size="small">
                            <Link href={`${window.location.ancestorOrigins?.[0]}/browse/${issueKey}`} target="_blank">
                                {issueKey}
                            </Link>
                        </Text>
                    )
                },
                {
                    content: (
                        <Inline>
                            {res.map(({ id, status }) =>
                                getStatusLozenge(status, id)
                            )}
                        </Inline>
                    )
                }
            ]
        }));
        const requirements = ''
        const reqRows = filteredRequirements?.map(req => ({
            cells: [
                { content: req.id },
                { content: <Text weight="medium">{req.title}</Text> },
                { content: req.description },
                { content: req.type || 'N/A' },
                { content: req.category || 'N/A' },
                { content: req.important },
                { content: req.validation || 'N/A' },
                { content: formatIssuesList(req.issuesLinked) },
                { content: req.dependencies?.join(', ') || 'N/A' },
                { content: req.correlation?.join(', ') || 'N/A' },
                {
                    content: getStatusLozenge(
                        req.issuesLinked.length
                            ? req.issuesLinked.some(i => i.status === 'pending_validation')
                                ? 'pending_validation'
                                : 'Validated'
                            : 'noStatus',
                        req.issuesLinked.length ? 'Linked' : 'No US'
                    )
                }
            ]
        })) || [];

        return { tableRowsUs: usRows, tableRows: reqRows };
    }, [issues, filteredRequirements, getStatusLozenge, formatIssuesList]);

    const donutData = useMemo(() => [
        ['inprogress', 'Req. validated', reqsValidated?.length || 0],
        ['done', 'Req. without US', reqsWithoutUS?.length || 0],
        ['todo', 'Req. pending validation', reqsPendingValidation?.length || 0],
    ], [reqsValidated, reqsWithoutUS, reqsPendingValidation]);

    if (error) {
        return (
            <Box padding="medium">
                <Text color="danger" size="xlarge">Error: {error}</Text>
            </Box>
        );
    }

    if (!loading && !catalog) {
        return (
            <Box padding="medium">
                <Text size="xlarge">Catálogo no encontrado</Text>
            </Box>
        );
    }

    return (
        <Box padding="medium">
            <Button
                iconBefore='arrow-left'
                appearance="subtle"
                onClick={history.goBack}
                marginBottom="large"
            >
                Volver
            </Button>

            {loading ? (
                <Text>Cargando...</Text>
            ) : (
                <>
                    <CatalogHeader catalog={catalog} />

                    <Box marginBottom="xlarge">
                        <ComplianceProgress
                            progress={progress}
                            reqsValidated={reqsValidated}
                            reqsWithoutUS={reqsWithoutUS}
                            reqsPendingValidation={reqsPendingValidation}
                            donutData={donutData}
                        />
                    </Box>

                    <Box>
                        <Text size="large" weight="bold" marginBottom="medium">
                            Issues linked to this catalog ({catalog.requirements.length})
                        </Text>

                        <DynamicTable
                            rows={tableRowsUs}
                            head={HEADERS.issues}
                            rowsPerPage={5}
                            emptyView={
                                <Text color="subtlest">Este catálogo no tiene requisitos registrados</Text>
                            }
                        />
                    </Box>

                    <Box marginBottom="xlarge">
                                <Text size="large" weight="bold">
                                    Requisitos ({filteredRequirements.length})
                                </Text>
                                <Text></Text>
                                <ButtonGroup>
                                    <Button
                                        appearance={selectedFilter === 'all' ? 'primary' : 'default'}
                                        onClick={() => setSelectedFilter('all')}
                                    >
                                        Todos ({catalog?.requirements?.length || 0})
                                    </Button>
                                    <Button
                                        appearance={selectedFilter === 'validated' ? 'primary' : 'default'}
                                        onClick={() => setSelectedFilter('validated')}
                                    >
                                        Validados ({reqsValidated?.length || 0})
                                    </Button>
                                    <Button
                                        appearance={selectedFilter === 'pending' ? 'primary' : 'default'}
                                        onClick={() => setSelectedFilter('pending')}
                                    >
                                        Pendientes ({reqsPendingValidation?.length || 0})
                                    </Button>
                                    <Button
                                        appearance={selectedFilter === 'no-link' ? 'primary' : 'default'}
                                        onClick={() => setSelectedFilter('no-link')}
                                    >
                                        Sin US ({reqsWithoutUS?.length || 0})
                                    </Button>
                                    </ButtonGroup>

                            <DynamicTable
                                rows={tableRows}
                                head={HEADERS.requirements}
                                rowsPerPage={5}
                                emptyView={
                                    <Text color="subtlest">
                                        {selectedFilter === 'all'
                                            ? 'Este catálogo no tiene requisitos registrados'
                                            : `No hay requisitos en la categoría ${selectedFilter}`
                                        }
                                    </Text>
                                }
                            />
                    </Box>
                </>
            )}
        </Box>
    );
};

// Sub-componentes
const CatalogHeader = React.memo(({ catalog }) => (
    <Box marginBottom="xlarge">
        <Text size="large" weight="bold">{catalog.title}</Text>
        <Box marginTop="medium">
            <Text weight="bold">Descripción:</Text>
            <Text></Text>
            <Text color="subtlest">{catalog.description}</Text>
            <Text></Text>
        </Box>
        <Inline spread="space-between" marginTop="medium">
            <Tag text={catalog.prefix} appearance="primary" />
            <User accountId={catalog.userId} />
            <Text>Creación: {catalog.dateCreation}</Text>
            <Text>Actualizado: {catalog.dateUpdate}</Text>
        </Inline>
    </Box>
));

const ComplianceProgress = React.memo(({ progress, donutData, ...stats }) => (
    <Box>
        <Text weight="bold" marginBottom="medium">Estado de cumplimiento</Text>
        <Inline spread="space-between">
            <Box>
                <Text>Validados: {stats.reqsValidated.length}</Text>
                <Text>Sin US: {stats.reqsWithoutUS.length}</Text>
                <Text>Pendientes: {stats.reqsPendingValidation.length}</Text>
            </Box>
        </Inline>

        <DonutChart
            data={donutData}
            title="Progreso de verificación"
            colorAccessor={0}
            labelAccessor={1}
            valueAccessor={2}
        />
    </Box>
));

const DataTableSection = React.memo(({ title, rows, head, emptyMessage }) => (
    <Box marginBottom="xlarge">
        <Text size="large" weight="bold" marginBottom="medium">{title}</Text>
        <DynamicTable
            rows={rows}
            head={head}
            rowsPerPage={10}
            emptyView={<Text color="subtlest">{emptyMessage}</Text>}
        />
    </Box>
));

// Configuración de headers
const HEADERS = {
    issues: {
        cells: [
            { key: "issueId", content: "Issue ID", isSortable: true },
            { key: "linkedReqs", content: "Requisitos Vinculados", isSortable: false }
        ]
    },
    requirements: {
        cells: [
            { key: "id", content: "ID", isSortable: true },
            { key: "title", content: "Título", isSortable: false },
            { key: "summary", content: "Resumen", shouldTruncate: true },
            { key: "type", content: "Tipo", shouldTruncate: true },
            { key: "category", content: "Categoría", shouldTruncate: true },
            { key: "important", content: "Importancia", isSortable: true },
            { key: "validation", content: "Validación", shouldTruncate: true },
            { key: "linkedIssues", content: "Issues Vinculados" },
            { key: "dependencies", content: "Dependencias", isSortable: true },
            { key: "correlation", content: "Correlación", isSortable: true },
            { key: "status", content: "Estado" }
        ]
    }
};

export default React.memo(CatalogDetailPage);