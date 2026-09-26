# TailorCraft AI 🚀

An end-to-end, AI-powered automation suite designed to streamline the co-op and internship application process. TailorCraft AI combines a full-stack web dashboard with headless browser automation and Large Language Models (LLMs) to automatically tailor LaTeX resumes to specific job descriptions and asynchronously scrape, score, and rank job leads from university career portals.

![TailorCraft AI UI](https://via.placeholder.com/1000x500.png?text=Add+a+Screenshot+of+your+React+UI+Here)

## 💡 The Problem & The Solution
Applying to hundreds of co-op positions requires tedious, repetitive work: tweaking resume bullet points for ATS systems, writing cover letters, and manually clicking through paginated job boards. 

**TailorCraft** automates the entire pipeline:
1. **The Portal Scanner** navigates behind university SSO firewalls (using Playwright), evaluates hundreds of job descriptions against a candidate's profile using Google Gemini, and outputs a ranked Markdown lead report.
2. **The Resume Tailor** takes a master LaTeX template, scrapes a target job URL, intelligently injects ATS-optimized keywords into the LaTeX source, and natively compiles a merged PDF bundle (Cover Letter + Resume) ready for submission.

## ✨ Key Features
* **Full-Stack Architecture:** A decoupled Vite/React frontend and Python FastAPI backend, demonstrating modern REST API principles and asynchronous task handling.
* **LLM Orchestration:** Integrates Google Gemini Flash models for high-speed, structured text processing, prompt engineering, and applicant-to-job fit scoring.
* **Headless Browser Automation:** Utilizes asynchronous Playwright to bypass Cloudflare/bot-detection, handle Duo 2FA/SSO login states via persistent Chrome contexts, and traverse paginated dynamic tables.
* **Native Document Compilation:** Interfaces directly with local `pdflatex` and `pandoc` binaries via Python `subprocess` to compile code-perfect PDFs on the fly.

## 🛠️ Technology Stack

**Frontend**
* React 18
* Vite
* Tailwind CSS

**Backend & Automation**
* Python 3.11+
* FastAPI & Uvicorn
* Playwright (Async API)
* Google GenAI SDK (Gemini)
* PyPDF (PDF manipulation)

**System Dependencies**
* LaTeX (`pdflatex`)
* Pandoc

## ⚙️ Architecture & Data Flow

1. **Client Request:** User pastes their Master SWE/Data Science LaTeX source into the React UI and provides a target job URL.
2. **Scraping Engine:** FastAPI triggers Playwright to visit the job posting, extracting the raw HTML/text payload.
3. **AI Pipeline:** The scraped text and user's LaTeX templates are packaged into an engineered prompt and sent to the Gemini API. The model determines the best template fit and injects ATS keywords without breaking LaTeX syntax.
4. **Compilation:** The backend saves the generated `.tex` and `.md` files, executes system-level compilers, and merges the outputs into a single PDF.
5. **Delivery:** The final PDF blob is streamed back to the React client and rendered in an interactive iframe.

## 🚀 Local Setup & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Python](https://www.python.org/) (3.11+)
* A local LaTeX distribution (e.g., [MiKTeX](https://miktex.org/) or TeX Live)
* [Pandoc](https://pandoc.org/)
* A Google Gemini API Key

### 1. Clone & Configure
```bash
git clone [https://github.com/AbdulMonamHaroon/tailorcraft-ai.git](https://github.com/AbdulMonamHaroon/tailorcraft-ai.git)
cd tailorcraft-ai

# Create the environment variables file
echo "GEMINI_API_KEY=your_api_key_here" > .env
