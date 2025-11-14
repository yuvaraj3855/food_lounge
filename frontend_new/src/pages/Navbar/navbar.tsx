import { Menu, Globe, Mic, X, Check } from "lucide-react";
import { useCallback, useEffect, useState, type SetStateAction } from "react";
// Assuming 'getAllLanguages' is a function that returns a Promise 
// resolving to the language data object: { data: { languages: [...] } }
import { getAllLanguages } from "../ApiCalls/languages"; 
import { getlanguageselector } from "../ApiCalls/selectedlanguage";

// Define a type/interface for the language object for better type safety
interface Language {
  code: string;
  name: string;
  native_name: string;
}

// --- Language Selector Popup Component ---
function LanguageSelectorPopup({ 
  isOpen, 
  onClose, 
  selectedLanguageCode, 
  onSelectLanguage, 
  languages, // This now comes from Navbar's state
  isLoading, 
  error 
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguageCode: string;
  onSelectLanguage: (code: string) => void;
  languages: Language[] | null; // Can be null while loading
  isLoading: boolean;
  error: string | null;
}) {
  if (!isOpen) return null;

  const handleSelect = (code: string) => {
    onSelectLanguage(code);
    onClose();
  };

  const displayContent = () => {
    if (isLoading) {
      return (
        <p className="p-4 text-center text-gray-500">Loading languages...</p>
      );
    }

    if (error) {
      return (
        <p className="p-4 text-center text-red-500">Error loading languages: {error}</p>
      );
    }
    
    // Check if languages is not null and has items before mapping
    if (languages && languages.length > 0) {
      return languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleSelect(lang.code)}
          className={`
            w-full text-left p-4 rounded-lg flex justify-between items-center transition-colors
            ${selectedLanguageCode === lang.code
              ? 'bg-blue-50 border border-blue-400 text-blue-800' // Selected style
              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800' // Default style
            }
          `}
        >
          <div>
            {/* Use 'native_name' for the local display */}
            <p className="text-lg font-medium">{lang.native_name}</p> 
            {/* Use 'name' for the English Name */}
            <p className="text-sm text-gray-500">{lang.name}</p> 
          </div>
          {selectedLanguageCode === lang.code && (
            <Check size={20} className="text-blue-600" />
          )}
        </button>
      ));
    }

    return (
        <p className="p-4 text-center text-gray-500">No languages available.</p>
    );
  };

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-start pt-20 sm:items-center sm:pt-0">
      
      {/* Modal Container */}
      <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl transition-all duration-300 transform scale-100 opacity-100">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Select Your Language</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Language List */}
        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {displayContent()}
        </div>
      </div>
    </div>
  );
}
// ------------------------------------------


export function Navbar() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  // State for fetched data
  const [languages, setLanguages] = useState<Language[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FIX: Read 'existingdid' once into state in the component scope
  const [existingDid, setExistingDid] = useState<PatientId>(
    () => localStorage.getItem('existingdid')
  );

  // Read 'selectedPatient' directly for immediate use
  const selectedPatient: PatientId = localStorage.getItem('selectedPatient');
    
  getlanguageselector(selectedPatient,selectedLanguage);

  const url = import.meta.env.VITE_API_BASE_URL;
  const NOTIFICATION_STREAM_URL =
  `${url}/patient-notifications/stream/${selectedPatient}`;


// ------------------------------------

/**
 * Text-to-Speech Function using Web Speech API.
 */
const speakContent = useCallback((text: string) => {
  if ('speechSynthesis' in window) {
    // Cancel any current speech before starting a new one
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to set a preferred voice (optional, for better quality)
    const voices = window.speechSynthesis.getVoices();
    const usVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google') || v.default);
    if (usVoice) {
        utterance.voice = usVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  } else {
    console.error("Web Speech API (speechSynthesis) is not supported in this browser.");
  }
}, []);

// --- SSE Event Listener Hook ---
useEffect(() => {
    // FIX: Removed: const existingDid = localStorage.getItem('existingdid');
    // We now rely on the 'existingDid' state variable defined in the outer scope.

    if (!existingDid) {
      console.warn("localStorage item 'existingdid' not found. Notification stream listener is running but cannot filter.");
      // Note: We don't return here to ensure the connection still attempts to open.
    }
    
    // Set up the EventSource connection
    const eventSource = new EventSource(NOTIFICATION_STREAM_URL);
    // setNotificationStatus('Connected'); 
    console.log(5870698, eventSource);

    eventSource.onmessage = (event) => {
      try {
        const notificationData: Notification = JSON.parse(event.data);
        
        if (existingDid && notificationData.patientId === existingDid) {
          console.log(`✅ MATCH: Notification for patient ${existingDid} processed.`);
          
          const speechText = `New alert for patient ${notificationData.patientId}. Type: ${notificationData.type}. Message: ${notificationData.message}`;
          speakContent(speechText);
        } else {
            console.log(`❌ Notification received for different patient ID: ${notificationData.patientId}. Local ID: ${existingDid}`);
        }
      } catch (e) {
        console.error("Error processing SSE event data:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource encountered an error:', error);
      // setNotificationStatus('Error');
      eventSource.close();
    };
    
    eventSource.onopen = () => {
        // setNotificationStatus('Connected');
        console.log('Connection to notification stream opened successfully.');
    };

    // Cleanup: close the connection and stop speech synthesis
    return () => {
      // setNotificationStatus('Closed');
      eventSource.close();
      window.speechSynthesis.cancel();
    };
    
// FIX: existingDid is now correctly defined in the outer scope and used as a dependency
}, [existingDid, speakContent, NOTIFICATION_STREAM_URL]); 


  // Function to fetch data on component mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try { 
        setIsLoading(true);
        setError(null);
        // Note: The original file had a relative import for this function
        const response = await getAllLanguages(); 
        setLanguages(response.languages); 
      } catch (err) {
        console.error("Failed to fetch languages:", err);
        setError('Failed to load languages.');
        setLanguages(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, []); // Empty dependency array means this runs only once on mount

  
  // Helper function to get the name for the button display, using fetched data
  const getLanguageName = (code: string) => {
    if (!languages) return 'English';
    const lang = languages.find(l => l.code === code);
    // Fallback to the code or a default if not found
    return lang ? lang.name : 'English'; 
  };


  // Function to handle language selection
  const handleLanguageSelect = (code: SetStateAction<string>) => {
    setSelectedLanguage(code);
  };


  // Calculate the language count (using 0 as a default while loading)
  const languageCount = languages?.length ?? 0;

  return (
    <>
      {/* The main container for the fixed blue bar */}
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-b from-[#3b82F6] to-[#1E40AF] text-white z-50 shadow-lg font-inter">

        {/* Top Bar Section */}
        <div className="flex justify-between items-center h-20 px-4 sm:px-8">

          {/* Left Section: Menu Icon and App Title */}
          <div className="flex items-center gap-4">
            <Menu size={24} className="cursor-pointer hover:text-blue-200 transition" />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold">MediCare AI Monitor</h1>
              <p className="text-sm font-light text-blue-200">Heart & Diabetes Medication Tracking</p>
            </div>
          </div>

          {/* Right Section: Language Selection */}
          <div className="flex items-center gap-4">

            {/* Text Stack: Select Language / Language Count */}
            <div className="flex flex-col items-end text-sm hidden sm:flex">
              <p className="font-normal leading-tight text-white">Select Your Language</p>
              <span className="text-xs font-light text-blue-200 leading-tight">
                {/* Dynamically display the count */}
                {languageCount} Languages Available
              </span>
            </div>

            {/* Language Selection Button (Now opens the popup) */}
            <button 
              onClick={() => setIsPopupOpen(true)}
              className="bg-white/5
              text-white font-medium py-2 px-4 rounded-lg flex items-center gap-1
              transition-colors border border-white/50 shadow-md hover:bg-white/10"
            >
              <Globe size={18} />
              {getLanguageName(selectedLanguage)} {/* Display the selected language */}
            </button>
          </div>
        </div>
        
        {/* --- Feature Cards Section --- */}
        <div className="flex flex-col md:flex-row justify-around items-stretch gap-2 sm:gap-4 px-4 sm:px-8 pb-4 sm:pb-8 pt-4 -mt-3">
          
          {/* Card 1: Language Support - Dynamic Count */}
          <div className="flex items-start p-3 sm:p-4 rounded-xl bg-white/5 w-full md:w-1/3 min-h-[80px] cursor-pointer transition-colors shadow-xl border border-white/20 hover:bg-white/10">
            <Globe size={24} className="mr-3 mt-1 flex-shrink-0" />
            <div className="flex flex-col items-start"> 
              <p className="text-sm sm:text-base font-semibold leading-snug">{languageCount}-Language Support</p>
              <p className="text-xs sm:text-sm font-light text-blue-200 leading-snug">Real-time translation</p>
            </div>
          </div>

          {/* Card 2: Voice Communication */}
          <div className="flex items-start p-3 sm:p-4 rounded-xl bg-white/5 w-full md:w-1/3 min-h-[80px] cursor-pointer transition-colors shadow-xl border border-white/20 hover:bg-white/10">
            <Mic size={24} className="mr-3 mt-1 flex-shrink-0" />
            <div className="flex flex-col items-start"> 
              <p className="text-sm sm:text-base font-semibold leading-snug">Voice Communication</p>
              <p className="text-xs sm:text-sm font-light text-blue-200 leading-snug">Audio translation both ways</p>
            </div>
          </div>

          {/* Card 3: AI Monitoring */}
          <div className="flex items-start p-3 sm:p-4 rounded-xl bg-white/5 w-full md:w-1/3 min-h-[80px] cursor-pointer transition-colors shadow-xl border border-white/20 hover:bg-white/10">
            <Menu size={24} className="mr-3 mt-1 flex-shrink-0" />
            <div className="flex flex-col items-start"> 
              <p className="text-sm sm:text-base font-semibold leading-snug">AI Monitoring</p>
              <p className="text-xs sm:text-sm font-light text-blue-200 leading-snug">24/7 health tracking</p>
            </div>
          </div>

        </div>

      </nav>

      {/* Language Selector Popup Component */}
      <LanguageSelectorPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        selectedLanguageCode={selectedLanguage}
        onSelectLanguage={handleLanguageSelect}
        // Pass the fetched data and states to the popup
        languages={languages}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}