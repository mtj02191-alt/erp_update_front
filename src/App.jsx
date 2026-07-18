import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // REQUIRED

import Login from './components/login/login';
import CeoDashboard from './components/ceo-office/dashboard';
import QuickNote from './components/ceo-office/note/quick-note';
import InstructionRegister from './components/ceo-office/instruction-register';
import CeoNoteView from './components/ceo-office/note/note-view';
import { List as ProjectCommandSheets, View as ProjectCommandSheetView } from './components/ceo-office/project-command-sheets';
import VisitorsList from './components/ceo-office/visitors/VisitorsList';
import VisitorView from './components/ceo-office/visitors/VisitorView';
import Store from './components/store/Store';
import Procurements from './components/procurements/Procurements';
import Program from './components/program/Program';
import AccountsAndFinance from './components/accounts_and_finance/AccountsAndFinance';
import AdminDashboard from './components/admin/dashboard/doughnut_charts/AdminDashboard';
import CreateUser from './components/admin/user/CreateUser';
import UpdateUser from './components/admin/user/UpdateUser';
import UserList from './components/admin/user/UserList';
import ProtectedRoute, { ProtectedRoutes } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { SummaryProvider } from './context/SummaryContext';
import { InKindItemsProvider } from './context/InKindItemsContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/common/Sidebar/Sidebar';
import UserView from './components/admin/user/UserView';
import ApplicationReportsList from './components/program/applications_report/application_reports_list';
import CreateApplicationReport from './components/program/applications_report/create_application_report';
import UpdateApplicationReport from './components/program/applications_report/update_application_report';
import ViewApplicationReport from './components/program/applications_report/view_application_report';
import SubprogramsList from './components/program/subprograms/list';
import AddSubprogram from './components/program/subprograms/add';
import UpdateSubprogram from './components/program/subprograms/update';
import ViewSubprogram from './components/program/subprograms/view';
import ProgramsList from './components/program/programs/list';
import AddProgram from './components/program/programs/add';
import UpdateProgram from './components/program/programs/update';
import ViewProgram from './components/program/programs/view';
import DreamSchoolsList from './components/program/dream_schools/list';
import AddDreamSchool from './components/program/dream_schools/add';
import UpdateDreamSchool from './components/program/dream_schools/update';
import ViewDreamSchool from './components/program/dream_schools/view';
import DreamSchoolReportsList from './components/program/dream_school_reports/list';
import AddDreamSchoolReport from './components/program/dream_school_reports/add';
import EditDreamSchoolReport from './components/program/dream_school_reports/edit';
import ViewDreamSchoolReport from './components/program/dream_school_reports/view';
import AasCollectionCentersReportsList from './components/program/aas_collection_centers_reports/list';
import AddAasCollectionCentersReport from './components/program/aas_collection_centers_reports/add';
import UpdateAasCollectionCentersReport from './components/program/aas_collection_centers_reports/update';
import ViewAasCollectionCentersReport from './components/program/aas_collection_centers_reports/view';
import AlHasanainClgList from './components/program/al_hasanain_clg/list';
import AddAlHasanainClg from './components/program/al_hasanain_clg/add';
import UpdateAlHasanainClg from './components/program/al_hasanain_clg/update';
import ViewAlHasanainClg from './components/program/al_hasanain_clg/view';
import AddRationReport from './components/program/ration_report/add';
import RationReportList from './components/program/ration_report/list';
import ViewRationReport from './components/program/ration_report/view';
import UpdateRationReport from './components/program/ration_report/update';
import AddMarriageGiftsReport from './components/program/marriage_gifts/reports/add';
import MarriageGiftsList from './components/program/marriage_gifts/reports/list';
import UpdateMarriageGiftsReport from './components/program/marriage_gifts/reports/update';
import ViewMarriageGiftsReport from './components/program/marriage_gifts/reports/view';
import AddFinancialAssistanceReport from './components/program/financial_assistance/reports/add';
import FinancialAssistanceList from './components/program/financial_assistance/reports/list';
import UpdateFinancialAssistanceReport from './components/program/financial_assistance/reports/update';
import ViewFinancialAssistanceReport from './components/program/financial_assistance/reports/view';
import AddSewingMachineReport from './components/program/sewing_machine/reports/add';
import SewingMachineList from './components/program/sewing_machine/reports/list';
import UpdateSewingMachineReport from './components/program/sewing_machine/reports/update';
import ViewSewingMachineReport from './components/program/sewing_machine/reports/view';
import AddWheelChairOrCrutchesReport from './components/program/wheel_chair_or_crutches/reports/add';
import WheelChairOrCrutchesList from './components/program/wheel_chair_or_crutches/reports/list';
import UpdateWheelChairOrCrutchesReport from './components/program/wheel_chair_or_crutches/reports/update';
import ViewWheelChairOrCrutchesReport from './components/program/wheel_chair_or_crutches/reports/view';
import AddHealthReport from './components/program/health/reports/add';
import HealthReportsList from './components/program/health/reports/list';
import UpdateHealthReport from './components/program/health/reports/update';
import ViewHealthReport from './components/program/health/reports/view';
import AddWaterReport from './components/program/water/reports/add';
import WaterReportsList from './components/program/water/reports/list';
import UpdateWaterReport from './components/program/water/reports/update';
import ViewWaterReport from './components/program/water/reports/view';
import AddKasbReport from './components/program/kasb/reports/add';
import KasbReportsList from './components/program/kasb/reports/list';
import UpdateKasbReport from './components/program/kasb/reports/update';
import ViewKasbReport from './components/program/kasb/reports/view';
import AddKasbTrainingReport from './components/program/kasb_training/reports/add/AddKasbTrainingReport';
import ListKasbTrainingReports from './components/program/kasb_training/reports/list/ListKasbTrainingReports';
import UpdateKasbTrainingReport from './components/program/kasb_training/reports/update/UpdateKasbTrainingReport';
import ViewKasbTrainingReport from './components/program/kasb_training/reports/view/ViewKasbTrainingReport';
import AddEducationReport from './components/program/education/reports/add';
import ListEducationReports from './components/program/education/reports/list';
import UpdateEducationReport from './components/program/education/reports/update';
import ViewEducationReport from './components/program/education/reports/view';
// Tree Plantation Report Components
import AddTreePlantationReport from './components/program/tree_plantation/reports/add';
import TreePlantationReportsList from './components/program/tree_plantation/reports/list';
import UpdateTreePlantationReport from './components/program/tree_plantation/reports/update';
import ViewTreePlantationReport from './components/program/tree_plantation/reports/view';
// Area Ration Report Components
import AddAreaRationReport from './components/program/area_ration/reports/add';
import AreaRationReportsList from './components/program/area_ration/reports/list';
import UpdateAreaRationReport from './components/program/area_ration/reports/update';
import ViewAreaRationReport from './components/program/area_ration/reports/view';
// Store Report Components
import AddStoreReport from './components/store/reports/add';
import StoreReportsList from './components/store/reports/list';
import UpdateStoreReport from './components/store/reports/update';
import ViewStoreReport from './components/store/reports/view';
import AddProcurementReport from './components/procurements/reports/add';
import ProcurementReportsList from './components/procurements/reports/list';
import UpdateProcurementReport from './components/procurements/reports/update';
import ViewProcurementReport from './components/procurements/reports/view';
// Accounts & Finance Report Components
import AddAccountsAndFinanceReport from './components/accounts_and_finance/reports/add';
import AccountsAndFinanceReportsList from './components/accounts_and_finance/reports/list';
import UpdateAccountsAndFinanceReport from './components/accounts_and_finance/reports/update';
import ViewAccountsAndFinanceReport from './components/accounts_and_finance/reports/view';
import './App.css';
import TargetsList from './components/program/targets/reports/list';
import AddTarget from './components/program/targets/reports/add';
import UpdateTarget from './components/program/targets/reports/update';
import ViewTarget from './components/program/targets/reports/view';
import AdminApplicationsList from './components/admin/hr/career/applications/list/index';
import AdminApplicationView from './components/admin/hr/career/applications/view/index';
import JobsList from './components/admin/hr/careers/jobs/list/index';
import AddJob from './components/admin/hr/careers/jobs/add/index';
import ViewJob from './components/admin/hr/careers/jobs/view/index';
import { OnlineDonationsList, ViewOnlineDonation, UpdateOnlineDonation } from './components/dms/donations/online_donations/index';
import { DonorsList, RegisterDonor, ViewDonor, EditDonor, VolunteersList, RegisterVolunteer, ViewVolunteer, EditVolunteer, SurveysList, AddSurvey, ViewSurvey, EditSurvey, SurveyReport, FillSurvey, EventsList, AddEvent, EditEvent, ViewEvent, CampaignsList, AddCampaign, EditCampaign, ViewCampaign } from './components/dms';
import AddDonation from './components/donations/online_donations/add';
import AddDonationBox from './components/dms/donation_box/add';
import DonationBoxList from './components/dms/donation_box/list';
import ViewDonationBox from './components/dms/donation_box/view';
import AddDonationBoxDonation from './components/dms/donations/donation_box/add';
import DonationBoxDonationsList from './components/dms/donations/donation_box/list';
import ViewDonationBoxDonation from './components/dms/donations/donation_box/view';
import FundRaising from './components/dms/fund_raising';
import FundRaisingDashboardPage from './components/dms/fund_raising_dashboard';
import EmailTemplateList from './components/dms/email_templates/list';
import EmailTemplateForm from './components/dms/email_templates/form';
import AddInKindItem from './components/dms/in_kind/in_kind_items/add';
import InKindItemsList from './components/dms/in_kind/in_kind_items/list';
import EditInKindItem from './components/dms/in_kind/in_kind_items/edit';
import ViewInKindItem from './components/dms/in_kind/in_kind_items/view';
import DonationReports from './components/dms/reports/create';
import CountriesList from './components/dms/geographic/countries/list';
import AddCountry from './components/dms/geographic/countries/add';
import RegionsList from './components/dms/geographic/regions/list';
import AddRegion from './components/dms/geographic/regions/add';
import DistrictsList from './components/dms/geographic/districts/list';
import AddDistrict from './components/dms/geographic/districts/add';
import TehsilsList from './components/dms/geographic/tehsils/list';
import AddTehsil from './components/dms/geographic/tehsils/add';
import CitiesList from './components/dms/geographic/cities/list';
import AddCity from './components/dms/geographic/cities/add';
import RoutesList from './components/dms/geographic/routes/list';
import AddRoute from './components/dms/geographic/routes/add';
import TasksList from './components/admin/tasks/list';
import AddTask from './components/admin/tasks/add';
import UpdateTask from './components/admin/tasks/update';
import ViewTask from './components/admin/tasks/view';
import TaskReports from './components/admin/tasks/reports';
import TaskReceipt from './components/admin/tasks/taskrecipt';
import PublicTrackingPage from './components/progress_tracking/public';
import TemplatesList from './components/progress_tracking/admin/templates/list';
import TemplateAdd from './components/progress_tracking/admin/templates/add';
import TemplateView from './components/progress_tracking/admin/templates/view';
import TrackersList from './components/progress_tracking/admin/trackers/list';
import TrackersAdd from './components/progress_tracking/admin/trackers/add';
import TrackersView from './components/progress_tracking/admin/trackers/view';
import StepsList from './components/progress_tracking/admin/steps/list';
import StepView from './components/progress_tracking/admin/steps/view';
import EvidenceView from './components/progress_tracking/admin/evidence/view';
import ProgressTemplateDashboard from './components/admin/dashboard/progress_template_dashboard';

const App = () => {
  return (<React.Fragment>
            <Router> 
              <AuthProvider>
                <NotificationProvider>
                  <SummaryProvider>
                    <InKindItemsProvider>
                      <div className="app-container">
                        {/* Sidebar - only show on protected routes */}
                        <Routes>
                    <Route path="/" element={<Login />} />
                    <Route
                      path="/*"
                      element={
                          <div className="app-layout">
                            <Sidebar />
                            <main className="app-main">
                              <Routes>
                                {/* Main Dashboard Routes */}
                                <Route path="/tracking/:token" element={<PublicTrackingPage />} />
                                <Route path="/progress/templates" element={<TemplatesList />} />
                                <Route path="/progress/templates/add" element={<TemplateAdd />} />
                                <Route path="/progress/templates/:id" element={<TemplateView />} />
                                <Route path="/progress/trackers" element={<TrackersList />} />
                                <Route path="/progress/trackers/add" element={<TrackersAdd />} />
                                <Route path="/progress/trackers/:id" element={<TrackersView />} />
                                <Route path="/progress/trackers/:trackerId/steps" element={<StepsList />} />
                                <Route path="/progress/trackers/:trackerId/steps/:stepId" element={<StepView />} />
                                <Route path="/progress/trackers/:trackerId/steps/:stepId/evidence/:evidenceId" element={<EvidenceView />} />
                                <Route path="/store" element={<Store />} />
                                <Route path="/procurements" element={<Procurements />} />
                                <Route path="/program" element={<Program />} />
                                <Route path="/accounts_and_finance" element={<AccountsAndFinance />} />
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/progress-template-dashboard" element={<ProgressTemplateDashboard />} />
                                <Route path="/welcome" element={<Program />} />

                                {/* CEO Office Routes */}
                                <Route path="/ceo-office/dashboard" element={<CeoDashboard />} />
                                <Route path="/ceo-office/quick-note" element={<QuickNote />} />
                                <Route path="/ceo-office/instruction-register" element={<InstructionRegister />} />
                                <Route path="/ceo-office/notes/:id" element={<CeoNoteView />} />
                                <Route path="/ceo-office/project-command-sheets" element={<ProjectCommandSheets />} />
                                <Route path="/ceo-office/project-command-sheets/:id" element={<ProjectCommandSheetView />} />
                                <Route path="/ceo-office/visitors" element={<VisitorsList />} />
                                <Route path="/ceo-office/visitors/:id" element={<VisitorView />} />
                                <Route path="/ceo-office" element={<Navigate to="/ceo-office/dashboard" replace />} />

                                {/* User Management Routes */}
                                <Route path="/admin/users" element={<UserList />} />
                                <Route path="/admin/users/create" element={<CreateUser />} />
                                <Route path="/admin/users/edit/:id" element={<UpdateUser />} />
                                <Route path="/users/:id" element={<UserView />} />
                                
                                {/* Store Report Routes - Nested under /store */}
                                <Route path="/store/reports/add" element={<AddStoreReport />} />
                                <Route path="/store/reports/list" element={<StoreReportsList />} />
                                <Route path="/store/reports/update/:id" element={<UpdateStoreReport />} />
                                <Route path="/store/reports/view/:id" element={<ViewStoreReport />} />
                                
                                {/* Applications Report Routes - Nested under /program */}
                                <Route path="/program/applications_reports" element={<ApplicationReportsList />} />
                                <Route path="/program/applications_reports/add" element={<CreateApplicationReport />} />
                                <Route path="/program/applications_reports/edit_application_report/:id" element={<UpdateApplicationReport />} />
                                <Route path="/program/applications_reports/view_application_report/:id" element={<ViewApplicationReport />} />

                                {/* Subprogram CRUD Routes */}
                                <Route path="/program/subprograms" element={<SubprogramsList />} />
                                <Route path="/program/subprograms/add" element={<AddSubprogram />} />
                                <Route path="/program/subprograms/update/:id" element={<UpdateSubprogram />} />
                                <Route path="/program/subprograms/view/:id" element={<ViewSubprogram />} />

                                {/* Program CRUD Routes */}
                                <Route path="/program/programs" element={<ProgramsList />} />
                                <Route path="/program/programs/add" element={<AddProgram />} />
                                <Route path="/program/programs/update/:id" element={<UpdateProgram />} />
                                <Route path="/program/programs/view/:id" element={<ViewProgram />} />

                                <Route path="/program/dream_schools" element={<DreamSchoolsList />} />
                                <Route path="/program/dream_schools/add" element={<AddDreamSchool />} />
                                <Route path="/program/dream_schools/update/:id" element={<UpdateDreamSchool />} />
                                <Route path="/program/dream_schools/view/:id" element={<ViewDreamSchool />} />
                                <Route path="/program/dream_school_reports" element={<DreamSchoolReportsList />} />
                                <Route path="/program/dream_school_reports/add" element={<AddDreamSchoolReport />} />
                                <Route path="/program/dream_school_reports/edit/:id" element={<EditDreamSchoolReport />} />
                                <Route path="/program/dream_school_reports/view/:id" element={<ViewDreamSchoolReport />} />

                                {/* AAS Collection Centers Reports */}
                                <Route path="/program/aas_collection_centers_reports" element={<AasCollectionCentersReportsList />} />
                                <Route path="/program/aas_collection_centers_reports/add" element={<AddAasCollectionCentersReport />} />
                                <Route path="/program/aas_collection_centers_reports/update/:id" element={<UpdateAasCollectionCentersReport />} />
                                <Route path="/program/aas_collection_centers_reports/view/:id" element={<ViewAasCollectionCentersReport />} />

                                {/* Al Hasanain CLG */}
                                <Route path="/program/al_hasanain_clg" element={<AlHasanainClgList />} />
                                <Route path="/program/al_hasanain_clg/add" element={<AddAlHasanainClg />} />
                                <Route path="/program/al_hasanain_clg/update/:id" element={<UpdateAlHasanainClg />} />
                                <Route path="/program/al_hasanain_clg/view/:id" element={<ViewAlHasanainClg />} />
                                
                                {/* Ration Report Routes - Nested under /program */}
                                <Route path="/program/ration_report/add" element={<AddRationReport />} />
                                <Route path="/program/ration_report/list" element={<RationReportList />} />
                                <Route path="/program/ration_report/view/:id" element={<ViewRationReport />} />
                                <Route path="/program/ration_report/update/:id" element={<UpdateRationReport />} />
                                
                                {/* Marriage Gifts Report Routes - Nested under /program */}
                                <Route path="/program/marriage_gifts/reports/add" element={<AddMarriageGiftsReport />} />
                                <Route path="/program/marriage_gifts/reports/list" element={<MarriageGiftsList />} />
                                <Route path="/program/marriage_gifts/reports/update/:id" element={<UpdateMarriageGiftsReport />} />
                                <Route path="/program/marriage_gifts/reports/view/:id" element={<ViewMarriageGiftsReport />} />
                                
                                {/* Financial Assistance Reports */}
                                <Route path="/program/financial_assistance/reports/add" element={<AddFinancialAssistanceReport />} />
                                <Route path="/program/financial_assistance/reports/list" element={<FinancialAssistanceList />} />
                                <Route path="/program/financial_assistance/reports/update/:id" element={<UpdateFinancialAssistanceReport />} />
                                <Route path="/program/financial_assistance/reports/view/:id" element={<ViewFinancialAssistanceReport />} />

                                {/* Sewing Machine Reports */}
                                <Route path="/program/sewing_machine/reports/add" element={<AddSewingMachineReport />} />
                                <Route path="/program/sewing_machine/reports/list" element={<SewingMachineList />} />
                                <Route path="/program/sewing_machine/reports/update/:id" element={<UpdateSewingMachineReport />} />
                                <Route path="/program/sewing_machine/reports/view/:id" element={<ViewSewingMachineReport />} />

                                {/* Wheel Chair or Crutches Reports */}
                                <Route path="/program/wheel_chair_or_crutches/reports/add" element={<AddWheelChairOrCrutchesReport />} />
                                <Route path="/program/wheel_chair_or_crutches/reports/list" element={<WheelChairOrCrutchesList />} />
                                <Route path="/program/wheel_chair_or_crutches/reports/update/:id" element={<UpdateWheelChairOrCrutchesReport />} />
                                <Route path="/program/wheel_chair_or_crutches/reports/view/:id" element={<ViewWheelChairOrCrutchesReport />} />

                                {/* Health Reports */}
                                <Route path="/program/health/reports/add" element={<AddHealthReport />} />
                                <Route path="/program/health/reports/list" element={<HealthReportsList />} />
                                <Route path="/program/health/reports/update/:id" element={<UpdateHealthReport />} />
                                <Route path="/program/health/reports/view/:id" element={<ViewHealthReport />} />

                                {/* Water Reports */}
                                <Route path="/program/water/reports/add" element={<AddWaterReport />} />
                                <Route path="/program/water/reports/list" element={<WaterReportsList />} />
                                <Route path="/program/water/reports/update/:id" element={<UpdateWaterReport />} />
                                <Route path="/program/water/reports/view/:id" element={<ViewWaterReport />} />

                                {/* Kasb Reports */}
                                <Route path="/program/kasb/reports/add" element={<AddKasbReport />} />
                                <Route path="/program/kasb/reports/list" element={<KasbReportsList />} />
                                <Route path="/program/kasb/reports/update/:id" element={<UpdateKasbReport />} />
                                <Route path="/program/kasb/reports/view/:id" element={<ViewKasbReport />} />

                                {/* Kasb Training Reports */}
                                <Route path="/program/kasb-training/reports" element={<ListKasbTrainingReports />} />
                                <Route path="/program/kasb-training/reports/add" element={<AddKasbTrainingReport />} />
                                <Route path="/program/kasb-training/reports/update/:id" element={<UpdateKasbTrainingReport />} />
                                <Route path="/program/kasb-training/reports/view/:id" element={<ViewKasbTrainingReport />} />

                                {/* Education Reports */}
                                <Route path="/program/education/reports/list" element={<ListEducationReports />} />
                                <Route path="/program/education/reports/add" element={<AddEducationReport />} />
                                <Route path="/program/education/reports/update/:id" element={<UpdateEducationReport />} />
                                <Route path="/program/education/reports/view/:id" element={<ViewEducationReport />} />

                                {/* Tree Plantation Reports */}
                                <Route path="/program/tree_plantation/reports/add" element={<AddTreePlantationReport />} />
                                <Route path="/program/tree_plantation/reports/list" element={<TreePlantationReportsList />} />
                                <Route path="/program/tree_plantation/reports/update/:id" element={<UpdateTreePlantationReport />} />
                                <Route path="/program/tree_plantation/reports/view/:id" element={<ViewTreePlantationReport />} />

                                {/* Area Ration Reports */}
                                <Route path="/program/area_ration/reports/add" element={<AddAreaRationReport />} />
                                <Route path="/program/area_ration/reports/list" element={<AreaRationReportsList />} />
                                <Route path="/program/area_ration/reports/update/:id" element={<UpdateAreaRationReport />} />
                                <Route path="/program/area_ration/reports/view/:id" element={<ViewAreaRationReport />} />

                                {/* Procurements Report Routes - Nested under /procurements */}
                                <Route path="/procurements/reports/add" element={<AddProcurementReport />} />
                                <Route path="/procurements/reports/list" element={<ProcurementReportsList />} />
                                <Route path="/procurements/reports/update/:id" element={<UpdateProcurementReport />} />
                                <Route path="/procurements/reports/view/:id" element={<ViewProcurementReport />} />

                                {/* Accounts & Finance Report Routes - Nested under /accounts_and_finance */}
                                <Route path="/accounts_and_finance/reports/add" element={<AddAccountsAndFinanceReport />} />
                                <Route path="/accounts_and_finance/reports/list" element={<AccountsAndFinanceReportsList />} />
                                <Route path="/accounts_and_finance/reports/update/:id" element={<UpdateAccountsAndFinanceReport />} />
                                <Route path="/accounts_and_finance/reports/view/:id" element={<ViewAccountsAndFinanceReport />} />

                                {/* Targets Routes */}
                                <Route path="/program/targets/reports/list" element={<TargetsList />} />
                                <Route path="/program/targets/reports/add" element={<AddTarget />} />
                                <Route path="/program/targets/reports/update/:id" element={<UpdateTarget />} />
                                <Route path="/program/targets/reports/view/:id" element={<ViewTarget />} />   

                                {/* HR */}
                                <Route path="/hr/career/applications/list" element={<AdminApplicationsList />} />
                                <Route path="/hr/career/applications/view/:id" element={<AdminApplicationView />} />
                                
                                {/* Jobs Routes */}
                                <Route path="/hr/careers/jobs/list" element={<JobsList />} />
                                <Route path="/hr/careers/jobs/add" element={<AddJob />} />
                                <Route path="/hr/careers/jobs/view/:id" element={<ViewJob />} /> 
                                
                                {/* Fund Raising Welcome */}
                                <Route path="/fund_raising" element={<FundRaising />} />
                                <Route path="/fund_raising/dashboard" element={<FundRaisingDashboardPage />} />
                                {/* DMS Section Routes */}
                                <Route path="/dms/donation_box/add" element={<AddDonationBox />} />
                                <Route path="/dms/donation_box/list" element={<DonationBoxList />} />
                                <Route path="/dms/donation_box/view/:id" element={<ViewDonationBox />} />
                                <Route path="/dms/donation-box-donations/add" element={<AddDonationBoxDonation />} />
                                <Route path="/dms/donation-box-donations/add/:id" element={<AddDonationBoxDonation />} />
                                <Route path="/dms/donation-box-donations/list" element={<DonationBoxDonationsList />} />
                                <Route path="/dms/donation-box-donations/list/:id" element={<DonationBoxDonationsList />} />
                                <Route path="/dms/donation-box-donations/view/:id" element={<ViewDonationBoxDonation />} />
                                <Route path="/dms/donation_box/view/:id" element={<ViewDonationBox />} />
                                
                                {/* Donations Routes */}
                                <Route path="/donations/online_donations/list" element={<OnlineDonationsList />} />
                                <Route path="/donations/offline_donations/list" element={<OnlineDonationsList />} />
                                <Route path="/donations/online_donations/view/:id" element={<ViewOnlineDonation />} />
                                <Route path="/donations/online_donations/update/:id" element={<UpdateOnlineDonation />} />
                                <Route path="/donations/online_donations/add" element={<AddDonation />} /> 
                                
                                {/* Donors Routes */}
                                <Route path="/dms/donors/list" element={<DonorsList />} />
                                <Route path="/dms/donors/view/:id" element={<ViewDonor />} />
                                <Route path="/dms/donors/add" element={<RegisterDonor />} />
                                <Route path="/dms/donors/edit/:id" element={<EditDonor />} />

                                
                                {/* Volunteers Routes */}
                                <Route path="/dms/volunteers/list" element={<VolunteersList />} />
                                <Route path="/dms/volunteers/view/:id" element={<ViewVolunteer />} />
                                <Route path="/dms/volunteers/add" element={<RegisterVolunteer />} />
                                <Route path="/dms/volunteers/edit/:id" element={<EditVolunteer />} />
                                {/* <Route path="/donors/update/:id" element={<UpdateDonor />} /> */}
                                {/* In-Kind Items Routes */}
                                <Route path="/dms/in-kind-items/list" element={<InKindItemsList />} />
                                <Route path="/dms/in-kind-items/add" element={<AddInKindItem />} />
                                <Route path="/dms/in-kind-items/edit/:id" element={<EditInKindItem />} />
                                <Route path="/dms/in-kind-items/view/:id" element={<ViewInKindItem />} />

                                {/* Donation Emails Route */}
                                <Route path="/dms/reports/create" element={<DonationReports />} />

                                {/* Geographic (Countries → Regions → Districts → Tehsils → Cities → Routes) */}
                                <Route path="/dms/geographic/countries/list" element={<CountriesList />} />
                                <Route path="/dms/geographic/countries/add" element={<AddCountry />} />
                                <Route path="/dms/geographic/regions/list" element={<RegionsList />} />
                                <Route path="/dms/geographic/regions/add" element={<AddRegion />} />
                                <Route path="/dms/geographic/districts/list" element={<DistrictsList />} />
                                <Route path="/dms/geographic/districts/add" element={<AddDistrict />} />
                                <Route path="/dms/geographic/tehsils/list" element={<TehsilsList />} />
                                <Route path="/dms/geographic/tehsils/add" element={<AddTehsil />} />
                                <Route path="/dms/geographic/cities/list" element={<CitiesList />} />
                                <Route path="/dms/geographic/cities/add" element={<AddCity />} />
                                <Route path="/dms/geographic/routes/list" element={<RoutesList />} />
                                <Route path="/dms/geographic/routes/add" element={<AddRoute />} />

                                {/* Surveys */}
                                <Route path="/dms/surveys/list" element={<SurveysList />} />
                                <Route path="/dms/surveys/add" element={<AddSurvey />} />
                                <Route path="/dms/surveys/view/:id" element={<ViewSurvey />} />
                                <Route path="/dms/surveys/edit/:id" element={<EditSurvey />} />
                                <Route path="/dms/surveys/fill/:id" element={<FillSurvey />} />
                                <Route path="/dms/surveys/report/:id" element={<SurveyReport />} />

                                {/* Events */}
                                <Route path="/dms/events/list" element={<EventsList />} />
                                <Route path="/dms/events/add" element={<AddEvent />} />
                                <Route path="/dms/events/view/:id" element={<ViewEvent />} />
                                <Route path="/dms/events/edit/:id" element={<EditEvent />} />

                                {/* Campaigns */}
                                <Route path="/dms/campaigns/list" element={<CampaignsList />} />
                                <Route path="/dms/campaigns/add" element={<AddCampaign />} />
                                <Route path="/dms/campaigns/view/:id" element={<ViewCampaign />} />
                                <Route path="/dms/campaigns/edit/:id" element={<EditCampaign />} />

                                {/* Email Template Routes */}
                                <Route path="/dms/email_templates/list" element={<EmailTemplateList />} />
                                <Route path="/dms/email_templates/add" element={<EmailTemplateForm />} />
                                <Route path="/dms/email_templates/edit/:id" element={<EmailTemplateForm />} />

                                {/* Tasks — flat routes for all users */}
                                <Route path="/tasks/list" element={<TasksList />} />
                                <Route path="/tasks/add" element={<AddTask />} />
                                <Route path="/tasks/update/:id" element={<UpdateTask />} />
                                <Route path="/tasks/view/:id" element={<ViewTask />} />
                                <Route path="/tasks/dashboard" element={<TaskReports />} />
                                <Route path="/tasks/reports" element={<Navigate to="/tasks/dashboard" replace />} />
                                <Route path="/tasks/receipt/:id" element={<TaskReceipt />} />
                              </Routes>
                            </main>
                          </div>
                      }
                    />
                        </Routes>
                      </div>
                    </InKindItemsProvider>
                  </SummaryProvider>
                </NotificationProvider>
            </AuthProvider>
            </Router>
            <ToastContainer />
          </React.Fragment>
           );
};

export default App;