import React, { useMemo } from "react";
import BarChart from "../bar_chart";
import { useSummary } from "../../../../../context/SummaryContext";
import { IoIosMan } from "react-icons/io";

const BeneficiaryTypes = () => {
  const { achievementsProgramWise, targetsProgramWise, loading, error } = useSummary();

  const data = useMemo(() => {
    if (!achievementsProgramWise || !targetsProgramWise) return [];

    const items = [
      {
        label: "Education",
        targeted: targetsProgramWise?.education_reports_target,
        reached: achievementsProgramWise?.education_reports?.total_achieved,
      },
      {
        label: "Financial Assistance",
        targeted: targetsProgramWise?.financial_assistance_reports_target,
        reached: achievementsProgramWise?.financial_assistance_reports?.total_achieved,
      },
      {
        label: "Kasb Training",
        targeted: targetsProgramWise?.kasb_training_reports_target,
        reached: achievementsProgramWise?.kasb_training_reports?.total_achieved,
      },
      {
        label: "Marriage Gifts",
        targeted: targetsProgramWise?.marriage_gift_reports_target,
        reached: achievementsProgramWise?.marriage_gift_reports?.total_achieved,
      },
      {
        label: "Sewing Machine",
        targeted: targetsProgramWise?.sewing_machine_reports_target,
        reached: achievementsProgramWise?.sewing_machine_reports?.total_achieved,
      },
      {
        label: "Ration",
        targeted: targetsProgramWise?.ration_reports_target,
        reached: achievementsProgramWise?.ration_reports?.total_achieved,
      },
      {
        label: "Tree Plantation",
        targeted: targetsProgramWise?.tree_plantation_reports_target,
        reached: achievementsProgramWise?.tree_plantation_reports?.total_achieved,
      },
      {
        label: "Water",
        targeted: targetsProgramWise?.water_reports_target,
        reached: achievementsProgramWise?.water_reports?.total_achieved,
      },
      {
        label: "Wheel Chair / Crutches",
        targeted: targetsProgramWise?.wheel_chair_or_crutches_reports_target,
        reached: achievementsProgramWise?.wheel_chair_or_crutches_reports?.total_achieved,
      },
    ];

    return items.map((item) => {
      const targeted = Number(item.targeted) || 0;
      const reached = Number(item.reached) || 0;
      const percent = targeted > 0 ? Math.round((reached / targeted) * 100) : 0;

      return {
        label: item.label,
        targeted,
        reached,
        percent: `${percent}%`,
        icon: <IoIosMan size={20} />,
      };
    });
  }, [achievementsProgramWise, targetsProgramWise]);

  if (loading || error || !targetsProgramWise || !achievementsProgramWise) {
    return <div style={{ padding: 12 }}>{loading ? "Loading..." : error || "No data"}</div>;
  }

  return (
    <BarChart
      title="PEOPLE TARGETED AND REACHED BY PROGRAM"
      data={data}
    />
  );
};

export default BeneficiaryTypes;
