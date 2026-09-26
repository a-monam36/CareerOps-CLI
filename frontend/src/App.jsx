import { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('tailor');
  
  // Tailor State
  const [tailorData, setTailorData] = useState({ 
    url: '', 
    company: '', 
    merge: true,
    swe_latex: '% Paste your Software Engineering Master Resume LaTeX here...\n\\documentclass{article}\n\\begin{document}\n\n\\end{document}',
    ds_latex: '% Paste your Data Science/Quant Master Resume LaTeX here...\n\\documentclass{article}\n\\begin{document}\n\n\\end{document}'
  });
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // Scan State
  const [scanData, setScanData] = useState({ 
    url: 'https://experience.yorku.ca/myAccount/co-opProgram/centralcoop/jobs.htm', 
    pages: 3 
  });
  const [scanReport, setScanReport] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleTailor = async () => {
    setIsCompiling(true);
    try {
      const response = await fetch('http://localhost:8000/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tailorData)
      });
      const blob = await response.blob();
      setPdfUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Failed to compile', error);
    }
    setIsCompiling(false);
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanReport("Starting browser... Please check your terminal/popup to complete Passport York 2FA if required.");
    try {
      const response = await fetch('http://localhost:8000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanData)
      });
      const data = await response.json();
      setScanReport(data.report);
    } catch (error) {
      console.error('Failed to scan', error);
      setScanReport("Scan failed. Check terminal backend logs.");
    }
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex gap-8">
      {/* Control Panel */}
      <div className="w-1/3 bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-emerald-400">TailorCraft AI</h1>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 pb-2 shrink-0">
          <button 
            onClick={() => setActiveTab('tailor')} 
            className={`px-4 py-2 rounded font-medium transition-colors ${activeTab === 'tailor' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tailor Application
          </button>
          <button 
            onClick={() => setActiveTab('scan')} 
            className={`px-4 py-2 rounded font-medium transition-colors ${activeTab === 'scan' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Portal Scanner
          </button>
        </div>

        {/* Tailor View */}
        {activeTab === 'tailor' && (
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm mb-1 font-medium text-slate-300">Company Name</label>
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:border-emerald-400 outline-none transition-colors" 
                value={tailorData.company} 
                onChange={e => setTailorData({...tailorData, company: e.target.value})} 
                placeholder="e.g. Google" 
              />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-slate-300">Job URL</label>
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:border-emerald-400 outline-none transition-colors" 
                value={tailorData.url} 
                onChange={e => setTailorData({...tailorData, url: e.target.value})} 
                placeholder="https://..." 
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1 font-medium text-emerald-400 mt-4">Master SWE LaTeX</label>
              <textarea 
                className="w-full h-40 bg-slate-900 border border-slate-700 rounded p-2 focus:border-emerald-400 outline-none font-mono text-xs text-slate-300 whitespace-pre" 
                value={tailorData.swe_latex} 
                onChange={e => setTailorData({...tailorData, swe_latex: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-blue-400 mt-2">Master Data Science LaTeX</label>
              <textarea 
                className="w-full h-40 bg-slate-900 border border-slate-700 rounded p-2 focus:border-blue-400 outline-none font-mono text-xs text-slate-300 whitespace-pre" 
                value={tailorData.ds_latex} 
                onChange={e => setTailorData({...tailorData, ds_latex: e.target.value})} 
              />
            </div>

            <button 
              onClick={handleTailor} 
              disabled={isCompiling} 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-3 rounded mt-6 shrink-0 transition-colors disabled:opacity-50"
            >
              {isCompiling ? 'Scraping & Compiling...' : 'Generate PDF Bundle'}
            </button>
          </div>
        )}

        {/* Scan View */}
        {activeTab === 'scan' && (
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded text-sm text-amber-400 mb-2">
              <strong className="block mb-1">Action Required:</strong>
              When you click Start, a Chrome window will open. You have 60 seconds to complete Passport York 2FA before the automated scan begins.
            </div>
            
            <div>
              <label className="block text-sm mb-1 font-medium text-slate-300">Portal URL</label>
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs focus:border-blue-400 outline-none" 
                value={scanData.url} 
                onChange={e => setScanData({...scanData, url: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-slate-300">Pages to Scan</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:border-blue-400 outline-none" 
                value={scanData.pages} 
                onChange={e => setScanData({...scanData, pages: parseInt(e.target.value)})} 
                min="1"
                max="20"
              />
            </div>
            <button 
              onClick={handleScan} 
              disabled={isScanning} 
              className="w-full bg-blue-500 hover:bg-blue-600 text-slate-900 font-bold py-3 rounded mt-6 transition-colors disabled:opacity-50"
            >
              {isScanning ? 'Navigating & Scoring...' : 'Start Auto-Scan'}
            </button>
          </div>
        )}
      </div>

      {/* Output / Preview Panel */}
      <div className="w-2/3 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden p-2 shadow-2xl">
        {activeTab === 'tailor' ? (
          pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full rounded" title="Compiled Resume PDF" />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded">
              Fill out the form and click Generate to compile your PDF
            </div>
          )
        ) : (
          scanReport ? (
             <div className="h-full overflow-auto bg-slate-900 p-6 rounded text-slate-300 font-mono text-sm whitespace-pre-wrap">
               {scanReport}
             </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded">
              Run a scan to generate your job leads report
            </div>
          )
        )}
      </div>
    </div>
  );
}