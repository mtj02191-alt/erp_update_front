import React, { useRef } from "react";
import { FaRupeeSign } from "react-icons/fa6";
import "./index.css"; // import CSS file
import { GiTakeMyMoney } from "react-icons/gi";
import { RiDownload2Fill } from "react-icons/ri";
import { toPng } from "html-to-image";

// We have to remove years and add all prorgrams here and update year class name and styling 

const AllocationsSummary = () => {
  const chartRef = useRef(null);

  const data = [
    { year: "", allocations: "", project: 'Food Security', partners: "" },
    { year: "", allocations: "", project: 'Community Services', partners: "" },
    { year: "", allocations: "", project: 'Education', partners: "" },
    { year: "", allocations: "", project: 'Water & Clean Water', partners: "" },
    { year: "", allocations: "", project: 'KASB', partners: "" },
    { year: "", allocations: "", project: 'Green Initiative', partners: "" },
    { year: "", allocations: "", project: 'Widows and Orphans Care Program', partners: "" },
    { year: "", allocations: "", project: 'Livelihood Support Program', partners: "" },
    { year: "", allocations: "", project: 'Disaster Management', partners: "" },
  ];

  const handleDownload = async () => {
    if (chartRef.current === null) return;

    try {
      const dataUrl = await toPng(chartRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff' // Add white background
      });
      const link = document.createElement("a");
      link.download = "allocations-summary.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    }
  };

  return (
    <div className="allocations-container" ref={chartRef}>
      <div style={{ position: "relative" }}>
        <div className="allocations-header">
          <div className="icon"><GiTakeMyMoney size={50} /></div>
          <div>
            <h2 className="total">M</h2>
            <p className="subtitle">Allocations</p>
          </div>
          <div className="icon"><FaRupeeSign  /></div>
        </div>
        <button
          onClick={handleDownload}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            color: "#666",
            fontSize: "20px",
            transition: "color 0.2s ease",
            zIndex: 10
          }}
          onMouseEnter={(e) => e.target.style.color = "#333"}
          onMouseLeave={(e) => e.target.style.color = "#666"}
          title="Download as PNG"
        >
          <RiDownload2Fill />
        </button>
      </div>

      <div className="allocations-list">
        {data.map((item, index) => (
          <div key={index} className="allocation-row">
            {/* <div className="year">{item.year}</div> */}
            <div className="col col_1">
              <span className="value">{item.project}</span>
              <span className="label">PROJECT</span>
            </div>
            <div className="col">
              <span className="value">{item.partners}</span>
              <span className="label">Benificiaries</span>
            </div>
            <div className="col">
              <span className="value">{item.allocations}</span>
              <span className="label">ALLOCATIONS</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationsSummary;
