import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import { SearchFilter, CollapsibleFilters, SearchButton, ClearButton } from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const WebsiteDonationProjectList = () => {
  const navigate = useNavigate();
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState({ search: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '' });

  useEffect(() => {
    fetchRows();
  }, [currentPage, pageSize, appliedFilters]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/website-donation-projects', {
        params: {
          page: currentPage,
          pageSize,
          search: appliedFilters.search || undefined,
        },
      });
      if (response.data.success) {
        setRows(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load website donation projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hide this project from the website donation form?')) return;
    try {
      await axiosInstance.delete(`/website-donation-projects/${id}`);
      fetchRows();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive project');
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Website Donation Projects"
          onRefresh={fetchRows}
          refreshing={loading}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd
          addPath="/dms/website_donation_projects/add"
          addTitle="Add Project"
        />
        <div className="list-content">
          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-container card">
              <div className="filters-grid">
                <SearchFilter
                  filterKey="search"
                  label="Search title / slug"
                  filters={tempFilters}
                  onFilterChange={(key, value) =>
                    setTempFilters((prev) => ({ ...prev, [key]: value }))
                  }
                />
              </div>
              <div className="filters-actions">
                <SearchButton
                  onClick={() => {
                    setAppliedFilters(tempFilters);
                    setCurrentPage(1);
                  }}
                  loading={loading}
                />
                <ClearButton
                  onClick={() => {
                    const empty = { search: '' };
                    setTempFilters(empty);
                    setAppliedFilters(empty);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </CollapsibleFilters>

          {error && <div className="error-message">{error}</div>}

          <div className="table-container card">
            {loading && rows.length === 0 ? (
              <div className="loading">Loading...</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Title</th>
                    <th>Slug</th>
                    <th>Category</th>
                    <th>Initiatives</th>
                    <th>Catalog</th>
                    <th>Page</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.sort_order}</td>
                        <td>
                          {row.title}
                          {row.is_default ? ' (default)' : ''}
                          {row.is_new ? ' (new)' : ''}
                        </td>
                        <td>{row.slug}</td>
                        <td>{row.category}</td>
                        <td>
                          {(row.initiatives || []).filter((i) => !i.is_archived).length}
                        </td>
                        <td>{row.is_active ? 'Visible' : 'Hidden'}</td>
                        <td>
                          {row.page_content?.is_published ? 'Published' : 'Draft'}
                        </td>
                        <td>
                          <ActionMenu
                            actions={[
                              {
                                icon: <FiEdit2 />,
                                label: 'Edit',
                                color: '#2196F3',
                                onClick: () =>
                                  navigate(`/dms/website_donation_projects/edit/${row.id}`),
                                visible: true,
                              },
                              {
                                icon: <FiTrash2 />,
                                label: 'Archive',
                                color: '#f44336',
                                onClick: () => handleDelete(row.id),
                                visible: true,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">
                        No website donation projects found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default WebsiteDonationProjectList;
