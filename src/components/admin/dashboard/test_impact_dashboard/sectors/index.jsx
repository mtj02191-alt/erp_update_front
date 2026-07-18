import React from "react";
import BarChart from "../bar_chart";
import { IoIosMan } from "react-icons/io";
import { useSummary } from "../../../../../context/SummaryContext";

// Fontend will only have label and logo and key 
// Data will be formatted from backend mostly and pass the same format to BarChart component below is the format 
// [  { label: "Food Security", targeted: 11700000, reached: 12700000, percent: "108%", icon: <IoIosMan size={20}/> }]
const Sectors = () => {
  const { achievementsCategoryWise, targetsCategoryWise, loading, error } = useSummary();

  if (loading || !achievementsCategoryWise || !targetsCategoryWise) {
    return <div style={{ padding: 12 }}>Loading...</div>;
  }

  const categoryData = [
    {
      label: "Girls",
      targeted: targetsCategoryWise?.girls_target ?? 0,
      reached: achievementsCategoryWise?.total_girls_achieved ?? 0,
      percent: "",
      icon: <IoIosMan size={20} />,
    },
    {
      label: "Boys",
      targeted: targetsCategoryWise?.boys_target ?? 0,
      reached: achievementsCategoryWise?.total_boys_achieved ?? 0,
      percent: "",
      icon: <IoIosMan size={20} />,
    },
    {
      label: "Youth",
      targeted: targetsCategoryWise?.youth_target ?? 0,
      reached: achievementsCategoryWise?.total_young_achieved ?? 0,
      percent: "",
      icon: <IoIosMan size={20} />,
    },
    {
      label: "Widows",
      targeted: targetsCategoryWise?.widows_target ?? 0,
      reached: achievementsCategoryWise?.total_widows_achieved ?? 0,
      percent: "",
      icon: <IoIosMan size={20} />,
    },
    {
      label: "Divorced",
      targeted: targetsCategoryWise?.divorced_target ?? 0,
      reached: achievementsCategoryWise?.total_divorced_achieved ?? 0,
      percent: "",
      icon: <IoIosMan size={20} />,
    },
    {
      label: "Disabled",
      targeted: targetsCategoryWise?.disabled_target ?? 0,
      reached: achievementsCategoryWise?.total_disabled_achieved ?? 0,
      percent: "",
      icon: <IoIosMan size={20} />,
    },
    {
      label: "Indegent",
      targeted: targetsCategoryWise?.indegent_target ?? 0,
      reached: achievementsCategoryWise?.total_indegent_achieved ?? 0,
      percent: "",
      icon: <IoIosMan size={20} />,
    },
    {
      label: "Orphans",
      targeted: targetsCategoryWise?.orphans_target ?? 0,
      reached: achievementsCategoryWise?.total_orphans_achieved ?? 0,
      percent: "",
      icon: <IoIosMan size={20} />,
    },
  ];

  const computedData = categoryData.map((item) => {
    const targeted = Number(item.targeted) || 0;
    const reached = Number(item.reached) || 0;
    const percent = targeted > 0 ? Math.round((reached / targeted) * 100) : 0;
    return { ...item, targeted, reached, percent: `${percent}%` };
  });

  return (
    <BarChart
      title={error ? "PEOPLE TARGETED AND REACHED BY CATEGORY" : "PEOPLE TARGETED AND REACHED BY CATEGORY"}
      data={computedData}
    />
  );
};

export default Sectors;
