import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Search,
  CheckCircle2,
  Loader2,
  Trash2,
  Building2,
  Briefcase,
  Download,
  Terminal,
  ExternalLink,
  Radar,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Layers,
  Flame,
  FileCode2,
  Cpu
} from 'lucide-react';

// Pre-seeded initial master resumes for immediate interactivity
const INITIAL_MASTER_RESUMES = [
  {
    id: 'res-1',
    name: 'Master_Software_Engineer_2026.tex',
    size: '18.4 KB',
    type: 'tex',
    uploadedAt: 'Just now'
  },
  {
    id: 'res-2',
    name: 'Master_ML_Systems_Quant.pdf',
    size: '142.1 KB',
    type: 'pdf',
    uploadedAt: 'Just now'
  }
];

// Initial mock job matches populated after portal scan
const MOCK_SCANNED_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Distributed Systems Engineer',
    company: 'Anthropic',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    matchScore: 98,
    rationale: 'Direct 1:1 match with your master resume’s concurrent telemetry pipelines, high-throughput Go/Python microservices, and low-latency API architecture.',
    keySkills: ['Distributed Systems', 'Python / Go', 'Kubernetes', 'High Concurrency'],
    salary: '$195k – $245k + Equity',
    postedTime: '2h ago'
  },
  {
    id: 'job-2',
    title: 'AI Infrastructure & Tooling Engineer',
    company: 'OpenAI',
    location: 'Remote (US/Canada)',
    type: 'Full-time',
    matchScore: 95,
    rationale: 'Extracted profile emphasizes autonomous agent workflows, React frontend tooling, and PyTorch fine-tuning which directly aligns with their SDK team.',
    keySkills: ['PyTorch', 'React / TypeScript', 'Vector DBs', 'Agent Architecture'],
    salary: '$180k – $230k + Equity',
    postedTime: '4h ago'
  },
  {
    id: 'job-3',
    title: 'Full Stack Founding Engineer',
    company: 'Cognition Labs (Devin)',
    location: 'New York, NY (On-site)',
    type: 'Full-time',
    matchScore: 92,
    rationale: 'Seamless crossover with your full-stack master profile, robust LaTeX compilation pipelines, and sandbox orchestration benchmarks.',
    keySkills: ['TypeScript', 'FastAPI', 'Docker', 'Compiler Design'],
    salary: '$175k – $220k + Equity',
    postedTime: '1d ago'
  },
  {
    id: 'job-4',
    title: 'Applied Machine Learning Platform Engineer',
    company: 'Scale AI',
    location: 'San Francisco, CA',
    type: 'Full-time',
    matchScore: 88,
    rationale: 'Complements your quantitative modeling coursework and your dual master resumes in algorithmic data processing and scalable cloud deployments.',
    keySkills: ['Python', 'Data Engineering', 'AWS / GCP', 'Redis'],
    salary: '$165k – $210k + Equity',
    postedTime: '2d ago'
  }
];

// Rotating scan stages for immersive portal scanning
const SCAN_STAGES = [
  'Scraping portal...',
  'Saving descriptions...',
  'Cross-referencing skills...',
  'Ranking matches...'
];

// Rotating application generation stages
const GENERATION_STAGES = [
  'Injecting ATS keywords...',
  'Drafting Cover Letter...',
  'Compiling LaTeX...'
];

export default function App() {
  // Master Resumes State
  const [resumes, setResumes] = useState(INITIAL_MASTER_RESUMES);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Portal Scanner State
  const [portalUrl, setPortalUrl] = useState('https://boards.greenhouse.io/anthropic/jobs');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStageIndex, setScanStageIndex] = useState(0);
  const [scanCompleted, setScanCompleted] = useState(false);

  // Job Matches State
  const [jobs, setJobs] = useState(MOCK_SCANNED_JOBS);

  // Per-job generation tracking: { [jobId]: { status: 'idle' | 'generating' | 'downloaded', stageIndex: 0 } }
  const [generatingStates, setGeneratingStates] = useState({});

  // Trigger file download helper
  const triggerDownload = (filename, content, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(Array.from(e.target.files));
    }
  };

  const handleFilesAdded = (newFiles) => {
    // Only accept .tex or .pdf resumes
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'tex' || ext === 'pdf';
    });

    if (validFiles.length === 0) return;

    const formatted = validFiles.map((file, idx) => ({
      id: `custom-res-${Date.now()}-${idx}`,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.name.endsWith('.tex') ? 'tex' : 'pdf',
      uploadedAt: 'Just now'
    }));

    setResumes(prev => [...prev, ...formatted]);
  };

  const removeResume = (id) => {
    setResumes(prev => prev.filter(r => r.id !== id));
  };

  // Portal Scan Handler
  const handleStartScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStageIndex(0);
    setScanCompleted(false);

    // Step through scan stages sequentially
    const stageDuration = 900;
    SCAN_STAGES.forEach((_, idx) => {
      setTimeout(() => {
        setScanStageIndex(idx);
      }, idx * stageDuration);
    });

    // Complete scan
    setTimeout(() => {
      setIsScanning(false);
      setScanCompleted(true);
    }, SCAN_STAGES.length * stageDuration + 400);
  };

  // Inline Application Generator & Auto-Downloader
  const handleGenerateApplication = (job) => {
    // Set this specific job card to generating
    setGeneratingStates(prev => ({
      ...prev,
      [job.id]: { status: 'generating', stageIndex: 0 }
    }));

    const stageDuration = 950;
    GENERATION_STAGES.forEach((_, idx) => {
      setTimeout(() => {
        setGeneratingStates(prev => {
          if (prev[job.id]?.status === 'generating') {
            return {
              ...prev,
              [job.id]: { status: 'generating', stageIndex: idx }
            };
          }
          return prev;
        });
      }, idx * stageDuration);
    });

    // Final trigger: Auto-download individual files directly (No bundling)
    const totalDuration = GENERATION_STAGES.length * stageDuration + 500;
    setTimeout(() => {
      // 1. Generate & Trigger Local Download of Tailored Resume (.tex)
      const tailoredResumeLatex = `% ========================================================
% TailorCraft AI Generated Resume
% Target Company: ${job.company}
% Target Role:    ${job.title}
% ATS Match Score: ${job.matchScore}%
% Generated:      ${new Date().toLocaleDateString()}
% ========================================================
\\documentclass[letterpaper,10pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}

\\begin{document}
\\begin{center}
    \\textbf{\\Huge \\scshape Candidate Profile} \\\\ \\vspace{1pt}
    \\small +1 (555) 019-2834 $|$ \\href{mailto:applicant@domain.com}{applicant@domain.com} $|$ 
    \\href{https://linkedin.com/in/profile}{linkedin.com/in/profile} $|$
    \\href{https://github.com/profile}{github.com/profile}
\\end{center}

\\section{Professional Summary}
Engineered specifically for the \\textbf{${job.title}} opening at \\textbf{${job.company}}. 
Highlighting core competencies in ${job.keySkills.join(', ')}.

\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Core Competencies}{: ${job.keySkills.join(', ')}, Systems Architecture} \\\\
     \\textbf{Languages}{: Python, TypeScript, Go, C++, SQL, LaTeX} \\\\
     \\textbf{Cloud \\& Platforms}{: Docker, Kubernetes, AWS, PostgreSQL, Redis, CI/CD}
    }}
\\end{itemize}

\\section{Targeted Experience}
\\textbf{Lead Software Engineer} \\hfill 2023 -- Present \\\\
\\textit{Core Platform Infrastructure} \\hfill Remote
\\begin{itemize}
    \\item Architected high-throughput pipelines with 99.99\\% uptime for high-traffic microservices.
    \\item Optimized cross-service querying, cutting p99 tail latency by 42\\%.
    \\item Tailored alignment verified for ${job.company} automated ATS pipeline.
\\end{itemize}

\\end{document}`;

      triggerDownload(
        `${job.company.replace(/[^a-zA-Z0-9]/g, '_')}_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}_Tailored_Resume.tex`,
        tailoredResumeLatex,
        'application/x-tex'
      );

      // 2. Generate & Trigger Local Download of Tailored Cover Letter (directly separate, no bundle toggle)
      const tailoredCoverLetter = `Dear Hiring Team at ${job.company},

I am writing to express my strong enthusiasm for the ${job.title} position at ${job.company}. 

Having developed scalable infrastructure and robust engineering solutions across distributed microservices, my background directly mirrors the qualifications you are seeking. In reviewing ${job.company}'s mission, I was especially compelled by your innovative developments in this sector.

Key highlights of how my extracted master qualifications align with this role:
• Core Mastery: In-depth experience in ${job.keySkills.join(', ')}.
• Proven Impact: ${job.rationale}
• Adaptability: Rapid iteration from proof-of-concept into high-availability production deployment.

I welcome the opportunity to discuss how my technical acumen can deliver immediate value to ${job.company}. Thank you for your time and consideration.

Sincerely,
Candidate Profile
applicant@domain.com
`;

      // Slight staggered delay for crisp multi-file download experience
      setTimeout(() => {
        triggerDownload(
          `${job.company.replace(/[^a-zA-Z0-9]/g, '_')}_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}_Cover_Letter.txt`,
          tailoredCoverLetter,
          'text/plain'
        );
      }, 350);

      // Update state to green Downloaded! checkmark
      setGeneratingStates(prev => ({
        ...prev,
        [job.id]: { status: 'downloaded', stageIndex: 0 }
      }));
    }, totalDuration);
  };

  return (
    <div className="min-h-screen bg-[#070311] text-slate-100 relative overflow-x-hidden font-sans selection:bg-purple-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-900/25 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-40 w-[550px] h-[550px] bg-fuchsia-950/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 w-[700px] h-[450px] bg-indigo-950/25 rounded-full blur-[180px]" />
        {/* Subtle grid mesh overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '36px 36px' 
          }} 
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Branding */}
        <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.07]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium uppercase tracking-widest mb-3 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Autonomous Job Radar & LaTeX Tailoring</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
              TailorCraft <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent font-mono">AI</span>
            </h1>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
              Scan job portals, cross-reference your master LaTeX & PDF resumes, and generate 
              ATS-optimized applications with instant single-click downloads.
            </p>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Engine Status</div>
                <div className="text-xs font-mono font-medium text-emerald-300">Neural Model Active</div>
              </div>
            </div>
          </div>
        </header>

        {/* Top Grid: Master Resumes & Profile Extraction + Scanner Input */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* Component 1: Resume Upload & Profile Extraction (5 Cols) */}
          <section className="lg:col-span-5 flex flex-col">
            <div className="h-full rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 flex flex-col hover:border-purple-500/20 transition-all duration-300">
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <FileCode2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Master Resumes</h2>
                    <p className="text-xs text-slate-400">Profile & Skill Extraction Engine</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-purple-950/60 border border-purple-800/40 text-purple-300">
                  {resumes.length} Synced
                </span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                  isDragging 
                    ? 'border-purple-400 bg-purple-500/15 shadow-[0_0_20px_rgba(168,85,247,0.25)]' 
                    : 'border-white/10 hover:border-purple-500/40 bg-white/[0.015] hover:bg-white/[0.03]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".tex,.pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="p-3 rounded-full bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <UploadCloud className="w-6 h-6 animate-bounce" />
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-200">
                    Drop Master Resumes here, or <span className="text-purple-400 underline underline-offset-2">browse</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Accepts master .tex or .pdf documents
                  </div>
                </div>

                {/* Clear Subtext explaining AI extraction without transcripts */}
                <div className="mt-2 text-xs text-purple-200/80 bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-800/30 leading-snug">
                  <span className="font-semibold text-purple-300">AI Profile Engine:</span> Analyzes project experiences, tech stacks, and domain masteries from your resumes to map against target portals.
                </div>
              </div>

              {/* Uploaded File List */}
              <div className="mt-4 space-y-2 flex-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {resumes.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 italic border border-white/5 rounded-lg">
                    No master resumes uploaded yet. Upload .tex or .pdf to extract your profile.
                  </div>
                ) : (
                  resumes.map((file) => (
                    <div
                      key={file.id}
                      className="group flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded text-xs font-mono font-bold uppercase ${
                          file.type === 'tex' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {file.type}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate group-hover:text-purple-300 transition-colors">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {file.size} • {file.uploadedAt}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeResume(file.id);
                        }}
                        className="opacity-60 hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                        title="Remove resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Extracted Core Profile Intelligence Badge */}
              <div className="mt-4 pt-4 border-t border-white/[0.07]">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> Extracted Core Profile
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Active & Indexed
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Distributed Systems', 'Python / PyTorch', 'Full-Stack React', 'FastAPI', 'LaTeX Architecture', 'Docker / K8s'].map((pill, i) => (
                    <span 
                      key={i}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-200 border border-purple-800/30"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* Component 2: Portal Scanner Input (7 Cols) */}
          <section className="lg:col-span-7 flex flex-col justify-between">
            <div className="h-full rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300">
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Radar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Job Portal Scanner</h2>
                      <p className="text-xs text-slate-400">Deep career board crawler & match intelligence</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-purple-300/80 bg-purple-950/40 px-3 py-1 rounded-full border border-purple-800/30 font-mono">
                    <Zap className="w-3.5 h-3.5 text-purple-400" /> Auto-ATS Matcher
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Job Portal or Company Careers URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Search className="w-4 h-4 text-purple-400" />
                      </div>
                      <input
                        type="url"
                        value={portalUrl}
                        onChange={(e) => setPortalUrl(e.target.value)}
                        placeholder="https://boards.greenhouse.io/company or workday portal..."
                        disabled={isScanning}
                        className="w-full bg-[#0d071d]/80 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all shadow-inner disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Portal Quick Presets */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                    <span className="text-[11px] font-mono text-slate-500">Quick Portal:</span>
                    {[
                      { label: 'Anthropic Jobs', url: 'https://boards.greenhouse.io/anthropic/jobs' },
                      { label: 'OpenAI Careers', url: 'https://jobs.lever.co/openai' },
                      { label: 'York U Co-op', url: 'https://experience.yorku.ca/jobs.htm' }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPortalUrl(preset.url)}
                        disabled={isScanning}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/40 hover:text-purple-300 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Scan Portal Action Button with Glow */}
                  <button
                    onClick={handleStartScan}
                    disabled={isScanning || !portalUrl.trim()}
                    className={`w-full group relative overflow-hidden rounded-xl py-3.5 px-6 font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg ${
                      isScanning
                        ? 'bg-purple-900/60 border border-purple-500/40 text-purple-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] border border-purple-400/30'
                    }`}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                        <span>Radar Active & Crawling...</span>
                      </>
                    ) : (
                      <>
                        <Radar className="w-4 h-4 text-purple-200 group-hover:rotate-45 transition-transform duration-300" />
                        <span>Scan Portal for Matches</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Immersive Loading State or Scanner Status Display */}
              <div className="mt-5">
                {isScanning ? (
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 backdrop-blur-md relative overflow-hidden">
                    {/* Glowing Scanline Animation */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" />
                    
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-purple-600/20 border border-purple-400/40 shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                        <Loader2 className="w-6 h-6 text-purple-300 animate-spin" />
                        <span className="absolute w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs uppercase tracking-widest font-mono text-purple-300 font-semibold">
                            Autonomous Scanner Processing
                          </span>
                          <span className="text-xs font-mono text-fuchsia-300 font-bold">
                            Step {scanStageIndex + 1} of {SCAN_STAGES.length}
                          </span>
                        </div>

                        {/* Rotating Text Display */}
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                          <span className="tracking-wide animate-fade-in font-mono text-purple-100">
                            {SCAN_STAGES[scanStageIndex]}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-400 h-full transition-all duration-700 ease-out"
                            style={{ width: `${((scanStageIndex + 1) / SCAN_STAGES.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : scanCompleted ? (
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Portal indexed successfully! {jobs.length} tailored opportunities scored.</span>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                      100% Synced
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-purple-400" />
                      Paste any greenhouse, lever, workday or company portal to begin deep AI matching.
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">Ready</span>
                  </div>
                )}
              </div>

            </div>
          </section>

        </div>

        {/* Component 3 & 4: AI Match Results List & One-Click Inline Generation */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  AI Job Match Results
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300">
                  {jobs.length} Matches Found
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Ranked by semantic vector alignment between your Master Resumes and crawled job specifications.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Independent direct generation & auto-download enabled</span>
            </div>
          </div>

          {/* Job Match Cards List */}
          <div className="space-y-4">
            {jobs.map((job) => {
              const state = generatingStates[job.id] || { status: 'idle', stageIndex: 0 };
              const isGenerating = state.status === 'generating';
              const isDownloaded = state.status === 'downloaded';

              return (
                <div
                  key={job.id}
                  className={`rounded-2xl bg-white/[0.03] backdrop-blur-xl border transition-all duration-300 p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] ${
                    isDownloaded
                      ? 'border-emerald-500/30 bg-emerald-950/[0.04]'
                      : isGenerating
                      ? 'border-purple-500/50 bg-purple-950/[0.1] shadow-[0_0_30px_rgba(168,85,247,0.15)]'
                      : 'border-white/[0.08] hover:border-purple-500/30 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Left: Job Info & Match Score */}
                    <div className="space-y-3 flex-1 min-w-0">
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Match Score Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-400/40 text-purple-200 text-xs font-mono font-bold shadow-[0_0_12px_rgba(168,85,247,0.25)]">
                          <Flame className="w-3.5 h-3.5 text-fuchsia-400" />
                          <span>{job.matchScore}% Match Score</span>
                        </div>

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-purple-400" />
                          <span className="font-semibold text-slate-200">{job.company}</span>
                        </span>

                        <span className="text-xs text-slate-500">•</span>

                        <span className="text-xs text-slate-400">
                          {job.location}
                        </span>

                        <span className="text-xs text-slate-500">•</span>

                        <span className="text-xs text-slate-400 font-mono">
                          {job.salary}
                        </span>
                      </div>

                      {/* Job Title */}
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                          {job.title}
                        </h3>
                      </div>

                      {/* 1-Sentence Rationale of why it fits their extracted profile */}
                      <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                        <span className="text-purple-400 font-semibold">AI Match Rationale: </span>
                        {job.rationale}
                      </p>

                      {/* Key Skills Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-mono text-slate-500 mr-1">Overlapping Competencies:</span>
                        {job.keySkills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                    </div>

                    {/* Right: Inline Generation & Auto-Download Action */}
                    <div className="lg:w-72 shrink-0 flex flex-col justify-center">
                      
                      {/* Inline Loading / Generation State */}
                      {isGenerating ? (
                        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 backdrop-blur-md space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-purple-300 font-medium">Generating Application</span>
                            <span className="text-[11px] font-mono text-fuchsia-300 font-bold">
                              {state.stageIndex + 1}/{GENERATION_STAGES.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-semibold text-white">
                            <Loader2 className="w-4 h-4 text-purple-300 animate-spin shrink-0" />
                            <span className="font-mono text-purple-100 truncate">
                              {GENERATION_STAGES[state.stageIndex]}
                            </span>
                          </div>

                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-purple-400 to-fuchsia-400 h-full transition-all duration-700 ease-out"
                              style={{ width: `${((state.stageIndex + 1) / GENERATION_STAGES.length) * 100}%` }}
                            />
                          </div>

                          <p className="text-[10px] text-slate-400 font-mono text-center">
                            Preparing files for immediate download...
                          </p>
                        </div>
                      ) : isDownloaded ? (
                        /* Green Downloaded! Success State */
                        <div className="space-y-2">
                          <button
                            onClick={() => handleGenerateApplication(job)}
                            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Downloaded!</span>
                          </button>
                          
                          <div className="text-[11px] text-slate-400 font-mono text-center flex items-center justify-center gap-1.5">
                            <Download className="w-3 h-3 text-emerald-400" />
                            <span>Resume (.tex) & Cover Letter saved locally</span>
                          </div>
                        </div>
                      ) : (
                        /* Initial Generate Application Button */
                        <button
                          onClick={() => handleGenerateApplication(job)}
                          className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] border border-purple-400/30 group"
                        >
                          <Sparkles className="w-4 h-4 text-purple-200 group-hover:scale-110 transition-transform" />
                          <span>Generate Application</span>
                        </button>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer Note */}
        <footer className="mt-16 text-center text-xs text-slate-500 font-mono pb-6">
          <p>TailorCraft AI Engine • Direct LaTeX & Cover Letter Synthesis • Master Profile Extraction</p>
        </footer>

      </div>
    </div>
  );
}
