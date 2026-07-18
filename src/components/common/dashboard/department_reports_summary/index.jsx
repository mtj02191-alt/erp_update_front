import React, { useEffect, useMemo, useState } from 'react';
import { FiBook, FiBox, FiDollarSign, FiShoppingCart, FiUsers, FiBookmark, FiHeart } from 'react-icons/fi';
import { SlCalender } from 'react-icons/sl';

import '../../../../styles/variables.css';
import './DepartmentReportsSummary.css';

import axiosInstance from '../../../../utils/axios';
import SummaryStatCard from '../summary_stat_card';
import DateRangePopup from '../date_range_popup';
import Modal from '../../Modal';
import {
  fetchAccountsAndFinanceDailyMonthSum,
  fetchAlHasanainClgMonthSum,
  fetchAasCollectionCentersReportMonthSum,
  fetchDreamSchoolReportsMonthSum,
  fetchHealthReportsMonthSum,
  fetchProcurementsDailyMonthSum,
  fetchStoreDailyMonthSum,
} from '../../../../utils/newDashboardMonthlySumsApi';
import { buildDepartmentSummaryModalSections } from '../../../../utils/departmentSummaryModalSections';
import { fetchHealthTypeTotals } from '../../../../utils/healthTypeTotalsApi';
import { useDashboardDateRange } from '../../../../context/DashboardDateRangeContext';

const DETAIL_MODAL_TITLES = {
  store: 'Store',
  procurements: 'Procurements',
  accounts_and_finance: 'Accounts & Finance',
  al_hasanain_clg: 'Al Hasanain CLG',
  aas_collection_centers_report: 'AAS Centers',
  dream_school_reports: 'Dream School',
  health_reports: 'Health',
};

function safeNum(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export default function DepartmentReportsSummary() {
  const { getRange, setRange, applyToAll } = useDashboardDateRange();
  const storeRange = getRange('store');
  const procRange = getRange('procurements');
  const accRange = getRange('accounts_and_finance');
  const ahcRange = getRange('al_hasanain_clg');
  const aasRange = getRange('aas_collection_centers_report');
  const dsrRange = getRange('dream_school_reports');
  const healthRange = getRange('health_reports');

  const [storeLoading, setStoreLoading] = useState(true);
  const [procLoading, setProcLoading] = useState(true);
  const [accLoading, setAccLoading] = useState(true);
  const [ahcLoading, setAhcLoading] = useState(true);
  const [aasLoading, setAasLoading] = useState(true);
  const [dsrLoading, setDsrLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthTypeTotalsLoading, setHealthTypeTotalsLoading] = useState(true);

  const [store, setStore] = useState(null);
  const [proc, setProc] = useState(null);
  const [acc, setAcc] = useState(null);
  const [ahc, setAhc] = useState(null);
  const [aas, setAas] = useState(null);
  const [dsr, setDsr] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthTypeTotals, setHealthTypeTotals] = useState(null);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTarget, setPopupTarget] = useState('store'); // store | procurements | accounts_and_finance | al_hasanain_clg | aas_collection_centers_report | dream_school_reports | health_reports
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [applyAllChecked, setApplyAllChecked] = useState(false);

  const [detailModalKey, setDetailModalKey] = useState(null);

  const openPopupFor = (key) => {
    const r = getRange(key);
    setPopupTarget(key);
    setDraftFrom(r?.from || '');
    setDraftTo(r?.to || '');
    setApplyAllChecked(false);
    setPopupOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStoreLoading(true);
        const data = await fetchStoreDailyMonthSum({
          from: storeRange?.from,
          to: storeRange?.to,
          client: axiosInstance,
        });
        if (!cancelled) setStore(data || null);
      } finally {
        if (!cancelled) setStoreLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeRange?.from, storeRange?.to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setProcLoading(true);
        const data = await fetchProcurementsDailyMonthSum({
          from: procRange?.from,
          to: procRange?.to,
          client: axiosInstance,
        });
        if (!cancelled) setProc(data || null);
      } finally {
        if (!cancelled) setProcLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [procRange?.from, procRange?.to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setAccLoading(true);
        const data = await fetchAccountsAndFinanceDailyMonthSum({
          from: accRange?.from,
          to: accRange?.to,
          client: axiosInstance,
        });
        if (!cancelled) setAcc(data || null);
      } finally {
        if (!cancelled) setAccLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accRange?.from, accRange?.to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setAhcLoading(true);
        const data = await fetchAlHasanainClgMonthSum({
          from: ahcRange?.from,
          to: ahcRange?.to,
          client: axiosInstance,
        });
        if (!cancelled) setAhc(data || null);
      } finally {
        if (!cancelled) setAhcLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ahcRange?.from, ahcRange?.to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setAasLoading(true);
        const data = await fetchAasCollectionCentersReportMonthSum({
          from: aasRange?.from,
          to: aasRange?.to,
          client: axiosInstance,
        });
        if (!cancelled) setAas(data || null);
      } finally {
        if (!cancelled) setAasLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [aasRange?.from, aasRange?.to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDsrLoading(true);
        const data = await fetchDreamSchoolReportsMonthSum({
          from: dsrRange?.from,
          to: dsrRange?.to,
          client: axiosInstance,
        });
        if (!cancelled) setDsr(data || null);
      } finally {
        if (!cancelled) setDsrLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dsrRange?.from, dsrRange?.to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setHealthLoading(true);
        const data = await fetchHealthReportsMonthSum({
          from: healthRange?.from,
          to: healthRange?.to,
          client: axiosInstance,
        });
        if (!cancelled) setHealth(data || null);
      } finally {
        if (!cancelled) setHealthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [healthRange?.from, healthRange?.to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setHealthTypeTotalsLoading(true);
        const data = await fetchHealthTypeTotals({
          from: healthRange?.from,
          to: healthRange?.to,
          client: axiosInstance,
        });
        if (!cancelled) setHealthTypeTotals(data || null);
      } finally {
        if (!cancelled) setHealthTypeTotalsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [healthRange?.from, healthRange?.to]);

  const detailModalSections = useMemo(() => {
    if (!detailModalKey) return [];
    const ctx = {
      store: { data: store, loading: storeLoading, range: storeRange },
      procurements: { data: proc, loading: procLoading, range: procRange },
      accounts_and_finance: { data: acc, loading: accLoading, range: accRange },
      al_hasanain_clg: { data: ahc, loading: ahcLoading, range: ahcRange },
      aas_collection_centers_report: { data: aas, loading: aasLoading, range: aasRange },
      dream_school_reports: { data: dsr, loading: dsrLoading, range: dsrRange },
      health_reports: { data: health, loading: healthLoading, range: healthRange },
    }[detailModalKey];
    return buildDepartmentSummaryModalSections(detailModalKey, ctx);
  }, [
    detailModalKey,
    store,
    storeLoading,
    storeRange,
    proc,
    procLoading,
    procRange,
    acc,
    accLoading,
    accRange,
    ahc,
    ahcLoading,
    ahcRange,
    aas,
    aasLoading,
    aasRange,
    dsr,
    dsrLoading,
    dsrRange,
    health,
    healthLoading,
    healthRange,
  ]);

  const storeCard = useMemo(() => {
    const big = store ? safeNum(store.generated_demands) : 0;
    return {
      icon: FiBox,
      accent: { bg: '#dcfce7', fg: '#15803d' },
      title: 'Store',
      bigValue: storeLoading ? '—' : big,
      miniStats: [
        { label: 'Pending', value: storeLoading ? '—' : safeNum(store?.pending_demands) },
        { label: 'Rejected', value: storeLoading ? '—' : safeNum(store?.rejected_demands) },
        { label: 'GRN Gen.', value: storeLoading ? '—' : safeNum(store?.generated_grn) },
        { label: 'GRN Pend.', value: storeLoading ? '—' : safeNum(store?.pending_grn) },
      ],
      actions: (
        <button
          type="button"
          className="summary-stat-card__action"
          aria-label="Filter Store by date range"
          onClick={() => openPopupFor('store')}
        >
          <SlCalender />
        </button>
      ),
      detailOnClick: () => setDetailModalKey('store'),
    };
  }, [store, storeLoading]);

  const procurementsCard = useMemo(() => {
    const big = proc ? safeNum(proc.total_generated_pos) : 0;
    return {
      icon: FiShoppingCart,
      accent: { bg: '#ede9fe', fg: '#7c3aed' },
      title: 'Procurements',
      bigValue: procLoading ? '—' : big,
      miniStats: [
        { label: 'PO Pending', value: procLoading ? '—' : safeNum(proc?.pending_pos) },
        { label: 'PO Fulfilled', value: procLoading ? '—' : safeNum(proc?.fulfilled_pos) },
        { label: 'PI Gen.', value: procLoading ? '—' : safeNum(proc?.total_generated_pis) },
        { label: 'PI Unpaid', value: procLoading ? '—' : safeNum(proc?.unpaid_pis) },
      ],
      actions: (
        <button
          type="button"
          className="summary-stat-card__action"
          aria-label="Filter Procurements by date range"
          onClick={() => openPopupFor('procurements')}
        >
          <SlCalender />
        </button>
      ),
      detailOnClick: () => setDetailModalKey('procurements'),
    };
  }, [proc, procLoading]);

  const accountsCard = useMemo(() => {
    const big = acc ? safeNum(acc.available_funds) : 0;
    const money = (v) => (accLoading ? '—' : safeNum(v).toLocaleString(undefined, { maximumFractionDigits: 2 }));
    return {
      icon: FiDollarSign,
      accent: { bg: '#dbeafe', fg: '#2563eb' },
      title: 'Accounts & Finance',
      bigValue: money(big),
      miniStats: [
        { label: 'Inflow', value: money(acc?.daily_inflow) },
        { label: 'Outflow', value: money(acc?.daily_outflow) },
        { label: 'Pending', value: money(acc?.pending_payable) },
        { label: 'Petty Cash', value: money(acc?.petty_cash) },
      ],
      actions: (
        <button
          type="button"
          className="summary-stat-card__action"
          aria-label="Filter Accounts and Finance by date range"
          onClick={() => openPopupFor('accounts_and_finance')}
        >
          <SlCalender />
        </button>
      ),
      detailOnClick: () => setDetailModalKey('accounts_and_finance'),
    };
  }, [acc, accLoading]);

  const alHasanainCard = useMemo(() => {
    const big = ahc ? safeNum(ahc.total_students_sum) : 0;
    const pct = (v) => (ahcLoading ? '—' : `${safeNum(v).toFixed(1)}%`);
    const money = (v) => (ahcLoading ? '—' : safeNum(v).toLocaleString(undefined, { maximumFractionDigits: 2 }));
    return {
      icon: FiBook,
      accent: { bg: '#fef3c7', fg: '#b45309' },
      title: 'Al Hasanain CLG',
      bigValue: ahcLoading ? '—' : big,
      miniStats: [
        { label: 'Teachers', value: ahcLoading ? '—' : safeNum(ahc?.active_teachers_sum) },
        { label: 'Fee', value: money(ahc?.fee_collection_sum) },
        { label: 'Attend.', value: pct(ahc?.attendance_percent_avg) },
        { label: 'Pass', value: pct(ahc?.pass_rate_avg) },
      ],
      actions: (
        <button
          type="button"
          className="summary-stat-card__action"
          aria-label="Filter Al Hasanain CLG by date range"
          onClick={() => openPopupFor('al_hasanain_clg')}
        >
          <SlCalender />
        </button>
      ),
      detailOnClick: () => setDetailModalKey('al_hasanain_clg'),
    };
  }, [ahc, ahcLoading]);

  const aasCard = useMemo(() => {
    const big = aas ? safeNum(aas.total_patients_sum) : 0;
    const pct = (v) => (aasLoading ? '—' : `${safeNum(v).toFixed(1)}%`);
    const money = (v) => (aasLoading ? '—' : safeNum(v).toLocaleString(undefined, { maximumFractionDigits: 2 }));
    return {
      icon: FiUsers,
      accent: { bg: '#cffafe', fg: '#0891b2' },
      title: 'AAS Centers',
      bigValue: aasLoading ? '—' : big,
      miniStats: [
        { label: 'Tests', value: aasLoading ? '—' : safeNum(aas?.tests_conducted_sum) },
        { label: 'Pending', value: aasLoading ? '—' : safeNum(aas?.pending_tests_sum) },
        { label: 'Revenue', value: money(aas?.revenue_sum) },
        { label: 'On-time', value: pct(aas?.on_time_delivery_percent_avg) },
      ],
      actions: (
        <button
          type="button"
          className="summary-stat-card__action"
          aria-label="Filter AAS collection centers by date range"
          onClick={() => openPopupFor('aas_collection_centers_report')}
        >
          <SlCalender />
        </button>
      ),
      detailOnClick: () => setDetailModalKey('aas_collection_centers_report'),
    };
  }, [aas, aasLoading]);

  const dreamSchoolReportsCard = useMemo(() => {
    const big = dsr ? safeNum(dsr.visits_sum) : 0;
    return {
      icon: FiBookmark,
      accent: { bg: '#ffedd5', fg: '#ea580c' },
      title: 'Dream School',
      bigValue: dsrLoading ? '—' : big,
      miniStats: [
        { label: 'Records', value: dsrLoading ? '—' : safeNum(dsr?.records) },
        { label: 'Excellent', value: dsrLoading ? '—' : safeNum(dsr?.excellent_count) },
        { label: 'Good', value: dsrLoading ? '—' : safeNum(dsr?.good_count) },
        { label: 'Poor', value: dsrLoading ? '—' : safeNum(dsr?.poor_count) },
      ],
      actions: (
        <button
          type="button"
          className="summary-stat-card__action"
          aria-label="Filter Dream School reports by date range"
          onClick={() => openPopupFor('dream_school_reports')}
        >
          <SlCalender />
        </button>
      ),
      detailOnClick: () => setDetailModalKey('dream_school_reports'),
    };
  }, [dsr, dsrLoading]);

  const healthReportsCard = useMemo(() => {
    const big = health ? safeNum(health.total_sum) : 0;
    const types = Array.isArray(healthTypeTotals?.types) ? healthTypeTotals.types : [];
    const typeStats = types.map((t) => ({
      label: t.type,
      value: safeNum(t.total),
    }));
    return {
      icon: FiHeart,
      accent: { bg: '#ffe4e6', fg: '#be123c' },
      title: 'Health',
      bigValue: healthLoading ? '—' : big,
      miniStats: healthTypeTotalsLoading
        ? [
            { label: 'In-house', value: '—' },
            { label: 'Referred', value: '—' },
            { label: 'Surgeries Supported', value: '—' },
            { label: 'Ambulance', value: '—' },
          ]
        : typeStats,
      actions: (
        <button
          type="button"
          className="summary-stat-card__action"
          aria-label="Filter Health by date range"
          onClick={() => openPopupFor('health_reports')}
        >
          <SlCalender />
        </button>
      ),
      detailOnClick: () => setDetailModalKey('health_reports'),
    };
  }, [health, healthLoading, healthTypeTotals, healthTypeTotalsLoading]);

  return (
    <>
      <div className="department-reports-summary">
        <SummaryStatCard {...storeCard} />
        <SummaryStatCard {...procurementsCard} />
        <SummaryStatCard {...accountsCard} />
        <SummaryStatCard {...healthReportsCard} />
        <SummaryStatCard {...alHasanainCard} />
        <SummaryStatCard {...aasCard} />
        <SummaryStatCard {...dreamSchoolReportsCard} />
      </div>

      <DateRangePopup
        open={popupOpen}
        title={
          popupTarget === 'store'
            ? 'Store date range'
            : popupTarget === 'procurements'
              ? 'Procurements date range'
              : popupTarget === 'accounts_and_finance'
                ? 'Accounts & Finance date range'
                : popupTarget === 'al_hasanain_clg'
                  ? 'Al Hasanain CLG date range'
                  : popupTarget === 'aas_collection_centers_report'
                    ? 'AAS collection centers date range'
                    : popupTarget === 'health_reports'
                      ? 'Health reports date range'
                      : 'Dream School reports date range'
        }
        from={draftFrom}
        to={draftTo}
        onChangeFrom={setDraftFrom}
        onChangeTo={setDraftTo}
        applyToAll={applyAllChecked}
        onToggleApplyToAll={setApplyAllChecked}
        onClose={() => setPopupOpen(false)}
        onApply={() => {
          const range = { from: draftFrom || undefined, to: draftTo || undefined };
          if (applyAllChecked) applyToAll(range);
          else setRange(popupTarget, range);
          setPopupOpen(false);
        }}
        disabled={storeLoading || procLoading || accLoading || ahcLoading || aasLoading || dsrLoading || healthLoading}
      />

      <Modal
        open={detailModalKey != null}
        onClose={() => setDetailModalKey(null)}
        title={detailModalKey ? `${DETAIL_MODAL_TITLES[detailModalKey]} — overview` : ''}
        sections={detailModalSections}
      />
    </>
  );
}

