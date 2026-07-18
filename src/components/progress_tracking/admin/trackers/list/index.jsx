import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import Pagination from '../../../../common/Pagination';
import { SearchFilter } from '../../../../common/filters';
import { DropdownFilter } from '../../../../common/filters';
import { SearchButton, ClearButton } from '../../../../common/filters';
import { FiEye } from 'react-icons/fi';




const TrackersList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batchOptions, setBatchOptions] = useState([]);
  const [templateOptions, setTemplateOptions] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tempFilters, setTempFilters] = useState({
    search: '',
    template_id: '',
    batch_id: '',
    // batch_status: 'open',
    batch_number: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    template_id: '',
    batch_id: '',
    // batch_status: 'open',
    batch_number: '',
  });

  const fetchBatchOptions = async () => {
    try {
      const res = await axiosInstance.get('/progress/batches/options', {
        params: { status: 'open' },
      });
      if (res.data?.success) {
        const items = res.data.data || [];
        setBatchOptions(
          items.map((b) => {
            const tag =
              b.tag_number != null && String(b.tag_number).trim() !== ''
                ? String(b.tag_number).trim()
                : null;
            const tname =
              b.tag_name != null && String(b.tag_name).trim() !== ''
                ? String(b.tag_name).trim()
                : null;
            return {
              value: String(b.id),
              label: `Batch #${b.batch_number}${tag ? ` · ${tag}` : ''}${tname ? ` (${tname})` : ''}${b.template_name ? ` — ${b.template_name}` : ''} (${b.allocated_parts}/${b.batch_parts})`,
            };
          }),
        );
      }
    } catch (e) {
      // ignore; tracker list still works without dropdown options
    }
  };

  const fetchTemplateOptions = async () => {
    try {
      const res = await axiosInstance.get('/progress/workflow-templates');
      if (res.data?.success) {
        const items = res.data.data || [];
        setTemplateOptions(
          items.map((tpl) => ({
            value: String(tpl.id),
            label: tpl.code ? `${tpl.name} (${tpl.code})` : tpl.name,
          })),
        );
      }
    } catch (e) {
      // ignore; template filter optional
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        pageSize,
        search: appliedFilters.search || undefined,
        template_id: appliedFilters.template_id || undefined,
        batch_id: appliedFilters.batch_id || undefined,
        // batch_status: appliedFilters.batch_status || undefined,
        batch_number: appliedFilters.batch_number || undefined,
      };
      const res = await axiosInstance.get('/progress/trackers', { params });
      if (res.data?.success) {
        setRows(res.data.data || []);
        setTotalItems(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res.data?.message || 'Failed to load trackers');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load trackers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchOptions();
    fetchTemplateOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  const handleFilterChange = (key, value) => setTempFilters((p) => ({ ...p, [key]: value }));
  const handleApply = () => {
    setAppliedFilters(tempFilters);
    setCurrentPage(1);
  };
  const handleClear = () => {
    const empty = {
      search: '',
      template_id: '',
      batch_id: '',
      // batch_status: 'open',
      batch_number: '',
    };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const actionsFor = (t) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/progress/trackers/${t.id}`),
      visible: true,
    },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Progress Trackers" showBackButton={false} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Progress Trackers"
          showBackButton={false}
          showAdd={true}
          addPath="/progress/trackers/add"
          addTitle="Create tracker"
        />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="filters-section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search by template/donation id..."
            />
            <DropdownFilter
              filterKey="template_id"
              label="Workflow template"
              data={templateOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All templates"
              showClearButton={true}
            />
            {/* <DropdownFilter
              filterKey="batch_status"
              label="Batch Status"
              data={[
                { value: 'open', label: 'Open' },
                { value: 'closed', label: 'Closed' },
              ]}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Select status"
            /> */}
            <DropdownFilter
              filterKey="batch_id"
              label="Batch"
              data={batchOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All open batches"
              showClearButton={true}
            />
            <SearchFilter
              filterKey="batch_number"
              label="Batch #"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="e.g. 12"
              showIcon={false}
            />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <SearchButton onClick={handleApply} text="Search" loading={loading} />
              <ClearButton onClick={handleClear} text="Clear" />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Template</th>
                  <th className="hide-on-mobile">Donation ID</th>
                  <th className="hide-on-mobile">Batches</th>
                  <th>Overall</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t?.template?.name || '-'}</td>
                    <td className="hide-on-mobile">{t.donation_id || '-'}</td>
                    <td className="hide-on-mobile">
                      {Array.isArray(t.allocation_batches) && t.allocation_batches.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          {t.allocation_batches.map((b) => (
                            <Link
                              key={b.batch_id}
                              to={`/progress/trackers/${t.id}?batch_id=${b.batch_id}`}
                              style={{
                                fontSize: '13px',
                                color: '#2563eb',
                                textDecoration: 'underline',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              #{b.batch_number}
                              {b.parts_count ? ` (${b.parts_count}p)` : ''}
                            </Link>
                          ))}
                        </div>
                      ) : t.batch_number != null && t.batch_number !== '' ? (
                        <Link
                          to={`/progress/trackers/${t.id}`}
                          style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'underline' }}
                        >
                          #{t.batch_number}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{t.overall_status}</td>
                    <td className="table-actions">
                      <ActionMenu actions={actionsFor(t)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(ps) => {
                setPageSize(ps);
                setCurrentPage(1);
              }}
              onSortChange={() => {}}
              sortOptions={[]}
            />
          )}

          {rows.length === 0 && totalItems === 0 && (
            <div className="empty-state" style={{ padding: '20px' }}>
              No trackers found.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TrackersList;

