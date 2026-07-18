import React, { createContext, useContext, useMemo, useState } from 'react';

function monthStartEndYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const toYmd = (x) => x.toISOString().slice(0, 10);
  return { from: toYmd(start), to: toYmd(end) };
}

const DashboardDateRangeContext = createContext(null);

export const DashboardDateRangeProvider = ({ children, initialRange }) => {
  const defaultRange = initialRange || monthStartEndYmd(new Date());
  const [globalRange, setGlobalRange] = useState(defaultRange);
  const [rangeByKey, setRangeByKey] = useState({});

  const value = useMemo(() => {
    const getRange = (key) => rangeByKey[key] || globalRange;

    const setRange = (key, range) => {
      setRangeByKey((prev) => ({ ...prev, [key]: range }));
    };

    const applyToAll = (range) => {
      setGlobalRange(range);
      setRangeByKey({});
    };

    return {
      globalRange,
      rangeByKey,
      getRange,
      setRange,
      applyToAll,
    };
  }, [globalRange, rangeByKey]);

  return <DashboardDateRangeContext.Provider value={value}>{children}</DashboardDateRangeContext.Provider>;
};

export const useDashboardDateRange = () => {
  const ctx = useContext(DashboardDateRangeContext);
  if (!ctx) {
    throw new Error('useDashboardDateRange must be used within DashboardDateRangeProvider');
  }
  return ctx;
};

