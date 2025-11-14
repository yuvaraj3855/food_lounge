import { useEffect, useState } from "react";
import { Navbar } from "../Navbar/navbar";
import { getAllPatients } from "../ApiCalls/patient";

export default function Patient() {

 const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");

  useEffect(() => {
    async function fetchPatients() {
      try {
        const data = await getAllPatients();
        const simplified = data.map((p: any) => ({ id: p.id, name: p.name }));
        setPatients(simplified);

        // Check localStorage for previously selected patient
        const storedPatient = localStorage.getItem("selectedPatient");
        if (storedPatient && simplified.some((p: { id: string; }) => p.id === storedPatient)) {
          setSelectedPatient(storedPatient);
        } else if (simplified.length > 0) {
          setSelectedPatient(simplified[0].id); // default to first patient
          localStorage.setItem("selectedPatient", simplified[0].id);
        }

        console.log("Patients:", simplified);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    }
    fetchPatients();
  }, []);

  // Save selection to localStorage whenever it changes
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPatient(e.target.value);
    localStorage.setItem("selectedPatient", e.target.value);
  };


  // Helper component for the AI Alert box
  const AIAlertBox = () => (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-red-200">    <div className="flex items-center gap-2 text-orange-600 mb-4">
      {/* Warning Icon (Using an emoji/simple icon) */}
      <span className="text-xl">⚠️</span>
      <h3 className="font-semibold text-lg">AI Alerts</h3>
    </div>

      {/* Skipped Tablet Alert (Yellow box with orange border) */}
      <div className="bg-yellow-50 border border-orange-400 p-4 rounded-xl text-sm mb-4">
        <p className="text-gray-700">
          You skipped yesterday's tablet. Please take today's medication on time.
        </p>
      </div>

      {/* Risk Warning Box (Red box with red border) */}
      <div className="bg-red-50 border border-red-400 text-red-800 p-3 rounded-lg text-xs font-medium">
        Skipping this tablet increases heart risk. Stay consistent!
      </div>
    </div>
  );

  // Helper component for the Talk to Doctor section
  const TalkToDoctorBox = () => (
   
<div className="bg-white border border-blue-200 p-6 rounded-2xl shadow-md">
    <div className="flex items-center gap-2 text-blue-700 mb-4">
        {/* Mic Icon/Title, matching the style from the final screenshot */}
        <span className="text-xl">🎙️</span>
        <h3 className="font-semibold text-lg">Talk to Your Doctor</h3>
    </div>

    <p className="text-xs text-gray-500 mb-4">
        Speak in English - Auto-translated to English for doctor
    </p>

    {/* Record Audio Button */}
    <div className="flex flex-col items-center mb-4">
        <button className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-xl hover:bg-blue-600 transition">
            {/* Mic SVG Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-2c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V21h2v-2.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
            </svg>
        </button>
        <p className="text-center text-xs text-gray-600 mt-2 font-medium">
            Record Audio Message
        </p>
    </div>

    {/* Translation Example Box */}
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center gap-2 text-green-600 mb-2">
            <span className="text-xl">🗣️</span>
            <span className="font-medium text-sm">Translation Example</span>
        </div>
        <p className="text-xs text-gray-700 font-medium">
            {/* Corrected text and language/translation formatting to match screenshot */}
            You (English): <span className="font-normal text-blue-700">என் மார்பில் வலி உள்ளது</span>
        </p>
        <div className="text-center text-xs text-blue-500 my-1 font-medium italic">
            — AI Translation —
        </div>
        <p className="text-xs text-gray-700 font-medium">
            Doctor receives (English): <span className="font-normal text-green-700">I have chest pain</span>
        </p>
    </div>

    <button className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-md">
        Send Voice Message
    </button>
</div>
  );

  // Helper component for the Emergency button
  const EmergencyButton = () => (
    <div className="bg-red-50 border border-red-300 p-4 rounded-xl shadow-sm text-center">
      <div className="text-red-500 text-xl font-bold mb-2">
        🔴 SOS - EMERGENCY
      </div>
      <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm font-semibold">
        Press to alert doctor, family, and emergency services
      </button>
    </div>
  );


  return (
    <div>
      <Navbar />

      <div className="min-h-screen bg-gray-50 p-6 sm:p-10 flex flex-col items-center mt-44"> {/* Increased mt for fixed navbar */}
       <div className="">
        <select
            className="bg-white text-black px-3 py-2 rounded border border-gray-300 shadow-sm focus:outline-none cursor-pointer"
            value={selectedPatient}
            onChange={handleSelectChange}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
      </div>

        {/* ===================== WELCOME HEADER (MATCHING SCREENSHOT) ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-10 mb-8 max-w-6xl w-full text-center mt-5">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-3">
            Welcome, {patients.find(p => p.id === selectedPatient)?.name || "Patient"}
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            How are you feeling today?
          </p>
          <button className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-lg border border-blue-300 text-sm font-medium hover:bg-blue-200">
            Language: English
          </button>
        </div>
        {/* ================================================================================= */}


        {/* The existing content starts here. Adjusted the H1/P text below the welcome card. */}
        {/* Removed the original H1 and P that said "Patient Page" and "What would you like to do?" */}


        {/* ===================== TOP CARDS (3x2 GRID) ===================== */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 max-w-6xl w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full"> {/* Removed max-w-6xl here as parent now handles it */}

            {/* Talk to Doctor - Light Blue Card */}
            <div className="rounded-xl p-6 bg-blue-100 hover:bg-blue-100 transition cursor-pointer flex flex-col items-center justify-center text-center shadow-sm">
              <div className="text-blue-500 text-4xl mb-2">📞</div>
              <h2 className="text-xs font-semibold text-blue-700">Talk to Doctor</h2>
            </div>

            {/* Today's Medicines - Light Green Card */}
            <div className="rounded-xl p-6 bg-teal-100 hover:bg-teal-100 transition cursor-pointer flex flex-col items-center justify-center text-center shadow-sm">
              <div className="text-teal-500 text-4xl mb-2">💊</div>
              <h2 className="text-xs font-semibold text-teal-700">Today's Medicines</h2>
            </div>

            {/* Notifications - Light Orange Card */}
            <div className="rounded-xl p-6 bg-amber-50 hover:bg-amber-100 transition cursor-pointer flex flex-col items-center justify-center text-center shadow-sm">
              <div className="text-amber-500 text-4xl mb-2">🔔</div>
              <h2 className="text-xs font-semibold text-amber-700">Notifications</h2>
            </div>

            {/* Emergency Help - Light Red Card */}
            <div className="rounded-xl p-6 bg-red-50 hover:bg-red-100 transition cursor-pointer flex flex-col items-center justify-center text-center shadow-sm">
              <div className="text-red-500 text-4xl mb-2">🚨</div>
              <h2 className="text-xs font-semibold text-red-700">Emergency Help</h2>
            </div>

            {/* Health Summary - Light Green Card */}
            <div className="rounded-xl p-6 bg-green-50 hover:bg-green-100 transition cursor-pointer flex flex-col items-center justify-center text-center shadow-sm">
              <div className="text-green-500 text-4xl mb-2">📈</div>
              <h2 className="text-xs font-semibold text-green-700">Health Summary</h2>
            </div>

            {/* Empty Slot for 3x2 grid */}
            <div className="hidden md:block"></div>
          </div>
        </div>

        {/* ===================== MAIN LAYOUT CONTAINER (2-COLUMN GRID) ===================== */}
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">

          {/* ===================== LEFT COLUMN: MEDICATION SCHEDULE (2/3 width) ===================== */}
          <div className="lg:col-span-2 space-y-8">

            <div className="bg-white shadow-md rounded-2xl p-6">

              <div className="flex items-center gap-2 text-blue-700 font-semibold mb-6">
                <span className="text-xl">💊</span>
                <h2 className="text-xl">Today's Medicines</h2>
              </div>

              {/* ------- Morning Medication ------- */}
              {/* ------- Morning Medication Card (Standalone Card) ------- */}
              <div className="bg-white shadow-md rounded-2xl p-6 pt-4">
                <div className="flex items-center gap-2 mb-4 text-gray-600 font-semibold border-b pb-4">
                  <span className="text-yellow-500 text-xl">☀️</span> Morning Medication
                </div>

                <div className="flex items-start">
                  {/* Medicine Details Column (Left in the layout) */}
                  <div className="order-1 w-3/4">
                    <div className="bg-white">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-base">Furosemide <span className="text-sm font-normal text-gray-600">40mg</span></span>
                        <span className="text-xs text-gray-500 mt-1">Diuretic for heart failure</span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-start gap-2">
                        <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                          Taken
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time Column (Right in the layout) */}
                  <div className="order-2 w-1/4 flex justify-end">
                    <span className="text-xs font-semibold text-green-700 border border-green-300 bg-green-50 px-2 py-0.5 rounded-md">
                      8:00 AM
                    </span>
                  </div>
                </div>
              </div>

              {/* ------- Afternoon Medication ------- */}
              {/* ------- Afternoon Medication Card (Standalone Card) ------- */}
              <div className="bg-white shadow-md rounded-2xl p-6 pt-4 mt-3.5">
                <div className="flex items-center gap-2 mb-4 text-gray-600 font-semibold border-b pb-4">
                  <span className="text-orange-500 text-xl">🌅</span> Afternoon Medication
                </div>

                {/* Expanded JSX for the Metformin card, matching the structure of the MedicationCard component */}
                <div className="flex items-start">
                  {/* Medicine Details Column (Left) */}
                  <div className="order-1 w-3/4">
                    <div className="bg-white">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-base">Metformin <span className="text-sm font-normal text-gray-600">500mg</span></span>
                        <span className="text-xs text-gray-500 mt-1">Blood sugar control</span>
                      </div>

                      {/* Buttons section */}
                      <div className="flex gap-3 text-sm mt-4 pt-3 border-t border-gray-100">
                        <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 font-semibold shadow-sm">
                          I Took It
                        </button>
                        <button className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-100 font-semibold">
                          Remind Me Later (10 min)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Time Column (Right) */}
                  <div className="order-2 w-1/4 flex justify-end">
                    <span className="text-xs font-semibold text-blue-700 border border-blue-300 bg-blue-50 px-2 py-0.5 rounded-md">
                      12:00 PM
                    </span>
                  </div>
                </div>
              </div>

              {/* ------- Night Medication Card (Standalone Card) ------- */}
              <div className="bg-white shadow-md rounded-2xl p-6 pt-4 mt-3.5">
                <div className="flex items-center gap-2 mb-4 text-gray-600 font-semibold border-b pb-4">
                  <span className="text-indigo-500 text-xl">🌙</span> Night Medication
                </div>

                {/* Expanded JSX for the Lisinopril card, matching the structure of the MedicationCard component */}
                <div className="flex items-start">
                  {/* Medicine Details Column (Left) */}
                  <div className="order-1 w-3/4">
                    <div className="bg-white">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-base">Lisinopril <span className="text-sm font-normal text-gray-600">10mg</span></span>
                        <span className="text-xs text-gray-500 mt-1">Blood pressure control</span>
                      </div>

                      {/* Buttons section */}
                      <div className="flex gap-3 text-sm mt-4 pt-3 border-t border-gray-100">
                        <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 font-semibold shadow-sm">
                          I Took It
                        </button>
                        <button className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-100 font-semibold">
                          Remind Me Later (10 min)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Time Column (Right) */}
                  <div className="order-2 w-1/4 flex justify-end">
                    <span className="text-xs font-semibold text-blue-700 border border-blue-300 bg-blue-50 px-2 py-0.5 rounded-md">
                      8:00 PM
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ===================== RIGHT COLUMN: SIDEBAR (1/3 width) ===================== */}
          <div className="lg:col-span-1 space-y-6">

            {/* AI Alerts */}
            <AIAlertBox />

            {/* Talk to Your Doctor */}
            <TalkToDoctorBox />

            {/* Emergency SOS Button */}
            <EmergencyButton />

          </div>
        </div>
      </div>
    </div>
  );
}