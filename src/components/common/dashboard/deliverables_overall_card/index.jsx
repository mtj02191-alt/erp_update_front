import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FiBook, FiChevronLeft, FiChevronRight, FiDroplet, FiHeart, FiLayers, FiShoppingBag, FiTool, FiUsers } from 'react-icons/fi';
import { HiCalendarDateRange } from 'react-icons/hi2';

import '../../../../styles/variables.css';
import './DeliverablesOverallCard.css';
import axiosInstance from '../../../../utils/axios';
import { fetchDeliverablesOverall } from '../../../../utils/deliverablesOverallApi';
import Modal from '../../Modal';

function formatCount(n) {
  return typeof n === 'number' ? n.toLocaleString() : n;
}

function rangeCaption(from, to) {
  if (from && to) return `${from} → ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return 'All dates';
}

const CARD_ACCENT = {
  overall: { soft: '#e2e8f0', solid: '#1e293b' },
  food_security: { soft: '#dcfce7', solid: '#15803d' },
  community_services: { soft: '#ede9fe', solid: '#7c3aed' },
  widows_and_orphans_care_program: { soft: '#ffedd5', solid: '#ea580c' },
  education: { soft: '#dbeafe', solid: '#2563eb' },
  water_clean_water: { soft: '#cffafe', solid: '#0891b2' },
  kasb: { soft: '#e0e7ff', solid: '#4f46e5' },
  kasb_training: { soft: '#e0e7ff', solid: '#4338ca' },
  livelihood_support_program: { soft: '#ccfbf1', solid: '#0d9488' },
  green_initiative: { soft: '#dcfce7', solid: '#15803d' },
  disaster_management: { soft: '#ffe4e6', solid: '#be123c' },
  area_ration: { soft: '#fef3c7', solid: '#b45309' },
};

function accentForKey(key) {
  return CARD_ACCENT[key] || { soft: '#e2e8f0', solid: '#475569' };
}

const ICON_KEY_BY_PROGRAM = {
  overall: 'layers',
  total_beneficiaries: 'users',
  in_direct_beneficiaries: 'users',
  food_security: 'bag',
  community_services: 'users',
  widows_and_orphans_care_program: 'heart',
  education: 'book',
  water_clean_water: 'droplet',
  kasb: 'tool',
  kasb_training: 'tool',
  livelihood_support_program: 'tool',
  green_initiative: 'bag',
  disaster_management: 'heart',
  area_ration: 'shopping',
};

const ICON_MAP = {
  bag: FiShoppingBag,
  users: FiUsers,
  heart: FiHeart,
  book: FiBook,
  droplet: FiDroplet,
  tool: FiTool,
  shopping: FiShoppingBag,
  layers: FiLayers,
};

function lookupCount(lines, key) {
  const arr = Array.isArray(lines) ? lines : [];
  const hit = arr.find((x) => x && x.key === key);
  if (!hit) return 0;
  if (typeof hit.total === 'number') return hit.total;
  return Number(hit.count) || 0;
}

function cardToModalSections(card) {
  const breakdownLines = Array.isArray(card.breakdown) ? card.breakdown : [];
  const breakdownDetails = {};
  for (const line of breakdownLines) {
    breakdownDetails[line.label] = formatCount(Number(line.value) || 0);
  }

  const summary = {
    Delivered: formatCount(Number(card.totalDelivered) || 0),
    'Vulnerabilities (sum)': formatCount(Number(card.totalVulnerabilities) || 0),
    Period: rangeCaption(card.from, card.to),
  };

  const sections = [
    {
      title: 'Summary',
      details: summary,
    },
  ];

  if (
    (card.key === 'overall' || card.key === 'total_beneficiaries' || card.key === 'in_direct_beneficiaries') &&
    Array.isArray(card.programsDeliveredByLabel) &&
    card.programsDeliveredByLabel.length > 0
  ) {
    const byProgram = {};
    for (const row of card.programsDeliveredByLabel) {
      const name = row.label || row.key || 'Program';
      byProgram[name] = formatCount(Number(row.totalDelivered) || 0);
    }
    sections.push({
      title: 'Delivered by program',
      details: byProgram,
    });
  }

  if (card.key !== 'total_beneficiaries' && card.key !== 'in_direct_beneficiaries') {
    sections.push({
      title: 'Vulnerability breakdown',
      details: breakdownDetails,
    });
  }

  return sections;
}

function DeliverablesCarouselCardItem({ card }) {
  const { soft, solid } = accentForKey(card.key);
  const iconKey = ICON_KEY_BY_PROGRAM[card.key] || 'tool';
  const Icon = ICON_MAP[iconKey] || FiTool;
  const title = card?.label

  return (
    <div className="deliverables-overall-carousel__card-item">
      <div className="deliverables-overall-carousel__card-top">
        <span className="deliverables-overall-carousel__icon-wrap" style={{ background: soft, color: solid }}>
          <Icon aria-hidden />
        </span>
        <p
          className="deliverables-overall-carousel__total"
          aria-label={`Delivered ${formatCount(Number(card.totalDelivered) || 0)}`}
        >
          {formatCount(Number(card.totalDelivered) || 0)}
        </p>
      </div>

      <div className="deliverables-overall-carousel__title-row">
        <h3 className="deliverables-overall-carousel__name" title={card.label}>
          {title}
        </h3>
      </div>

      <div className="deliverables-overall-carousel__footer">
        <div className="deliverables-overall-carousel__footer-row">
          <div className="deliverables-overall-carousel__stat">
            <span className="deliverables-overall-carousel__stat-label">Widows</span>
            <span className="deliverables-overall-carousel__stat-value">
              {formatCount(lookupCount(card.vulnerabilityLines, 'widows'))}
            </span>
          </div>
          <div className="deliverables-overall-carousel__stat">
            <span className="deliverables-overall-carousel__stat-label">Orphans</span>
            <span className="deliverables-overall-carousel__stat-value">
              {formatCount(lookupCount(card.vulnerabilityLines, 'orphans'))}
            </span>
          </div>
        </div>
        <div className="deliverables-overall-carousel__footer-row">
          <div className="deliverables-overall-carousel__stat">
            <span className="deliverables-overall-carousel__stat-label">Divorced</span>
            <span className="deliverables-overall-carousel__stat-value">
              {formatCount(lookupCount(card.vulnerabilityLines, 'divorced'))}
            </span>
          </div>
          <div className="deliverables-overall-carousel__stat">
            <span className="deliverables-overall-carousel__stat-label">Disable</span>
            <span className="deliverables-overall-carousel__stat-value">
              {formatCount(lookupCount(card.vulnerabilityLines, 'disable'))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeliverablesOverallCard({
  from: fromProp,
  to: toProp,
  title = 'Deliverables by program (overall)',
  subtitle,
  className = '',
}) {
  const headingId = useId();
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const [draftFrom, setDraftFrom] = useState(fromProp ?? '');
  const [draftTo, setDraftTo] = useState(toProp ?? '');
  const [appliedFrom, setAppliedFrom] = useState(fromProp ?? '');
  const [appliedTo, setAppliedTo] = useState(toProp ?? '');
  const [filtersMobileOpen, setFiltersMobileOpen] = useState(false);

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [modalCard, setModalCard] = useState(null);

  useEffect(() => {
    setDraftFrom(fromProp ?? '');
    setDraftTo(toProp ?? '');
    setAppliedFrom(fromProp ?? '');
    setAppliedTo(toProp ?? '');
    setFiltersMobileOpen(false);
  }, [fromProp, toProp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await fetchDeliverablesOverall({
          from: appliedFrom || undefined,
          to: appliedTo || undefined,
          client: axiosInstance,
        });
        if (!cancelled) setPayload(data || null);
      } catch (err) {
        if (!cancelled) {
          setFetchError(err?.message || 'Failed to load deliverables');
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appliedFrom, appliedTo]);

  useEffect(() => {
    if (!payload) setModalCard(null);
  }, [payload]);

  const programCards = Array.isArray(payload?.programVulnerabilityCards) ? payload.programVulnerabilityCards : [];
  const vulnerabilities = Array.isArray(payload?.vulnerabilities) ? payload.vulnerabilities : [];

  const overallDelivered =
    typeof payload?.totalDeliveredAllPrograms === 'number'
      ? payload.totalDeliveredAllPrograms
      : (Array.isArray(payload?.programsList) ? payload.programsList : []).reduce(
          (s, r) => s + (Number(r?.totalDelivered) || 0),
          0,
        );

  const overallVulnerabilities =
    typeof payload?.totalVulnerabilitiesAll === 'number'
      ? payload.totalVulnerabilitiesAll
      : vulnerabilities.reduce((s, r) => s + (Number(r?.total) || 0), 0);

  const overallCard = useMemo(() => {
    const from = payload?.from ?? appliedFrom;
    const to = payload?.to ?? appliedTo;
    const programsDeliveredByLabel = Array.isArray(payload?.programsList)
      ? payload.programsList.map((p) => ({
          key: p.key,
          label: p.label,
          totalDelivered: Number(p.totalDelivered) || 0,
        }))
      : [];
    return {
      id: 'overall',
      key: 'overall',
      label: 'Direct Benificiaries',
      from,
      to,
      totalDelivered: overallDelivered,
      totalVulnerabilities: overallVulnerabilities,
      vulnerabilityLines: vulnerabilities, // uses `.total`
      breakdown: vulnerabilities.map((v) => ({ label: v.label, value: Number(v.total) || 0 })),
      programsDeliveredByLabel,
    };
  }, [payload, appliedFrom, appliedTo, overallDelivered, overallVulnerabilities, vulnerabilities]);

  const totalBeneficiariesCard = useMemo(() => {
    const from = payload?.from ?? appliedFrom;
    const to = payload?.to ?? appliedTo;
    const programsDeliveredByLabel = Array.isArray(payload?.programsList)
      ? payload.programsList.map((p) => ({
          key: p.key,
          label: p.label,
          totalDelivered: (Number(p.totalDelivered) || 0) * 7,
        }))
      : [];
    return {
      id: 'total_beneficiaries',
      key: 'total_beneficiaries',
      label: 'Total Benificiaries',
      from,
      to,
      totalDelivered: (Number(overallDelivered) || 0) * 7,
      totalVulnerabilities: 0,
      vulnerabilityLines: [],
      breakdown: [],
      programsDeliveredByLabel,
    };
  }, [payload, appliedFrom, appliedTo, overallDelivered, overallVulnerabilities, vulnerabilities]);

  const inDirectBeneficiariesCard = useMemo(() => {
    const from = payload?.from ?? appliedFrom;
    const to = payload?.to ?? appliedTo;
    const programsDeliveredByLabel = Array.isArray(payload?.programsList)
      ? payload.programsList.map((p) => ({
          key: p.key,
          label: p.label,
          totalDelivered: (Number(p.totalDelivered) || 0) * 6,
        }))
      : [];
    return {
      id: 'in_direct_beneficiaries',
      key: 'in_direct_beneficiaries',
      label: 'In Direct Benificiaries',
      from,
      to,
      totalDelivered: (Number(overallDelivered) || 0) * 6,
      totalVulnerabilities: 0,
      vulnerabilityLines: [],
      breakdown: [],
      programsDeliveredByLabel,
    };
  }, [payload, appliedFrom, appliedTo, overallDelivered]);

  const cards = useMemo(() => {
    const from = payload?.from ?? appliedFrom;
    const to = payload?.to ?? appliedTo;
    const mapped = programCards.map((c) => ({
      id: c.key,
      key: c.key,
      label: c.label,
      from,
      to,
      totalDelivered: Number(c.totalDelivered) || 0,
      totalVulnerabilities: Number(c.vulnerabilitiesTotal) || 0,
      vulnerabilityLines: Array.isArray(c.lines) ? c.lines : [], // uses `.count`
      breakdown: (Array.isArray(c.lines) ? c.lines : []).map((l) => ({ label: l.label, value: Number(l.count) || 0 })),
    }));
    return [totalBeneficiariesCard, overallCard, inDirectBeneficiariesCard, ...mapped];
  }, [payload, appliedFrom, appliedTo, programCards, overallCard, totalBeneficiariesCard, inDirectBeneficiariesCard]);

  const defaultSubtitle =
    subtitle ??
    (loading && cards.length <= 1
      ? 'Loading…'
      : `Period: ${rangeCaption(payload?.from ?? appliedFrom, payload?.to ?? appliedTo)}`);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [cards, updateScrollState]);

  const scrollByDir = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const firstWrap = el.querySelector('.deliverables-overall-carousel__card-wrap');
    const gap = parseFloat(getComputedStyle(el).gap) || 16;
    const step = firstWrap ? firstWrap.offsetWidth + gap : el.clientWidth * 0.85;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section className={`deliverables-overall-carousel ${className}`.trim()} aria-labelledby={headingId}>
      <header className="deliverables-overall-carousel__header">
        <div className="deliverables-overall-carousel__titles">
          <h2 id={headingId} className="deliverables-overall-carousel__title">
            {title}
          </h2>
          <p className="deliverables-overall-carousel__subtitle">{defaultSubtitle}</p>
          {fetchError && (
            <p className="deliverables-overall-carousel__fetch-warning" role="status">
              {fetchError}
            </p>
          )}
        </div>

        <div className="deliverables-overall-carousel__controls">
          <div className="deliverables-overall-carousel__filters deliverables-overall-carousel__filters--desktop">
            <div className="deliverables-overall-carousel__field">
              <label htmlFor={`${headingId}-from`}>From</label>
              <input id={`${headingId}-from`} type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
            </div>
            <div className="deliverables-overall-carousel__field">
              <label htmlFor={`${headingId}-to`}>To</label>
              <input id={`${headingId}-to`} type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
            </div>
            <button
              type="button"
              className="deliverables-overall-carousel__apply"
              disabled={loading}
              onClick={() => {
                setAppliedFrom(draftFrom);
                setAppliedTo(draftTo);
              }}
            >
              Apply range
            </button>
          </div>

          <button
            type="button"
            className="deliverables-overall-carousel__filters-toggle"
            aria-label="Open date range filters"
            aria-expanded={filtersMobileOpen}
            onClick={() => setFiltersMobileOpen((v) => !v)}
            disabled={loading}
          >
            <HiCalendarDateRange size={20} aria-hidden />
          </button>

          <div
            className={`deliverables-overall-carousel__filters-panel${
              filtersMobileOpen ? ' deliverables-overall-carousel__filters-panel--open' : ''
            }`}
            aria-label="Date range filter panel"
          >
            <div className="deliverables-overall-carousel__filters deliverables-overall-carousel__filters--mobile">
              <div className="deliverables-overall-carousel__field">
                <label htmlFor={`${headingId}-from-mobile`}>From</label>
                <input
                  id={`${headingId}-from-mobile`}
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
              </div>
              <div className="deliverables-overall-carousel__field">
                <label htmlFor={`${headingId}-to-mobile`}>To</label>
                <input
                  id={`${headingId}-to-mobile`}
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="deliverables-overall-carousel__apply"
                disabled={loading}
                onClick={() => {
                  setAppliedFrom(draftFrom);
                  setAppliedTo(draftTo);
                  setFiltersMobileOpen(false);
                }}
              >
                Apply range
              </button>
            </div>
          </div>

          <div className="deliverables-overall-carousel__nav">
            <button
              type="button"
              className="deliverables-overall-carousel__nav-btn"
              onClick={() => scrollByDir(-1)}
              disabled={!canPrev}
              aria-label="Show previous cards"
            >
              <FiChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="deliverables-overall-carousel__nav-btn"
              onClick={() => scrollByDir(1)}
              disabled={!canNext}
              aria-label="Show next cards"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="deliverables-overall-carousel__viewport">
        {loading && (!payload || cards.length === 0) ? (
          <p className="deliverables-overall-carousel__loading">Loading deliverables…</p>
        ) : (
          <div ref={trackRef} className="deliverables-overall-carousel__track" role="list">
            {cards.map((card) => (
              <div key={card.id} className="deliverables-overall-carousel__card-wrap" role="listitem">
                <button
                  type="button"
                  className="deliverables-overall-carousel__card deliverables-overall-carousel__card--trigger"
                  onClick={() => setModalCard(card)}
                  aria-label={`Open details for ${card.label}`}
                >
                  <DeliverablesCarouselCardItem card={card} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalCard != null}
        onClose={() => setModalCard(null)}
        title={modalCard?.label}
        sections={modalCard ? cardToModalSections(modalCard) : null}
      />
    </section>
  );
}
