import React from "react";
import BarChart from "../bar_chart";

const data = [
  { label: "International NGO", targeted: "", reached: "", percent: "" },
  { label: "National NGO", targeted: "", reached: "", percent: "" },
  { label: "UN Agency", targeted: "", reached: "", percent: "" },
  { label: "Others", targeted: "", reached: "", percent: "" },
];

const Organizations = () => (
  <BarChart title="PEOPLE TARGETED AND REACHED BY ORGANIZATION" data={data} />
);

export default Organizations;
