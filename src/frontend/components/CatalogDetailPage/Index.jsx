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
    ButtonGroup,
    Badge,
    ModalTransition,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Stack
} from '@forge/react';
import { invoke } from "@forge/bridge";

const STATUS_APPEARANCE = {
    Validated: 'success',
    pending_validation: 'inprogress',
    Unfulfilled: 'removed',
    validated_with_risk: 'new',
    accept_risk: 'new',
    noStatus: 'moved',
    unknown: 'default'
};

/**
 * Component to display all the details of a catalog, including its requirements and issues linked to it.
 * It fetches the data from the server and displays it in a structured format.
 * It also provides filtering options for the requirements based on their status.
 */
const CatalogDetailPage = ({ catalogId, history }) => {
    const [catalog, setCatalog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [issues, setIssues] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showMotivesModal, setShowMotivesModal] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState(null);


    // Memoized data calculations
    const { progress, reqsValidated, reqsWithoutUS, reqsPendingValidation, reqsUnfilfilled, reqsValidatedWithRisk } = useMemo(() => {
        if (!catalog?.requirements) return {};
        // From the catalog selected, we calculate the requirements stats based on their status
        catalog.requirements = catalog.requirements.filter(req => !req.isContainer);
        const requirementStats = catalog.requirements.reduce((acc, req) => {
            if(!req.issuesLinked) return acc; // Skip if no issues linked
            const hasIssues = req.issuesLinked.length > 0;
            const hasPending = req.issuesLinked.some(issue => issue.status === 'pending_validation');
            const hasUnfulfilled = req.issuesLinked.some(issue => issue.status === 'Unfulfilled');
            let isValidatedWithRisk = false;
            if (req.issuesLinked.some(issue => issue.status === 'accept_risk') &&
                req.issuesLinked.every(issue => issue.status === 'Validated' || issue.status === 'accept_risk')) {
                isValidatedWithRisk = 'validated_with_risk';
            }
            if (!hasIssues) acc.reqsWithoutUS.push(req);
            else if (hasUnfulfilled) acc.reqsUnfilfilled.push(req);
            else if (hasPending) acc.reqsPendingValidation.push(req);
            else if (isValidatedWithRisk) acc.reqsValidatedWithRisk.push(req);
            else acc.reqsValidated.push(req);

            return acc;
        }, { reqsValidated: [], reqsWithoutUS: [], reqsPendingValidation: [], reqsUnfilfilled: [], reqsValidatedWithRisk: [] });
        const completed = requirementStats.reqsValidated.length;
        const total = catalog.requirements.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        return { ...requirementStats, progress };
    }, [catalog]);

    // Fetch catalog data and linked issues
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
            setIssues(processedIssues.filter(issue => issue.res.length > 0));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [catalogId]);

    // Fetch data when the component mounts or catalogId changes
    useEffect(() => {
        if (catalogId) fetchCatalogData();
    }, [catalogId, fetchCatalogData]);

    const getStatusLozenge = useCallback((status, text) => (
        <Lozenge appearance={STATUS_APPEARANCE[status] || 'default'}>
            {text}
        </Lozenge>
    ), []);

    const determinateStatus = useCallback((issuesLinked) => {
        if (!issuesLinked?.length) return 'noStatus';
        if (issuesLinked.some(issue => issue.status === 'accept_risk') &&
            issuesLinked.every(issue => issue.status === 'Validated' || issue.status === 'accept_risk')) {
            return 'validated_with_risk';
        }
        if (issuesLinked.some(issue => issue.status === 'Unfulfilled')) return 'Unfulfilled';
        if (issuesLinked.some(issue => issue.status === 'pending_validation')) return 'pending_validation';
        if (issuesLinked.every(issue => issue.status === 'Validated')) return 'Validated';
        return 'Unknown';
    }, []);


    // Format the list of issues linked to a requirement
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

    const filteredRequirements = useMemo(() => {
        if (!catalog?.requirements) return [];

        switch (selectedFilter) {
            case 'validated':
                const reqs = []
                reqs.push(...reqsValidated);
                reqs.push(...reqsValidatedWithRisk);
                return reqs;
            case 'pending':
                return reqsPendingValidation || [];
            case 'no-link':
                return reqsWithoutUS || [];
            case 'unfulfilled':
                return reqsUnfilfilled || [];
            default:
                return catalog.requirements;
        }
    }, [selectedFilter, catalog, reqsValidated, reqsPendingValidation, reqsWithoutUS]);

    // On calcule the rows for the tables based on the issues and requirements
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
        const reqRows = filteredRequirements?.map(req => ({
            cells: [
                { content: req.id },
                { content: <Text weight="medium">{req.header}</Text> },
                { content: req.text },
                { content: req.important },
                { content: formatIssuesList(req.issuesLinked) },
                { content: req.dependencies?.join(', ') || 'N/A' },
                { content: req.correlation?.join(', ') || 'N/A' },
                {
                    content: getStatusLozenge(
                        determinateStatus(req.issuesLinked),
                        determinateStatus(req.issuesLinked)
                    )
                },
                {
                    content: req.issuesLinked.some(issue =>
                        issue.status === 'Unfulfilled' ||
                        issue.status === 'validated_with_risk' ||
                        issue.status === 'accept_risk'
                    ) ? (
                        <Button
                            appearance="link"
                            onClick={() => {
                                setSelectedRequirement(req);
                                setShowMotivesModal(true);
                            }}
                        >
                            Press
                        </Button>
                    ) : "N/A"
                }
            ]
        })) || [];

        return { tableRowsUs: usRows, tableRows: reqRows };
    }, [issues, filteredRequirements, getStatusLozenge, formatIssuesList]);



    // Declaration of the configuration of the donut chart
    const donutData = useMemo(() => [
        ['validated', 'Req. validated', reqsValidated?.length || 0],
        ['dowithoutUS', 'Req. without US', reqsWithoutUS?.length || 0],
        ['pending', 'Req. pending validation', reqsPendingValidation?.length || 0],
        ['unfulfilled', 'Req. unfulfilled', reqsUnfilfilled?.length || 0],
        ['validated_with_risk', 'Req. validated with risk', reqsValidatedWithRisk?.length || 0]
    ], [reqsValidated, reqsWithoutUS, reqsPendingValidation, reqsUnfilfilled, reqsValidatedWithRisk]);

    //-------------------------------------
    // Code REACT
    //-------------------------------------

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
                <Text size="xlarge">Catalog not found</Text>
            </Box>
        );
    }
    const tableStyles = {
        container: {
          minHeight: '500px',
          overflow: 'auto'
        },
        header: {
          position: 'sticky',
          top: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 1
        }
      };
    return (
        <Box padding="medium">
            <Button
                iconBefore='arrow-left'
                appearance="subtle"
                onClick={history.goBack}
                marginBottom="large"
            >
                Return
            </Button>

            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <>
                    <CatalogHeader catalog={catalog} />

                    <Box marginBottom="xlarge">
                        <ComplianceProgress
                            progress={progress}
                            reqsValidated={reqsValidated}
                            reqsWithoutUS={reqsWithoutUS}
                            reqsPendingValidation={reqsPendingValidation}
                            reqsUnfilfilled={reqsUnfilfilled}
                            reqsValidatedWithRisk={reqsValidatedWithRisk}
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
                                <Text color="subtlest">This catalog doesn't have any requirements linked</Text>
                            }
                        />
                    </Box>

                    <Box
                        marginBottom="xlarge"
                        xcss={tableStyles.container}
                    >
                        <Text size="large" weight="bold">
                            Requirements ({filteredRequirements.length})
                        </Text>
                        <Text></Text>
                        <ButtonGroup>
                            <Button
                                appearance={selectedFilter === 'all' ? 'primary' : 'default'}
                                onClick={() => setSelectedFilter('all')}
                            >
                                All ({catalog?.requirements?.length || 0})
                            </Button>
                            <Button
                                appearance={selectedFilter === 'validated' ? 'primary' : 'default'}
                                onClick={() => setSelectedFilter('validated')}
                            >
                                Validated ({reqsValidated?.length + reqsValidatedWithRisk?.length || 0})
                            </Button>
                            <Button
                                appearance={selectedFilter === 'pending' ? 'primary' : 'default'}
                                onClick={() => setSelectedFilter('pending')}
                            >
                                Pending ({reqsPendingValidation?.length || 0})
                            </Button>
                            <Button
                                appearance={selectedFilter === 'unfulfilled' ? 'primary' : 'default'}
                                onClick={() => setSelectedFilter('unfulfilled')}
                            >
                                Unfulfilled ({reqsUnfilfilled?.length || 0})
                            </Button>
                            <Button
                                appearance={selectedFilter === 'no-link' ? 'primary' : 'default'}
                                onClick={() => setSelectedFilter('no-link')}
                            >
                                Without US ({reqsWithoutUS?.length || 0})
                            </Button>
                        </ButtonGroup>

                        <DynamicTable
                            rows={tableRows}
                            head={HEADERS.requirements}
                            rowsPerPage={5}
                            emptyView={
                                <Text color="subtlest">
                                    {selectedFilter === 'all'
                                        ? 'This catalog doesn\'t have any requirements'
                                        : `There is no requirements for this category ${selectedFilter}`
                                    }
                                </Text>
                            }
                        />
                        {showMotivesModal && (
                            <MotivesUnfullfilmentModal
                                requirement={selectedRequirement}
                                onClose={() => setShowMotivesModal(false)}
                            />
                        )}
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
        <Text></Text>
        <Box marginTop="medium">
            <Text weight="bold">Description:</Text>
            <Text></Text>
            <Text color="subtlest">{catalog.description}</Text>
            <Text></Text>
        </Box>
        <Inline spread="space-between" marginTop="medium">
            {console.log('Catalog prefix:', catalog)}
            <Text weight="bold">Prefix: <Text><Tag text={catalog.prefix} appearance="primary" /></Text></Text>
            <Text weight="bold">Owner:</Text><User accountId={catalog.userId} />
            <Text><Text weight="bold">Creation date:</Text> {catalog.dateCreation}</Text>
            <Text><Text weight="bold">Last modification:</Text> {catalog.dateUpdate}</Text>
        </Inline>
    </Box>
));

const ComplianceProgress = React.memo(({ progress, donutData, ...stats }) => (
    <Box>
        <Text weight="bold" marginBottom="medium">Compliance Status</Text>
        <Inline spread="space-between">
            <Box>
                <Text>Requirements validated: <Lozenge>{stats.reqsValidated.length}</Lozenge></Text>
                <Text>Requirements validated with risk: <Lozenge>{stats.reqsValidatedWithRisk.length}</Lozenge></Text>
                <Text>Requierements without US: <Lozenge>{stats.reqsWithoutUS.length}</Lozenge></Text>
                <Text>Requirements pending validation: <Lozenge>{stats.reqsPendingValidation.length}</Lozenge></Text>
                <Text>Requirements unfulfilled: <Lozenge>{stats.reqsUnfilfilled.length}</Lozenge></Text>
            </Box>
        </Inline>

        <DonutChart
            data={donutData}
            title="Verification progess"
            colorAccessor={0}
            labelAccessor={1}
            valueAccessor={2}
        />
    </Box>
));

// Headers configuration
const HEADERS = {
    issues: {
        cells: [
            { key: "issueId", content: "Issue ID", isSortable: true },
            { key: "linkedReqs", content: "Requirements linked", isSortable: false }
        ]
    },
    requirements: {
        cells: [
            { key: "id", content: "ID", isSortable: true },
            { key: "title", content: "Title", isSortable: false },
            { key: "summary", content: "Description", shouldTruncate: true },
            { key: "important", content: "Importance", isSortable: true },
            { key: "linkedIssues", content: "Issues Vinculados" },
            { key: "dependencies", content: "Dependencies", isSortable: true },
            { key: "status", content: "Status" },
            { key: "motives", content: "Motives" }
        ]
    }
};

const MotivesUnfullfilmentModal = ({ requirement, onClose }) => {
    const motives = requirement?.issuesLinked?.filter(issue =>
        ['Unfulfilled', 'validated_with_risk', 'accept_risk'].includes(issue.status)
        || []);

    return (
        <ModalTransition>
            <Modal onClose={onClose}>
                <ModalHeader>
                    <Text size="xlarge" weight="bold" >Motives - {requirement?.id} {requirement?.header}</Text>
                </ModalHeader>

                <ModalBody>
                    
                    <Text color="subtlest"> {requirement?.validation}</Text>
                    <Text color="subtlest" weight="bold">Motives for the status of the requirement</Text>
                    <Text></Text>
                    <Stack alignInline="start" space="space.200">
                        {motives.length > 0 ? (
                            motives
                                .filter(issue => issue.explanation) // Filter out issues with empty explanation
                                .map((issue, index) => (
                                    <Box key={index} padding="small" border="standard" marginBottom="small">
                                        <Inline space="space.200">
                                            <Lozenge appearance={STATUS_APPEARANCE[issue.status] || 'default'}>
                                                {issue.status}
                                            </Lozenge>
                                            <Text color="subtlest" size="small">{issue.issueKey}</Text>
                                        </Inline>
                                        <Text marginTop="small">{issue.explanation}</Text>
                                    </Box>
                                ))
                        ) : (
                            <Text color="subtlest">No se encontraron motivos registrados</Text>
                        )}
                    </Stack>
                </ModalBody>

                <ModalFooter>
                    <Button onClick={onClose}>Close</Button>
                </ModalFooter>
            </Modal>
        </ModalTransition>
    );
};

export default React.memo(CatalogDetailPage);