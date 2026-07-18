import React, { useState, useEffect, useRef } from 'react';
// import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import './AdminDashboard.css';
import Navbar from '../../../Navbar';
import Card from '../../../common/Card';
import { Chart, registerables } from 'chart.js';
import AdminFilteration from '../../filters/AdminFilteration';
import Modal from '../../../common/Modal';
import { departments } from '../../../../utils/admin';
// import AllocationsSummary from '../test_impact_dashboard/impact_dashboard';
// import PeopleSummary from '../people_summary';
// import BeneficiaryTypes from '../test_impact_dashboard/benificiary_type';
// import OrganizationChart from '../test_impact_dashboard/organization';
// import SectorChart from '../test_impact_dashboard/sector';
import axiosInstance from '../../../../utils/axios';
import BeneficiaryTypes from '../test_impact_dashboard/benificiary_type';
import Organizations from '../test_impact_dashboard/organizations';
// import Sectors from '../test_impact_dashboard/sectors';
import Sectors from '../test_impact_dashboard/sectors';
import AllocationsSummary from '../impact_dashboard';
import PeopleSummary from '../people_summary';
import LineChart from '../../../common/charts/line_chart';
import ProgramApplicationCard from '../../../common/dashboard/program_application_card';
import DeliverablesOverallCard from '../../../common/dashboard/deliverables_overall_card';
import DepartmentReportsSummary from '../../../common/dashboard/department_reports_summary';
import { DashboardDateRangeProvider } from '../../../../context/DashboardDateRangeContext';
import FundraisingDashboard from '../../../common/charts/fundraising_dashboard';
    
// doughnutChartRef = store, procurements, aaccounts_and_finance 
// programsDoughnutChartRef  = programs module 

Chart.register(...registerables);

const defaultFilters = {
  duration: 'today',
  // departments: ['Accounts And Finance', 'Program','Store', 'Procurements', "IT", "Ration", "Water", "Kasb", "Kasb Training", "Marriage Gifts", "Sewing Machine", "Tree Plantation", "Wheel Chair/Crutches", "Education", "Financial Assistance", "Kasb", "Kasb Training", "Marriage Gifts", "Ration", "Sewing Machine", "Tree Plantation", "Wheel Chair/Crutches", "Water"], // import departments from utils/admin
  departments,
  customRange: { from: '', to: '' },
  customDateType: 'single_day',
  customDateValue: '',
};

// Ignore filter UI for now; use a fixed duration.
const DASHBOARD_DURATION = 'this_year';

const AdminDashboard = () => {
  const lineChartRef = useRef(null);
  // -------------------------
  // Doughnut charts (disabled)
  // -------------------------
  // const doughnutChartRef = useRef(null);
  // const doughnutChartInstance = useRef(null);
  // const programsDoughnutChartRef = useRef(null);
  // const programsDoughnutChartInstance = useRef(null); // for programs doughnut chart
  const lineChartInstance = useRef(null);
  const [filters, setFilters] = useState(defaultFilters);
  // -------------------------
  // Doughnut charts data source (disabled)
  // -------------------------
  // `admin/daily-reports` was used to populate department/program doughnut charts.
  // Keep these disabled until we re-enable the charts.
  // const [departmentData, setDepartmentData] = useState(null);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);

  // -------------------------
  // Doughnut click modals (disabled)
  // -------------------------
  // const [programModalOpen, setProgramModalOpen] = useState(false);
  // const [selectedProgramDetails, setSelectedProgramDetails] = useState(null);
  // const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  // const [selectedDepartmentDetails, setSelectedDepartmentDetails] = useState(null);
  // const [selectedDepartmentTitle, setSelectedDepartmentTitle] = useState('');
  // const [selectedProgramTitle, setSelectedProgramTitle] = useState('');
  const [donationSummary, setDonationSummary] = useState(null);
  const [showDeptSummaryAndFundraising, setShowDeptSummaryAndFundraising] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowDeptSummaryAndFundraising(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // Helper to get date range for API
  const getDateRangeForDuration = (durationValue) => {
    const today = new Date();
    const formatDateToYYYYMMDD = (date) => date.toISOString().split('T')[0];
    let from, to;
    switch (durationValue) {
      case 'today':
        from = to = formatDateToYYYYMMDD(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        from = to = formatDateToYYYYMMDD(yesterday);
        break;
      case 'this_week':
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        from = formatDateToYYYYMMDD(startOfWeek);
        to = formatDateToYYYYMMDD(endOfWeek);
        break;
      case 'last_week':
        const lastWeekStart = new Date(today);
        const lastDayOfWeek = today.getDay();
        const lastDiff = today.getDate() - lastDayOfWeek + (lastDayOfWeek === 0 ? -6 : 1) - 7;
        lastWeekStart.setDate(lastDiff);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        from = formatDateToYYYYMMDD(lastWeekStart);
        to = formatDateToYYYYMMDD(lastWeekEnd);
        break;
      case 'this_month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        from = formatDateToYYYYMMDD(startOfMonth);
        to = formatDateToYYYYMMDD(endOfMonth);
        break;
      case 'last_month':
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        from = formatDateToYYYYMMDD(startOfLastMonth);
        to = formatDateToYYYYMMDD(endOfLastMonth);
        break;
      case 'this_year':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        from = formatDateToYYYYMMDD(startOfYear);
        to = formatDateToYYYYMMDD(endOfYear);
        break;
      case 'last_year':
        const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
        from = formatDateToYYYYMMDD(startOfLastYear);
        to = formatDateToYYYYMMDD(endOfLastYear);
        break;
      default:
        from = to = formatDateToYYYYMMDD(today);
    }
    return { from, to };
  };

  // Chart creation/update helpers
  function createOrUpdateLineChart(ctx, data, chartInstanceRef) {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.data = data;
      chartInstanceRef.current.update();
      return;
    }
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  }

  // -------------------------
  // Doughnut chart helpers (disabled)
  // -------------------------
  // function createOrUpdateDoughnutChart(ctx, data, chartInstanceRef, chartData) {
  //   if (chartInstanceRef.current) {
  //     chartInstanceRef.current.data = data;
  //     chartInstanceRef.current.options.plugins.tooltip.callbacks = {
  //       label: function(context) {
  //         const idx = context.dataIndex;
  //         const details = chartData[idx]?.details;
  //         if (!details) return 'No data found';
  //         return [
  //           chartData[idx].label,
  //           ...Object.entries(details).map(([k, v]) => `${k}: ${v}`)
  //         ];
  //       }
  //     };
  //     chartInstanceRef.current.update();
  //     return;
  //   }
  //   chartInstanceRef.current = new Chart(ctx, {
  //     type: 'doughnut',
  //     data,
  //     options: {
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       plugins: {
  //         tooltip: {
  //           callbacks: {
  //             label: function(context) {
  //               const idx = context.dataIndex;
  //               const details = chartData[idx]?.details;
  //               if (!details) return 'No data found';
  //               return [
  //                 chartData[idx].label,
  //                 ...Object.entries(details).map(([k, v]) => `${k}: ${v}`)
  //               ];
  //             }
  //           }
  //         }
  //       }
  //     }
  //   });
  // }

  // Helper to map department data for doughnut chart (disabled)
  // function getDoughnutChartData(departmentData) {
  //   try {
  //     const result = [];
  //     if (departmentData?.accountsAndFinance) {
  //       result.push({
  //         label: "Accounts And Finance",
  //         value: Number(departmentData?.accountsAndFinance?.Grand_Total) || 0,
  //         details: departmentData?.accountsAndFinance,
  //       });
  //     }
  //     if (departmentData?.procurements) {
  //       result.push({
  //         label: "Procurements",
  //         value: Number(departmentData?.procurements?.Grand_Total) || 0,
  //         details: departmentData?.procurements,
  //       });
  //     }
  //     if (departmentData?.store) {
  //       result.push({
  //         label: "Store",
  //         value: Number(departmentData?.store?.Grand_Total) || 0,
  //         details: departmentData?.store,
  //       });
  //     }
  //     if (departmentData?.it) {
  //       result.push({
  //         label: "IT",
  //         value: Number(departmentData?.it?.Grand_Total ?? departmentData?.it?.grandTotal) || 0,
  //         details: departmentData?.it,
  //       });
  //     }
  //     return result;
  //   } catch (error) {
  //     console.log(error.message);
  //     return [];
  //   }
  // }

  // Helper to map program data for programs doughnut chart (disabled)
  // function getProgramsDoughnutChartData(departmentData) {
  //   try {
  //     const result = [];
  //     const programData = departmentData?.program;
  //     if (!programData) return result;
  //
  //     const programModules = [
  //       { key: 'applicationReports', label: 'Applications' },
  //       { key: 'areaRationReports', label: 'Area Ration' },
  //       { key: 'educationReports', label: 'Education' },
  //       { key: 'financialAssistanceReports', label: 'Financial Assistance' },
  //       { key: 'kasbReports', label: 'Kasb' },
  //       { key: 'kasabTrainingReports', label: 'Kasb Training' },
  //       { key: 'marriageGiftsReports', label: 'Marriage Gifts' },
  //       { key: 'rationReports', label: 'Ration' },
  //       { key: 'sewingMachineReports', label: 'Sewing Machine' },
  //       { key: 'treePlantationReports', label: 'Tree Plantation' },
  //       { key: 'waterReports', label: 'Water' },
  //       { key: 'wheelChairOrCrutchesReports', label: 'Wheel Chair/Crutches' },
  //     ];
  //
  //     programModules.forEach(({ key, label }) => {
  //       const data = programData[key];
  //       if (
  //         data &&
  //         (data.Grand_Total !== undefined ||
  //           data['Total Quantity'] !== undefined ||
  //           data['Total Wheel Chairs'] !== undefined ||
  //           data['Total Crutches'] !== undefined)
  //       ) {
  //         const value =
  //           data.Grand_Total ??
  //           data['Total Quantity'] ??
  //           data['Total Wheel Chairs'] ??
  //           data['Total Crutches'] ??
  //           0;
  //
  //         result.push({
  //           label,
  //           value: Number(value) || 0,
  //           details: data,
  //         });
  //       }
  //     });
  //
  //     return result;
  //   } catch (error) {
  //     console.log(error.message);
  //     return [];
  //   }
  // }

  // Helper to map data for line chart
async   function getLineChartData(departmentData) {
    // TODO: User should extract and format the line chart data as needed
    // Example fallback to static data:
    return departmentData && departmentData.lineChart ? departmentData.lineChart : {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Daily Expenses in $',
        data: [2050, 1900, 2100, 2800, 1800, 2000, 2500, 2600, 2450, 1950, 2300, 2900],
        backgroundColor: ['rgba(54, 162, 235, 0.2)'],
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        fill: true
      }]
    };
  }
// const fetchDonationsSummary = async (year) => {
//   try {
//     const response = await axiosInstance.get(`/donations-summary?duration=year&year=${year}`);
//     // API response shape (observed): { dateRange, chart: { labels, datasets } }
//     // Keep fallbacks for older shapes if they exist.
//     const chart =
//       response?.data?.chart ??
//       response?.data?.data?.chart ??
//       response?.data?.data?.data?.chart;
//     setDonationSummary(chart);
//   } catch (error) {
//     console.log(error.message);
//   }
// }
// useEffect(() => {
//   fetchDonationsSummary(new Date().getFullYear());
// }, []);

  // Fetch department/program data once (ignore filter UI for now)
  // NOTE: This API call was used for Doughnut charts data.
  // It is fully disabled for now (no chart data fetch).
  // useEffect(() => {
  //   const fetchDepartmentData = async () => {
  //     setLoading(true);
  //     setError(null);
  //     try {
  //       const range = getDateRangeForDuration(DASHBOARD_DURATION);
  //       const filterData = {
  //         from: range.from,
  //         to: range.to,
  //         departments,
  //         duration: DASHBOARD_DURATION,
  //       };
  //       const response = await axiosInstance.post('admin/daily-reports', filterData);
  //       setDepartmentData(response.data);
  //     } catch (err) {
  //       setError(err.message || 'Failed to fetch department data');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //
  //   fetchDepartmentData();
  // }, []);

  // Chart update effect (disabled with admin/daily-reports)
  // useEffect(() => {
  //   if (!departmentData) return;

    // -------------------------
    // Doughnut charts update + click handlers (disabled)
    // -------------------------
    // const chartData = getDoughnutChartData(departmentData);
    // const doughnutData = {
    //   labels: chartData.map(d => d.label),
    //   datasets: [{
    //     label: 'Department Data',
    //     data: chartData.map(d => d.value),
    //     backgroundColor: [
    //       'rgba(54, 162, 235, 1)',
    //       'rgba(75, 192, 192, 1)',
    //       'rgba(255, 206, 86, 1)',
    //       'rgba(120, 46, 139,1)',
    //       'rgba(255, 99, 132, 1)'
    //     ],
    //     borderColor: [
    //       'rgba(54, 162, 235, 1)',
    //       'rgba(75, 192, 192, 1)',
    //       'rgba(255, 206, 86, 1)',
    //       'rgba(120, 46, 139,1)',
    //       'rgba(255, 99, 132, 1)'
    //     ],
    //     borderWidth: 1
    //   }]
    // };
    //
    // // --- Programs Doughnut Chart Data ---
    // const programsChartData = getProgramsDoughnutChartData(departmentData);
    // const programsColors = [
    //   '#1f77b4', // blue
    //   '#ff7f0e', // orange
    //   '#2ca02c', // green
    //   '#d62728', // red
    //   '#9467bd', // purple
    //   '#8c564b', // brown
    //   '#e377c2', // pink
    //   '#7f7f7f', // gray
    //   '#bcbd22', // olive
    //   '#17becf', // cyan
    //   '#f7b6d2', // light pink
    //   '#c5b0d5', // light purple
    //   '#c49c94', // light brown
    //   '#dbdb8d', // light olive
    //   '#9edae5', // light cyan
    // ];
    // const programsDoughnutData = {
    //   labels: programsChartData.map(d => d.label),
    //   datasets: [{
    //     label: 'Programs Data',
    //     data: programsChartData.map(d => d.value),
    //     backgroundColor: programsColors.slice(0, programsChartData.length),
    //     borderColor: programsColors.slice(0, programsChartData.length),
    //     borderWidth: 1
    //   }]
    // };
    //
    // if (doughnutChartRef.current) {
    //   createOrUpdateDoughnutChart(doughnutChartRef.current.getContext('2d'), doughnutData, doughnutChartInstance, chartData);
    //   doughnutChartRef.current.onclick = function(evt) {
    //     if (!doughnutChartInstance.current) return;
    //     const points = doughnutChartInstance.current.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    //     if (points.length > 0) {
    //       const idx = points[0].index;
    //       const details = chartData[idx]?.details;
    //       const title = chartData[idx]?.label;
    //       setSelectedDepartmentDetails(details);
    //       setSelectedDepartmentTitle(title);
    //       setDepartmentModalOpen(true);
    //     }
    //   };
    // }
    // if (programsDoughnutChartRef.current) {
    //   createOrUpdateDoughnutChart(programsDoughnutChartRef.current.getContext('2d'), programsDoughnutData, programsDoughnutChartInstance, programsChartData);
    //   programsDoughnutChartRef.current.onclick = function(evt) {
    //     if (!programsDoughnutChartInstance.current) return;
    //     const points = programsDoughnutChartInstance.current.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    //     if (points.length > 0) {
    //       const idx = points[0].index;
    //       const details = programsChartData[idx]?.details;
    //       const title = programsChartData[idx]?.label;
    //       setSelectedProgramDetails(details);
    //       setSelectedProgramTitle(title);
    //       setProgramModalOpen(true);
    //     }
    //   };
    // }

  //   const lineData = getLineChartData(departmentData);
  //   if (lineChartRef.current) {
  //     createOrUpdateLineChart(lineChartRef.current.getContext('2d'), lineData, lineChartInstance);
  //   }
    // Cleanup function
  //   return () => {
      // Doughnut chart instances cleanup (disabled)
      // if (doughnutChartInstance.current) {
      //   doughnutChartInstance.current.destroy();
      //   doughnutChartInstance.current = null;
      // }
      // if (programsDoughnutChartInstance.current) {
      //   programsDoughnutChartInstance.current.destroy();
      //   programsDoughnutChartInstance.current = null;
      // }
  //     if (lineChartInstance.current) {
  //       lineChartInstance.current.destroy();
  //       lineChartInstance.current = null;
  //     }
  //   };
  // }, [departmentData]);

  // Cards renderer for departmentData (disabled with admin/daily-reports)
  // const renderCards = () => {
  //   if (!departmentData) return null;
  //
  //   return Object.entries(departmentData).map(([department, data]) => {
  //     if (data) {
  //       return <Card key={department} title={department} data={data} />;
  //     }
  //     return null;
  //   });
  // };

  const deliverablesRange = getDateRangeForDuration(DASHBOARD_DURATION);

  return (
    <div className="admin-dashboard">
      <Navbar />
      <div className="main">
        {/* Doughnut charts loading/error (disabled with admin/daily-reports) */}
        {/* {loading && <div className="loading">Loading...</div>} */}
        {/* {error && <div className="error">{error}</div>} */}
        
        <div className="charts">
          {/* <div className="chart">
            <h2>Department Distribution</h2>
            <div>
              <canvas ref={doughnutChartRef}></canvas>
            </div>
          </div>
          <div className="chart">
            <h2>Programs </h2>
            <div>
              <canvas ref={programsDoughnutChartRef}></canvas>
            </div>
          </div> */}
          {/* <div className="chart">
            <h2> Performance Overview <small style={{fontSize: '12px', color: 'gray'}}>Upcomming....</small></h2>
            <div>
              <canvas ref={lineChartRef}></canvas>
            </div>
          </div> */}

          {/* <div className="chart"> */}
            {/* <h2> Donations Summary </h2> */}

          {/* </div> */}

        </div>

        <div className="admin-dashboard__below-charts">
          {/* <LineChart
            data={donationSummary}
            title="Donations Summary"
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
            height={300}
            showDownload={false}
            downloadFileName="donations-summary"
          /> */}
          {/* <ProgramApplicationCard from={deliverablesRange.from} to={deliverablesRange.to} />
          <DeliverablesOverallCard
            from={deliverablesRange.from}
            to={deliverablesRange.to}
            title="Deliverables — overall"
          />
          {showDeptSummaryAndFundraising ? (
            <>
              <DashboardDateRangeProvider>
                <DepartmentReportsSummary />
              </DashboardDateRangeProvider>
            </>
          ) : null} */}
                        <FundraisingDashboard />
        </div>

        {/* <div className="department-cards">{renderCards()}</div> */}
      </div>
      {/* Doughnut chart click detail modals (disabled) */}
      {/* <Modal open={programModalOpen} onClose={() => setProgramModalOpen(false)} details={selectedProgramDetails} title={selectedProgramTitle} /> */}
      {/* <Modal open={departmentModalOpen} onClose={() => setDepartmentModalOpen(false)} details={selectedDepartmentDetails} title={selectedDepartmentTitle} /> */}

    {/* <div className="dashboard-container">  */}
      {/* Top row: allocations + gender/age */}
      {/* <div className="dashboard-row">
        <div className="dashboard-col">
          <AllocationsSummary />
        </div>
        <div className="dashboard-col">
          <PeopleSummary />
        </div>
      </div> */}

      {/* Middle row: beneficiary types + organizations */} 
       {/* <div className="dashboard-row full-width">
        <div className="dashboard-col">
          <BeneficiaryTypes />
        </div>
      </div> */}

      {/* Bottom row: sectors full width */}
      {/* <div className="dashboard-row full-width">
        <Sectors />
      </div> */}
    {/* </div> */}
    </div>
  );
};

export default AdminDashboard; 