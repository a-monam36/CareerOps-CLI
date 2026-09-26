import os
import subprocess
from datetime import datetime
from playwright.async_api import async_playwright
from google import genai
from pypdf import PdfWriter
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

async def scrape_job(url):
    async with async_playwright() as p:
        user_data_dir = os.path.join(os.getcwd(), "chrome_session")
        context = await p.chromium.launch_persistent_context(
            user_data_dir, headless=True, channel="chrome",
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0] if len(context.pages) > 0 else await context.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        content = "--- PORTAL JOB DESCRIPTION ---\n" + await page.inner_text("body")
        links = await page.evaluate("Array.from(document.querySelectorAll('a')).map(a => ({text: a.innerText.toLowerCase(), href: a.href}))")
        
        external_url = next((link['href'] for link in links if link['href'].startswith('http') and 'experience.yorku.ca' not in link['href'] and 'passport.yorku.ca' not in link['href'] and any(kw in link['text'] for kw in ['apply', 'website', 'external', 'view'])), None)
        
        if external_url:
            try:
                await page.goto(external_url, wait_until="domcontentloaded", timeout=20000)
                content += "\n\n--- COMPANY WEBSITE JOB DESCRIPTION ---\n" + await page.inner_text("body")
            except:
                pass
        await context.close()
        return content

def generate_docs(company_name, job_text, swe_resume, ds_resume):
    prompt = f"""Target Company: {company_name}\nJob Description:\n{job_text[:4000]}
    
    Option A (SWE): ```latex\n{swe_resume}\n```
    Option B (DS): ```latex\n{ds_resume}\n```
    
    TASK: Pick A or B based on fit. Modify bullet points to include ATS keywords. 
    Wrap resume in ===RESUME=== and ===END_RESUME===. 
    Wrap cover letter in ===COVER_LETTER=== and ===END_COVER_LETTER===.
    Wrap selection in ===SELECTED_RESUME=== (SWE or DS) and ===END_SELECTED_RESUME===."""
    
    for model in ["gemini-3.7-flash", "gemini-2.5-flash"]:
        try:
            return client.interactions.create(model=model, input=prompt).output_text
        except Exception:
            continue
    raise RuntimeError("Models unavailable or rate limited.")

async def process_tailored_application(url: str, company: str, swe_resume: str, ds_resume: str, merge: bool):
    base_dir = os.path.dirname(__file__)
    
    job_text = await scrape_job(url)
    output = generate_docs(company, job_text, swe_resume, ds_resume)
    
    resume_part = output.split("===RESUME===")[1].split("===END_RESUME===")[0].replace("```latex", "").replace("```", "").strip()
    cover_part = output.split("===COVER_LETTER===")[1].split("===END_COVER_LETTER===")[0].replace("```markdown", "").replace("```", "").strip()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    folder = os.path.join(base_dir, f"../../output/{company.replace(' ', '_')}_{timestamp}")
    os.makedirs(folder, exist_ok=True)
    
    resume_tex_path, cover_md_path = f"{folder}/resume.tex", f"{folder}/cover_letter.md"
    
    with open(resume_tex_path, "w", encoding="utf-8") as f: f.write(resume_part)
    with open(cover_md_path, "w", encoding="utf-8") as f: f.write(cover_part)

    subprocess.run(["pdflatex", f"-output-directory={folder}", "-interaction=nonstopmode", resume_tex_path], stdout=subprocess.DEVNULL)
    # Compiling markdown cover letter to PDF via Pandoc and pdflatex engine
    subprocess.run(["pandoc", cover_md_path, "-o", f"{folder}/cover_letter.pdf", "--pdf-engine=pdflatex"], capture_output=True)

    if merge:
        writer = PdfWriter()
        if os.path.exists(f"{folder}/cover_letter.pdf"): writer.append(f"{folder}/cover_letter.pdf")
        if os.path.exists(f"{folder}/resume.pdf"): writer.append(f"{folder}/resume.pdf")
        
        bundle_path = f"{folder}/Complete_Bundle_{company}.pdf"
        writer.write(bundle_path)
        return bundle_path
    
    return f"{folder}/resume.pdf"