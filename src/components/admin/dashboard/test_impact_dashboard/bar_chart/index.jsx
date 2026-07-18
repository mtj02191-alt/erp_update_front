// components/BarChart.js
import React, { useRef } from "react";
import { formatNumber } from "../utils";
import "../styles/common.css";
import { TbTargetArrow } from "react-icons/tb";
import { IoIosCloudDone } from "react-icons/io";
import { RiDownload2Fill } from "react-icons/ri";
import { toPng } from "html-to-image";

const BarChart = ({ title, data }) => {
  const chartRef = useRef(null);

  const maxValue = Math.max(...data.map((item) => Math.max(item.targeted, item.reached)));
  // Avoid divide-by-zero / NaN bar widths when all values are 0 (or data is empty).
  const safeMaxValue = maxValue > 0 ? maxValue : 1;

  const getBarWidth = (value) => (value / safeMaxValue) * 100;

  const isBarTooNarrow = (width) => {
    return width < 10;
  };

  const handleDownload = async () => {
    if (chartRef.current === null) return;

    try {
      const dataUrl = await toPng(chartRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff' // Add white background
      });
      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    }
  };

  return (
    <div className="section" ref={chartRef}>
      <div style={{ position: "relative" }}>
        <h2 className="section-title">{title}</h2>
        <button
          onClick={handleDownload}
          style={{
            position: "absolute",
            top: "0",
            right: "0",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            color: "#666",
            fontSize: "20px",
            transition: "color 0.2s ease"
          }}
          onMouseEnter={(e) => e.target.style.color = "#333"}
          onMouseLeave={(e) => e.target.style.color = "#666"}
          title="Download as PNG"
        >
          <RiDownload2Fill />
        </button>
      </div>
      <div className="legend">(        <span>Targeted <span className="orange"><TbTargetArrow size={20} /></span>, </span>
        <span>Reached <span className="blue"><IoIosCloudDone size={20} />)</span></span>
      </div>
      <p className="typography">
      Reached as % <br />
      of targeted
      </p>

      <div>
        {data.map((item, idx) => {
          const targetedWidth = getBarWidth(item.targeted);
          const reachedWidth = getBarWidth(item.reached);
          const showTextOutside = isBarTooNarrow(targetedWidth) || isBarTooNarrow(reachedWidth);

          return (
            <div className="chart-row" key={idx}>
              <div className="chart-label">{item.label} <span className="chart_label_icon">{item?.icon}</span></div>

              <div className="chart-bars">
                <div className={`bar-container ${showTextOutside ? 'bar-text-outside targeted' : ''}`} 
                     data-text={showTextOutside ? formatNumber(item.targeted) : ''}>
                  <div className="bar_graph_target_icon"><TbTargetArrow size={20} /></div>
                  <div className="bar targeted-bar" 
                       style={{ width: `${targetedWidth}%` }}
                       data-text={showTextOutside ? formatNumber(item.targeted) : ''}>
                    {!showTextOutside && formatNumber(item.targeted)}
                  </div>
                </div>
                
                <div className={`bar-container ${showTextOutside ? 'bar-text-outside reached' : ''}`}
                     data-text={showTextOutside ? formatNumber(item.reached) : ''}>
                  <div className="bar_graph_target_icon"><IoIosCloudDone size={20} /></div>
                  <div className="bar reached-bar" 
                       style={{ width: `${reachedWidth}%` }}
                       data-text={showTextOutside ? formatNumber(item.reached) : ''}>
                    {!showTextOutside && formatNumber(item.reached)}
                  </div>
                </div>
              </div>
              <div className="chart-percent">{item.percent}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
