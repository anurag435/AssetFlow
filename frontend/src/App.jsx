import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import OrganizationSetup from "./components/Organization_setup";
import Assets from "./components/Assets";
import AllocationTransfer from "./components/Allocation&Transfer";
import ResourceBooking from "./components/Resource_booking";
import Maintenance from "./components/Maintenance";
import Audit from "./components/Audit";
import Reports from "./components/Reports";
import Notifications from "./components/Notifications";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/organization-setup" element={<OrganizationSetup />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/allocation-transfer" element={<AllocationTransfer />} />
        <Route path="/resource-booking" element={<ResourceBooking />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;