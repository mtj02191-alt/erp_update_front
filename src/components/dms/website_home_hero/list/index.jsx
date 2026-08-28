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

const WebsiteHomeHeroList = () => {
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
      const response = await axiosInstance.get('/website-home-hero', {
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
      setError(err.response?.data?.message || 'Failed to load home hero slides');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rowId) => {
    if (!window.confirm('Hide this slide from the website home hero?')) return;
    try {
      await axiosInstance.delete(`/website-home-hero/${rowId}`);
      fetchRows();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive slide');
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Home Hero Slides"
          onRefresh={fetchRows}
          refreshing={loading}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd
          addPath="/dms/website_home_hero/add"
          addTitle="Add Slide"
        />
        <div className="list-content">
          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-container card">
              <div className="filters-grid">
                <SearchFilter
                  filterKey="search"
                  label="Search title / link"
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
                    <th>Preview</th>
                    <th>Title</th>
                    <th>Link</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.sort_order}</td>
                        <td>
                          {row.desktop_image_url ? (
                            <img
                              src={row.desktop_image_url}
                              alt={row.title || 'slide'}
                              style={{
                                width: 96,
                                height: 48,
                                objectFit: 'cover',
                                borderRadius: 4,
                              }}
                            />
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{row.title || '—'}</td>
                        <td>{row.link || '—'}</td>
                        <td>{row.is_active ? 'Visible' : 'Hidden'}</td>
                        <td>
                          <ActionMenu
                            actions={[
                              {
                                icon: <FiEdit2 />,
                                label: 'Edit',
                                color: '#2196F3',
                                onClick: () =>
                                  navigate(`/dms/website_home_hero/edit/${row.id}`),
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
                      <td colSpan="6" className="text-center">
                        No home hero slides found. Add slides to replace the hardcoded website fallback.
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

export default WebsiteHomeHeroList;
