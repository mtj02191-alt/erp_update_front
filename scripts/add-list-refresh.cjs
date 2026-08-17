const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.join(__dirname, '../src');
const SKIP_FILES = new Set([
  path.normalize('components/admin/tasks/list/index.jsx'),
  path.normalize('components/admin/tasks/board/index.jsx'),
]);

const FETCH_OVERRIDE = {
  'components/donations/donation_box/list/index.jsx': 'fetchDonations',
  'components/dms/donations/donation_box/list/index.jsx': 'fetchDonations',
  'components/dms/geographic/regions/list/index.jsx': 'fetchRegions',
  'components/dms/geographic/countries/list/index.jsx': 'fetchCountries',
  'components/dms/geographic/routes/list/index.jsx': 'fetchRoutes',
  'components/dms/geographic/cities/list/index.jsx': 'fetchCities',
  'components/dms/geographic/tehsils/list/index.jsx': 'fetchTehsils',
  'components/dms/geographic/districts/list/index.jsx': 'fetchDistricts',
  'components/program/subprograms/list/index.jsx': 'fetchSubprograms',
  'components/progress_tracking/admin/trackers/list/index.jsx': 'fetchData',
  'components/progress_tracking/admin/templates/list/index.jsx': 'fetchData',
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === 'index.jsx' && full.includes(`${path.sep}list${path.sep}`)) files.push(full);
  }
  return files;
}

function detectFetchFn(content, relPath) {
  if (FETCH_OVERRIDE[relPath]) return FETCH_OVERRIDE[relPath];

  const fetchFns = [...content.matchAll(/const\s+(fetch\w+)\s*=\s*async/g)].map((m) => m[1]);
  if (fetchFns.length === 1) return fetchFns[0];

  for (const name of fetchFns) {
    if (new RegExp(`handleApplyFilters[\\s\\S]{0,400}?${name}\\(`).test(content)) return name;
  }

  const useEffectCalls = [...content.matchAll(/useEffect\([\s\S]*?\b(fetch\w+)\(/g)].map((m) => m[1]);
  if (useEffectCalls.length) return useEffectCalls[useEffectCalls.length - 1];

  const preferred = fetchFns.find((n) => /^(fetchData|fetchRows|fetchReports|fetchItems|fetchTemplates|fetchDonations|fetchDonors|fetchCampaigns|fetchEvents|fetchAppeals|fetchVolunteers|fetchSurveys|fetchJobs|fetchApplications|fetchTargets|fetchPrograms|fetchRecords|fetchSocialPosts|fetchPledges|fetchBatches)$/i.test(n));
  if (preferred) return preferred;

  return fetchFns[fetchFns.length - 1] || null;
}

function hasShowFilterToggle(content) {
  return /<PageHeader[\s\S]*?showFilterToggle/.test(content) && !/<PageHeader[\s\S]*?\/\*>/.test(content.split('showFilterToggle')[0].slice(-200));
}

function ensureRefreshImport(content) {
  if (content.includes('RefreshButton')) return content;

  const filtersImport = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]*filters[^'"]*)['"]/);
  if (filtersImport) {
    const names = filtersImport[1];
    if (!names.includes('RefreshButton')) {
      const newNames = `${names.trim().replace(/,\s*$/, '')}, RefreshButton`;
      return content.replace(filtersImport[0], `import { ${newNames} } from '${filtersImport[2]}'`);
    }
    return content;
  }

  const depth = (content.match(/from ['"]\.\.\//g) || []).length;
  const pageHeaderMatch = content.match(/import PageHeader from ['"]([^'"]+)['"]/);
  if (pageHeaderMatch) {
    const filtersPath = pageHeaderMatch[1].replace(/PageHeader$/, 'filters');
    return content.replace(
      pageHeaderMatch[0],
      `${pageHeaderMatch[0]}\nimport { RefreshButton } from '${filtersPath}';`,
    );
  }

  return content;
}

function patchPageHeaders(content, fetchFn) {
  if (!hasShowFilterToggle(content)) return content;
  if (content.includes('onRefresh={')) return content;

  return content.replace(/<PageHeader\b/g, (match, offset) => {
    const slice = content.slice(offset, offset + 1200);
    if (slice.trimStart().startsWith('{/*')) return match;
    return '<PageHeader\n          onRefresh={' + fetchFn + '}\n          refreshing={loading}';
  });
}

function insertRefreshInFilters(content, fetchFn) {
  if (content.includes('<RefreshButton')) return content;

  const refreshLine = `            <RefreshButton onClick={${fetchFn}} loading={loading} />\n`;

  if (content.includes('filters-actions')) {
    return content.replace(
      /(<div className="filters-actions">)/,
      `$1\n${refreshLine.trimEnd()}`,
    );
  }

  if (content.includes('<ClearButton')) {
    return content.replace(
      /(<ClearButton[\s\S]*?\/>)/,
      `$1\n              <RefreshButton onClick={${fetchFn}} loading={loading} />`,
    );
  }

  if (content.includes('filters-section')) {
    return content.replace(
      /(<div className="filters-section"[^>]*>)/,
      `$1\n            <RefreshButton onClick={${fetchFn}} loading={loading} />`,
    );
  }

  if (content.includes('filters-container')) {
    return content.replace(
      /(<div className="filters-container[^"]*">)/,
      `$1\n            <RefreshButton onClick={${fetchFn}} loading={loading} />`,
    );
  }

  const tableIdx = content.indexOf('<div className="table-container"');
  const listContentIdx = content.indexOf('<div className="list-content"');
  const insertAt = tableIdx !== -1 ? tableIdx : listContentIdx;
  if (insertAt === -1) return content;

  const bar = `          <div className="list-refresh-bar">\n            <RefreshButton onClick={${fetchFn}} loading={loading} />\n          </div>\n\n          `;
  return content.slice(0, insertAt) + bar + content.slice(insertAt);
}

function patchFile(filePath) {
  const rel = path.relative(SRC_ROOT, filePath).replace(/\\/g, '/');
  if (SKIP_FILES.has(rel)) return { rel, status: 'skipped-manual' };

  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('PageHeader') && !content.includes('list-wrapper') && !content.includes('list-content')) {
    return { rel, status: 'skipped-no-list' };
  }

  const fetchFn = detectFetchFn(content, rel);
  if (!fetchFn) return { rel, status: 'skipped-no-fetch' };

  const original = content;
  const withFilterToggle = hasShowFilterToggle(content);

  if (withFilterToggle) {
    content = patchPageHeaders(content, fetchFn);
  } else {
    content = ensureRefreshImport(content);
    content = insertRefreshInFilters(content, fetchFn);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { rel, status: withFilterToggle ? 'header' : 'filters', fetchFn };
  }

  return { rel, status: 'unchanged', fetchFn };
}

const files = walk(SRC_ROOT);
const results = files.map(patchFile);
console.log(JSON.stringify(results, null, 2));
