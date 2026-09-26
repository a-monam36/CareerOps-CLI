import os
import shutil
import asyncio
import subprocess
from datetime import datetime
from playwright.async_api import async_playwright
from google import genai
from pypdf import PdfWriter
from dotenv import load_dotenv

# Load secret environment variables from .env
load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    print("[!] Error: GEMINI_API_KEY not found. Check your .env file.")
    exit(1)

client = genai.Client(api_key=API_KEY)

async def scrape_job(url):
    print(f"Scraping job posting from: {url}...")
    
    async with async_playwright() as p:
        # Use the shared session folder to bypass Cloudflare and auto-login
        user_data_dir = os.path.join(os.getcwd(), "chrome_session")
        
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0] if len(context.pages) > 0 else await context.new_page()
        
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        # Pause if it hits the Passport York login wall or any other SSO
        if "passport.yorku.ca" in page.url or "login" in page.url.lower():
            print("\n[!] Login screen detected.")
            print("Please log in manually in the popup browser window. You have 45 seconds...")
            await page.wait_for_timeout(45000) 
            
        # Grab the initial portal content
        content = "--- PORTAL JOB DESCRIPTION ---\n"
        content += await page.inner_text("body")
        
        # Scan the page's HTML for external application links
        links = await page.evaluate(
            "Array.from(document.querySelectorAll('a')).map(a => ({text: a.innerText.toLowerCase(), href: a.href}))"
        )
        
        external_url = None
        for link in links:
            href = link['href']
            text = link['text']
            
            # Skip internal Experience York navigation links
            if href.startswith('http') and 'experience.yorku.ca' not in href and 'passport.yorku.ca' not in href:
                if 'apply' in text or 'website' in text or 'external' in text or 'view' in text:
                    external_url = href
                    break
        
        # If an external link is found, go to it and scrape that too
        if external_url:
            print(f"\n[+] External application link found: {external_url}")
            print("Navigating to company website to grab additional context...")
            try:
                await page.goto(external_url, wait_until="domcontentloaded", timeout=20000)
                content += "\n\n--- COMPANY WEBSITE JOB DESCRIPTION ---\n"
                content += await page.inner_text("body")
            except Exception as e:
                print(f"Could not load external site (might have anti-bot protection): {e}")
                
        await context.close()
        return content

def call_gemini_with_fallback(prompt):
    """Tries 3.8-flash first; automatically falls back to 3.6-flash if busy or rate-limited."""
    for model_name in ["gemini-3.8-flash", "gemini-3.6-flash"]:
        try:
            print(f"Processing with model: {model_name}...")
            interaction = client.interactions.create(
                model=model_name,
                input=prompt
            )
            return interaction.output_text
        except Exception as e:
            err_str = str(e)
            # Catch rate limits (429) and temporary server overload (503)
            if any(code in err_str for code in ["429", "503", "500", "high demand", "RateLimitError", "InternalServerError"]):
                print(f"[!] {model_name} is busy or rate-limited. Falling back to next available model...")
                continue
            raise e
    raise RuntimeError("All available free-tier models are currently unavailable. Please wait a minute and retry.")

def generate_docs(company_name, job_text, swe_resume, ds_resume):
    print("Selecting best resume & optimizing keywords in a single call...")
    prompt = f"""
    Target Company: {company_name}
    Job Description:
    {job_text[:4000]}
    
    Option A - Software Engineering / Cloud / Backend Master Resume (LaTeX):
    ```latex
    {swe_resume}
    ```

    Option B - Data Science / Machine Learning / Quant Master Resume (LaTeX):
    ```latex
    {ds_resume}
    ```

    TASK:
    1. Determine whether the job description is closer to (A) SWE/Backend or (B) Data Science/ML.
    2. Select the matching master resume (A or B).
    3. Modify ONLY the wording inside the bullet points and 'Technical Skills' to naturally integrate the top ATS keywords from the job description.
    
    CRITICAL CONSTRAINTS:
    - Retain the exact LaTeX structure, document size, and formatting of the chosen resume.
    - Do NOT drop projects, change project order, or alter the number of bullet points.
    - Output the tailored resume in valid LaTeX wrapped in ===RESUME=== and ===END_RESUME=== tags.
    - Output which resume was selected in ===SELECTED_RESUME=== (write 'SWE' or 'DS') and ===END_SELECTED_RESUME=== tags.
    - ALWAYS write a tailored 3-paragraph cover letter for {company_name} in Markdown, wrapped in ===COVER_LETTER=== and ===END_COVER_LETTER=== tags.
    """
    
    return call_gemini_with_fallback(prompt)

async def main():
    url = input("Enter the job listing URL: ").strip()
    company = input("Enter the Company Name: ").strip()
    merge_choice = input("Merge into single PDF bundle? (y/n, default y): ").strip().lower()

    # Load both master resumes locally
    try:
        with open("master_swe_resume.tex", "r", encoding="utf-8") as f:
            swe_resume = f.read()
        with open("master_ds_resume.tex", "r", encoding="utf-8") as f:
            ds_resume = f.read()
    except FileNotFoundError as e:
        print(f"Error loading master resumes: {e}")
        return

    # Step 1: Scrape
    job_text = await scrape_job(url)

    # Step 2: Generate docs + classify in one single API request
    output = generate_docs(company, job_text, swe_resume, ds_resume)
    
    try:
        selected = output.split("===SELECTED_RESUME===")[1].split("===END_SELECTED_RESUME===")[0].strip()
        print(f"Agent selected profile: {selected}")
    except IndexError:
        print("Note: Profile selection tag omitted; using tailored output.")

    try:
        resume_part = output.split("===RESUME===")[1].split("===END_RESUME===")[0].strip()
        resume_part = resume_part.replace("```latex", "").replace("```", "").strip()
        
        cover_part = output.split("===COVER_LETTER===")[1].split("===END_COVER_LETTER===")[0].strip()
        cover_part = cover_part.replace("```markdown", "").replace("```", "").strip()
    except IndexError:
        print("Error parsing AI output tags. Please check the raw response.")
        return

    # Step 3: Save generated source files (Now uses timestamp to prevent overwriting)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    folder = f"output/{company.replace(' ', '_')}_{timestamp}"
    os.makedirs(folder, exist_ok=True)
    
    resume_tex_path = f"{folder}/resume.tex"
    cover_md_path = f"{folder}/cover_letter.md"
    
    with open(resume_tex_path, "w", encoding="utf-8") as f:
        f.write(resume_part)
    with open(cover_md_path, "w", encoding="utf-8") as f:
        f.write(cover_part)
        
    print(f"Tailored source files saved in '{folder}'.")

    # Step 4: Compilations
    has_pdflatex = shutil.which("pdflatex") is not None
    has_pandoc = shutil.which("pandoc") is not None

    if has_pdflatex:
        print("Compiling resume with pdflatex...")
        subprocess.run(["pdflatex", f"-output-directory={folder}", "-interaction=nonstopmode", resume_tex_path], stdout=subprocess.DEVNULL)
        subprocess.run(["pdflatex", f"-output-directory={folder}", "-interaction=nonstopmode", resume_tex_path], stdout=subprocess.DEVNULL)
    else:
        print("[!] 'pdflatex' not found on system PATH.")

    if has_pandoc:
        print("Compiling cover letter with pandoc...")
        # Added --pdf-engine=pdflatex to fix the missing cover letter bug
        result = subprocess.run(
            ["pandoc", cover_md_path, "-o", f"{folder}/cover_letter.pdf", "--pdf-engine=pdflatex", "--include-in-header=styling.tex"],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"[!] Pandoc compilation failed:\n{result.stderr}")
    else:
        print("[!] 'pandoc' not found on system PATH.")

    # Step 5: Bundle Merge
    if merge_choice in ['y', 'unknown', ''] and has_pdflatex and has_pandoc:
        resume_pdf = f"{folder}/resume.pdf"
        cover_pdf = f"{folder}/cover_letter.pdf"
        
        if os.path.exists(resume_pdf) and os.path.exists(cover_pdf):
            print("Merging into a single application bundle...")
            writer = PdfWriter()
            writer.append(cover_pdf)
            writer.append(resume_pdf)
            
            if os.path.exists("transcript.pdf"):
                writer.append("transcript.pdf")
            else:
                print("Note: 'transcript.pdf' not found in root folder; omitted from bundle.")
                
            bundle_path = f"{folder}/Complete_Application_Bundle.pdf"
            writer.write(bundle_path)
            print(f"Complete bundle ready: {bundle_path}")

    print(f"\nDone! Check the '{folder}' folder.")

if __name__ == "__main__":
    asyncio.run(main())