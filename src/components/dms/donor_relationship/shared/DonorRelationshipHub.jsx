import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers } from 'react-icons/fi';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { useDonorRelationshipScope } from './donorRelationshipScope';
import '../donor-relationship.css';

/**
 * Shared shell: main tabs (Follow Ups | Interactions) + team/self toggle.
 * @param {'follow-ups'|'interactions'} activeTab
 * @param {React.ReactNode} panelHeader - optional row inside panel (e.g. due buckets)
 * @param {React.ReactNode} children - toolbar + table
 */
const DonorRelationshipHub = ({ activeTab, panelHeader, children }) => {
  const navigate = useNavigate();
  const { scope, setScope, canViewTeam } = useDonorRelationshipScope();

  const scopeQuery = scope === 'team' ? '?scope=team' : '';

  const goTab = (tab) => {
    const path =
      tab === 'interactions'
        ? '/dms/donor-relationship/interactions'
        : '/dms/donor-relationship/follow-ups';
    navigate(`${path}${scopeQuery}`);
  };

  const selfLabel = activeTab === 'follow-ups' ? 'My follow-ups' : 'My interactions';
  const teamLabel = activeTab === 'follow-ups' ? 'Team follow-ups' : 'Team interactions';

  return (
    <>
      <Navbar />
      <div className="view-wrapper dr-hub-page">
        <div className="dr-hub-page__header">
          <PageHeader
            title="Donor Relationship"
            showBackButton={false}
            showAdd
            addPath="/dms/donor-relationship/add"
            addTitle="Add interaction"
          />
          {canViewTeam && (
            <button
              type="button"
              className="secondary_btn"
              onClick={() => navigate('/dms/donor-relationship/overview')}
            >
              Management overview
            </button>
          )}
        </div>

        <div className="dr-hub-toolbar">
          <div className="dr-main-tabs" role="tablist" aria-label="Donor relationship sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'follow-ups'}
              className={`dr-main-tab${activeTab === 'follow-ups' ? ' is-active' : ''}`}
              onClick={() => goTab('follow-ups')}
            >
              Follow Ups
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'interactions'}
              className={`dr-main-tab${activeTab === 'interactions' ? ' is-active' : ''}`}
              onClick={() => goTab('interactions')}
            >
              Interactions
            </button>
          </div>

          {canViewTeam && (
            <div className="dr-hub-scope">
              {scope === 'mine' ? (
                <button
                  type="button"
                  className="dr-scope-toggle"
                  onClick={() => setScope('team')}
                >
                  <FiUsers aria-hidden />
                  Team view
                </button>
              ) : (
                <button
                  type="button"
                  className="dr-scope-toggle dr-scope-toggle--active"
                  onClick={() => setScope('mine')}
                >
                  My view
                </button>
              )}
            </div>
          )}
        </div>

        {scope === 'team' && (
          <p className="dr-hub-scope-hint">
            Viewing <strong>{teamLabel}</strong> for the whole team
          </p>
        )}
        {scope === 'mine' && (
          <p className="dr-hub-scope-hint dr-hub-scope-hint--muted">
            Viewing <strong>{selfLabel}</strong>
          </p>
        )}

        <div className="ix-panel">
          {panelHeader}
          {children}
        </div>
      </div>
    </>
  );
};

export default DonorRelationshipHub;
