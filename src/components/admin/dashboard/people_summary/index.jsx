import React, { useRef } from "react";
import "./index.css";
import { TbTargetArrow } from "react-icons/tb";
import { IoIosMan } from "react-icons/io";
import { IoIosWoman } from "react-icons/io";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";
// import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";
import { IoIosCloudDone } from "react-icons/io";
import { RiDownload2Fill } from "react-icons/ri";
import { toPng } from "html-to-image";


const PeopleSummary = () => {
  const chartRef = useRef(null);

  const groups = [
    {
      label: "WOMEN",
      targeted: "",
      reached: "",
      percent: "",
    },
    {
      label: "MEN",
      targeted: "",
      reached: "",
      percent: "",
    },
    {
      label: "GIRLS",
      targeted: "",
      reached: "",
      percent: "",
    },
    {
      label: "BOYS",
      targeted: "",
      reached: "",
      percent: "",
    },
  ];

  // Each symbol = 698k (approx)
  const unit = 0.698;

  const renderIcons = (count, color, icon, size) => {
    const numIcons = Math.round(count / unit);
    return Array.from({ length: numIcons }, (_, i) => (
      <span key={i} className={`icon ${color}`}>
        {React.createElement(icon, { size })}
      </span>
    ));
  };

  const handleDownload = async () => {
    if (chartRef.current === null) return;

    try {
      const dataUrl = await toPng(chartRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff' // Add white background
      });
      const link = document.createElement("a");
      link.download = "people-summary.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    }
  };

  return (
    <div className="people-container" ref={chartRef}>
      <div style={{ position: "relative" }}>
        <div className="people-header">
          <div className="col">
            <h2 className="orange">{""}</h2>
            <div className="people-targeted">
              <p>People Targeted</p>
              <div className="orange"><TbTargetArrow size={20} /></div>
            </div>
          </div>
          <div className="col">
            <h2 className="blue"> <span className="small"></span></h2>
            <p>People Reached</p>
            <div className="blue"><IoIosCloudDone size={20} /></div>
          </div>
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

      <div className="people-list">
        {groups.map((g, i) => {
          let icon = IoIosMan;
          let size = 20;
          if (g.label === "WOMEN" || g.label === "GIRLS") {
            icon = IoIosWoman;
            if (g.label === "GIRLS") {
              size = 16;
            }
          } else if (g.label === "BOYS") {
            size = 16;
          }
          return (
            <div key={i} className="people-row">
              <div className="group">{g.label}</div>
              <div className="numbers">
                <div className="target">
                  <span className="value">{g.targeted}M</span>
                  {renderIcons(g.targeted, "orange", icon, size)}
                </div>
                <div className="reached">
                  <span className="value">{g.reached}M ✓</span>
                  {renderIcons(g.reached, "blue", icon, size)}
                </div>
              </div>
              <div className="percent">{g.percent}%</div>
            </div>
          );
        })}
      </div>

      {/* <p className="note">
        Each symbol (<IoIosMan size={16} />/ <IoIosWoman size={16} />) represents 698 thousand people
      </p> */}
    </div>
  );
};

export default PeopleSummary;
