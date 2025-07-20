import Resolver from '@forge/resolver';
import { storage } from '@forge/api';

const resolver = new Resolver();

// Helpers generales
const getFormattedDateTime = () => {
  const currentdate = new Date();
  return `${currentdate.getDate()}/${currentdate.getMonth() + 1}/${currentdate.getFullYear()} @ ` +
    `${currentdate.getHours()}:${currentdate.getMinutes()}:${currentdate.getSeconds()}`;
};

const createNewCatalogData = (userId: string, title: string, description: string, prefix: string) => ({
  id: `catalog-${Date.now()}`,
  userId,
  dateCreation: getFormattedDateTime(),
  dateUpdate: getFormattedDateTime(),
  title,
  description,
  prefix,
  requirements: []
});

const saveCatalog = async (catalogData: any) => {
  catalogData.dateUpdate = getFormattedDateTime();
  await storage.set(catalogData.id, catalogData);
  return catalogData;
};

const getCatalog = async (catalogId: string) => {
  const catalog = await storage.get(catalogId);
  if (!catalog) throw new Error('Catálogo no encontrado');
  return catalog;
};

const updateCatalogRequirements = async (catalogId: string, updateFn: (requirements: any[]) => any[]) => {
  const catalog = await getCatalog(catalogId);
  catalog.requirements = updateFn(catalog.requirements);

  return saveCatalog(catalog);
};

const updateRequirementIssuesLinked = async (catalogId: string, reqId: string, updateFn: (issues: any[]) => any[], explanation?: string) => {
  return updateCatalogRequirements(catalogId, requirements =>
    requirements.map(req =>
      req.id === reqId ? { ...req, issuesLinked: updateFn(req.issuesLinked || []) } : req
    )
  );
};

const getCatalogsByIds = async (ids: string[]) => {
  const catalogsMap = {};
  await Promise.all(
    ids.map(async id => {
      catalogsMap[id] = await storage.get(id);
    })
  );
  return catalogsMap;
};

// Resolvers para Catálogos
resolver.define('createCatalog', async ({ payload }) => {
  const newCatalog = createNewCatalogData(
    payload.userId,
    payload.title,
    payload.description,
    payload.prefix
  );
  await saveCatalog(newCatalog);
  return newCatalog.id;
});

resolver.define('getAllCatalogs', async () => {
  // Fetch everything from storage
  const allCatalogs = await storage.query().where('key', { condition: 'STARTS_WITH', value: '' }).getMany();
  const result = await storage.query().where('key', { condition: 'STARTS_WITH', value: 'catalog-' }).getMany();
  return result.results.map((item: any) => ({
    id: item.key,
    title: item.value?.title || '',
    description: item.value?.description || '',
    requirements: item.value?.requirements || [],
    prefix: item.value?.prefix || ''
  }));
});

resolver.define('getCatalogById', async ({ payload }) => {
  try {
    const catalog = await getCatalog(payload.id);
    return { ...catalog, requirements: catalog.requirements || [] };
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return { error: error.message };
  }
});

resolver.define('deleteCatalog', async ({ payload }) => {
  // Delete the catalog
  await storage.delete(payload.catalogId);

  // Fetch all issues from storage
  const issueResults = await storage.query().where('key', { condition: 'STARTS_WITH', value: 'issue-' }).getMany();

  for (const item of issueResults.results) {
    // Filter out entries related to the deleted catalog
    const updatedIssue = Array.isArray(item.value) ? item.value
      .filter((entry: any) => entry.catalogId !== payload.catalogId) : [];
    if (updatedIssue.length === 0) {
      // If no entries remain, delete the issue
      await storage.delete(item.key);
    } else {
      // Otherwise, update the issue with the filtered entries
      await storage.set(item.key, updatedIssue);
    }
  }
});

// Resolvers para Requisitos
resolver.define('addRequirement', async ({ payload }) => {
  await updateCatalogRequirements(payload.catalogId, requirements => {
    const reqId = `${payload.prefix}-${requirements.length}`;
    return [
      ...requirements,
      {
      id: reqId,
      heading: payload.formState.reqTitle,
      text: payload.formState.reqDesc,
      important: payload.formState.reqImportant,
      section: payload.formState.section, 
      issuesLinked: [],
      isContainer: false,
      childrenIds: [],
      dependencies: payload.formState.reqDependencies || [],
      riesgo: 0,
      level: 2,
      siblingCount: 0,
      }
    ];
  });
});

resolver.define('updateRequirement', async ({ payload }) => {
  await updateCatalogRequirements(payload.catalogId, requirements =>
    requirements.map(req => req.id === payload.requirementId ? {
      ...req,
      ...payload.updates,
      issuesLinked: req.issuesLinked // Mantener issuesLinked
    } : req)
  );
});

resolver.define('getLinkedRequirements', async ({ payload }) => {
  const issueData: { catalogId: string; reqId: string }[] = await storage.get(`issue-${payload.issueKey}`) || [];
  const uniqueCatalogIds = issueData.map(item => item.catalogId);
  const catalogsMap = await getCatalogsByIds(uniqueCatalogIds);

  return issueData.map(item => {
    const catalog = catalogsMap[item.catalogId];
    const requirement = catalog?.requirements?.find(req => req.id === item.reqId);
    const issueStatus = requirement?.issuesLinked?.find(issue => issue.issueKey === payload.issueKey)?.status;

    return requirement ? {
      ...item,
      ...requirement,
      catalogTitle: catalog.title,
      status: issueStatus
    } : null;
  }).filter(Boolean);
});

resolver.define('getLinkedIssues', async ({ payload }) => {
  const issueResults = await storage.query().where('key', { condition: 'STARTS_WITH', value: 'issue-' }).getMany();
  const results = issueResults.results.filter((item: { value: { catalogId?: string } }) => item.value?.catalogId === payload.catalogId);
  return results;
});

resolver.define('unlinkRequirement', async ({ payload }) => {
  const issueStorageKey = `issue-${payload.issueKey}`;
  const issueData = (await storage.get(issueStorageKey) || [])
    .filter(item => !(item.reqId === payload.reqId && item.catalogId === payload.catalogId));
  await storage.set(issueStorageKey, issueData);

  await updateRequirementIssuesLinked(
    payload.catalogId,
    payload.reqId,
    issues => issues.filter(issue => issue.issueKey !== payload.issueKey)
  );
  const issue = await storage.get(`issue-${payload.issueKey}`) || [];
  const updatedIssue = issue.filter(item => !(item.reqId === payload.reqId && item.catalogId === payload.catalogId));
  if( updatedIssue.length === 0) {
    await storage.delete(`issue-${payload.issueKey}`);
    return;
  }
  await storage.set(`issue-${payload.issueKey}`, updatedIssue);
});

resolver.define('setStatusRequirement', async ({ payload }) => {
  await updateRequirementIssuesLinked(
    payload.catalogId,
    payload.reqId,
    issues => issues.map(issue =>
      issue.issueKey === payload.issueKey ? { ...issue, status: payload.status, explanation: payload.explanation } : issue
    )
    
  );
  const issueStorageKey = `issue-${payload.issueKey}`;
  const issueData = await storage.get(issueStorageKey) || [];
  const updatedIssue = issueData.map(item => {
    if (item.reqId === payload.reqId && item.catalogId === payload.catalogId) {
      return { ...item, status: payload.status, explanation: payload.explanation };
    }
    return item;
  }
  );
  await storage.set(issueStorageKey, updatedIssue);
});

resolver.define('linkRequirementToIssue', async ({ payload }) => {
  const issueStorageKey = `issue-${payload.issueKey}`;
  const issueData = await storage.get(issueStorageKey) || [];
  const newEntry = { reqId: payload.reqId, catalogId: payload.catalogId, status: 'pending_validation' };

  await storage.set(issueStorageKey, [...issueData, newEntry]);

  await updateRequirementIssuesLinked(
    payload.catalogId,
    payload.reqId,
    issues => [
      ...issues,
      {
        issueKey: payload.issueKey,
        linkedAt: Date.now(),
        status: 'pending_validation'
      }
    ]
  );
});

resolver.define('deleteRequirement', async ({ payload }) => {
  await updateCatalogRequirements(payload.catalogId, requirements =>
    requirements.filter(req => req.id !== payload.requirementId)
  );
  const issueResults = await storage.query().where('key', { condition: 'STARTS_WITH', value: 'issue-' }).getMany();
  for (const item of issueResults.results) {
    const updatedIssue = Array.isArray(item.value) ? item.value
      .filter((entry: any) => !(entry.reqId === payload.requirementId && entry.catalogId === payload.catalogId)) : [];
    if (updatedIssue.length === 0) {
      await storage.delete(item.key);
      continue;
    }
    await storage.set(item.key, updatedIssue);
  }
}

  
);

resolver.define('importRequirementsFromCSV', async ({ payload }) => {
  const results: {
    total: number;
    success: number;
    errors: { row: number; error: string }[];
    idMapping: Record<string, any>;
  } = {
    total: 0,
    success: 0,
    errors: [],
    idMapping: {}
  };
  try {
    const rows = payload.csvData.split('\n').slice(1);
    results.total = rows.length;

    const catalog = await getCatalog(payload.catalogId);
    const newRequirements = rows.map((row, index) => {
      try {
        const [
          id,
          title,
          description,
          type,
          category,
          important,
          validation,
          correlationRules,
          dependencies
        ] = row.split(',');
        const correlationFormated = correlationRules?.split(';').map(s => `${catalog.prefix}-${catalog.requirements.length + Number(s)}`) || [];
        const dependenciesFormated = dependencies?.split(';').map(s => `${catalog.prefix}-${catalog.requirements.length + Number(s)}`) || [];
        return {
          id: `${catalog.prefix}-${catalog.requirements.length + index}`,
          userId: payload.userId,
          dateCreation: getFormattedDateTime(),
          dateUpdate: getFormattedDateTime(),
          title: title?.trim() || '',
          description: description?.trim() || '',
          type: type?.trim() || '',
          category: category?.trim() || '',
          important: parseInt(important) || 0,
          validation: validation?.trim() || '',
          correlation: correlationFormated,
          dependencies: dependenciesFormated,
          issuesLinked: []
        };
      } catch (error) {
        results.errors.push({ row: index + 2, error: error.message });
        return null;
      }
    }).filter(Boolean);

    catalog.requirements = [...catalog.requirements, ...newRequirements];

    await saveCatalog(catalog);
    results.success = catalog.requirements.length;

    return results;

  } catch (error) {
    return {
      ...results,
      error: `Error general: ${error.message}`
    };
  }
});

resolver.define('importRequirementsFromCustomCSV', async ({ payload }) => {
  const { requirements, catalogName, catalogDescription, prefix, userId } = payload;
  const results = { total: requirements.length, success: 0, errors: [] as { message: string }[] };
  try {
    const flatReqs = flattenRequirements(requirements, null, catalogName);
    const newCatalog = {
      ...createNewCatalogData(userId.accountId, catalogName, catalogDescription, prefix),
      requirements: flatReqs
    };
    await saveCatalog(newCatalog);
    results.success = flatReqs.length;
    return results;
  } catch (error: any) {
    results.errors.push({ message: `Error al importar requisitos: ${error.message}` });
    return results;
  }
});

const flattenRequirements = (
  requirements: any[],
  parentId: string | null = null,
  catalogName?: string
) => {
  return requirements.reduce((acc, req) => {
    const childrenIds = req.children?.map((c: any) => c.id) || [];
    const flatReq = {
      id: req.id,
      level: req.level,
      section: req.section,
      heading: req.heading,
      text: req.text,
      parentId,
      childrenIds,
      important: req.important,
      nAudit: 0,
      nDep: req.nDep || 0,
      effort: req.effort,
      children: [],
      riesgo: 0,
      dependencies: req.dependencies || [],
      isContainer: !req.text || req.text.trim() === "",
      catalogTitle: catalogName || '',
      siblingCount: 0,
      issuesLinked: req.issuesLinked || [],
    };
    acc.push(flatReq);
    if (req.children?.length) {
      acc.push(...flattenRequirements(req.children, req.id, catalogName));
    }
    return acc;
  }, []);
};

resolver.define('deleteAllData', async () => {
  const allKeys = await storage.query().where('key', { condition: 'STARTS_WITH', value: '' }).getMany();
  for (const item of allKeys.results) {
    await storage.delete(item.key);
  }
  return { success: true, deleted: allKeys.results.length };
});


export const handler = resolver.getDefinitions();