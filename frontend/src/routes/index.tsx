import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/pages/Navbar/navbar";
import Patient from "@/pages/Patient/patient";

export const Route = createFileRoute("/")({
component:Patient
});

function Layout() {
  return (
    <div className="min-h-screen w-full bg-gray-100">
      <Navbar />   {/* Always visible */}
      
      <div className="p-6 pt-20">
        <Outlet />  {/* Child routes go here */}
      </div>
    </div>  
  );
}
