<div align="center">

# 🚀 CareerOps-CLI
**AI-Powered Job Application & Portal Automation Suite**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Playwright](https://img.shields.io/badge/Playwright-Async-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Gemini](https://img.shields.io/badge/Gemini-Flash_Models-8E75B2?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![LaTeX](https://img.shields.io/badge/LaTeX-pdflatex-008080?style=flat-square&logo=latex&logoColor=white)](https://www.latex-project.org/)

An end-to-end full-stack platform designed to eliminate the friction of co-op and internship hunting. CareerOps features a stunning dark-mode glassmorphism UI, headless browser portal scraping, and LLM-driven ATS optimization to instantly generate perfectly tailored LaTeX resumes and cover letters in a single click.



https://github.com/user-attachments/assets/8613d63a-6817-47be-b7bd-e48900b5acf2


</div>

---

## ✨ Features

* 🧠 **Smart Profile Extraction** — Upload your Master Resumes (SWE/Data Science) and let the AI automatically extract your core competencies, tech stack, and experience.
* 🕷️ **Deep Portal Scanning** — Paste a university portal link. Async Playwright bypasses SSO/Cloudflare walls, navigates paginated tables, and scrapes hundreds of job descriptions in the background.
* 🎯 **Semantic Match Engine** — Evaluates each scraped job against your profile, ranking them by fit with a 1-10 score and a one-sentence rationale. 
* ✍️ **Dynamic ATS Injection** — Rewrites your LaTeX resume bullet points to seamlessly integrate keywords from the job description without breaking markup syntax.
* ⚡ **One-Click Generation** — Review your ranked job leads directly in the UI. Click "Generate" to draft a tailored cover letter, compile both PDFs via local `pdflatex`, and automatically trigger a download to your local machine.

---

## 🛠️ Architecture & Tech Stack

### Frontend (User Interface)
* **Framework:** React + Vite
* **Styling:** Tailwind CSS (Deep purple-to-black gradients, premium glassmorphism, Lucide icons)
* **State Management:** React Hooks (`useState`, `useEffect`)

### Backend (Automation & AI)
* **Server:** Python / FastAPI
* **Scraping:** Playwright (Async, Persistent Chrome Contexts for 2FA handling)
* **LLM Engine:** Google GenAI SDK (Gemini 2.5/3.7 Flash)
* **Document Compilation:** `subprocess` bridging to `pdflatex` and `pandoc`

---

## 🚀 Quick Start

### Prerequisites
1. **Node.js** (v18+) and **Python** (3.11+)
2. **Local LaTeX Distribution** (e.g., MiKTeX or TeX Live installed and added to PATH)
3. **Pandoc** (Installed and added to PATH)
4. **Google Gemini API Key**

### 1. Clone & Configure
```bash
git clone [https://github.com/a-monam36/CareerOps-CLI.git](https://github.com/a-monam36/CareerOps-CLI.git)
cd CareerOps-CLI

# Create the environment variables file in the root directory
echo "GEMINI_API_KEY=your_api_key_here" > .env
