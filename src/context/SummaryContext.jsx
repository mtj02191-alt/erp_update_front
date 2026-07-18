import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../utils/axios';

const SummaryContext = createContext(null);

const normalizeSummaryPayload = (apiResponseData) => {
  // Typical Nest response: { success, data: summaryData, year, total_tables }
  // Some APIs in this repo may add another `data` nesting level, so we keep fallbacks.
  if (!apiResponseData) return null;
  if (apiResponseData?.data) return apiResponseData.data?.data ?? apiResponseData.data;
  return apiResponseData?.data ?? apiResponseData;
};

export const SummaryProvider = ({ children, initialYear }) => {
  const computedInitialYear = useMemo(
    () => (initialYear ? Number(initialYear) : new Date().getFullYear()),
    [initialYear]
  );

  const [year, setYear] = useState(computedInitialYear);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = async (yearToFetch = year) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axiosInstance.get('/summary', { params: { year: yearToFetch } });
      const summaryData = normalizeSummaryPayload(res?.data);

      setSummary(summaryData);
    } catch (e) {
      setError(e?.message || 'Failed to fetch summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const achievementsCategoryWise = summary?.achievements?.category_wise ?? null;
  const targetsCategoryWise = summary?.targets?.category_wise ?? null;
  const achievementsProgramWise = summary?.achievements?.program_wise ?? null;
  const targetsProgramWise = summary?.targets?.program_wise ?? null;

  const value = {
    year,
    setYear,
    summary,
    achievementsCategoryWise,
    targetsCategoryWise,
    achievementsProgramWise,
    targetsProgramWise,
    loading,
    error,
    refetch: () => fetchSummary(year),
  };

  return <SummaryContext.Provider value={value}>{children}</SummaryContext.Provider>;
};

export const useSummary = () => {
  const context = useContext(SummaryContext);
  if (!context) {
    throw new Error('useSummary must be used within a SummaryProvider');
  }
  return context;
};

