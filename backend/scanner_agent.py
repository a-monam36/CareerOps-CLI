import os
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright
from google import genai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

STUDENT_PROFILE = """
Undergraduate Computer Science student at Lassonde School of Engineering, York University.
Core Technical Skills & Experience:
- Languages & Frameworks: Python, Java, C, JavaScript, TypeScript, React Native, FastAPI, Streamlit.
- Data & Machine Learning: Pandas, NumPy, PyTorch, Hugging Face Transformers.
- Developer Tools: Git, Docker, Linux CLI, REST APIs, Microservices.
- Target Roles: Co-op/Intern roles in Software Engineering, Backend Development, Full-Stack, Data Science, AI/ML, Cloud/DevOps.
- Low-Fit Roles (Score <= 4): IT Helpdesk, manual QA/tester, hardware/wiring technician, non-technical business administrative roles.
"""

def sync_evaluate_fit(job_title, company, description_snippet):
    prompt = f"Candidate Profile:\n{STUDENT_PROFILE}\n\nJob Listing:\nTitle: {job_title}\nCompany: {company}\nDescription Snippet:\n{description_snippet[:1500]}\n\nEvaluate fit. Respond strictly in this format:\nSCORE: <1-10>\nREASON: <1 brief sentence explaining why>"
    try:
        res = client.interactions.create(model="gemini-3.7-flash", input=prompt)
        text = res.output_text
        score = 5
        reason = "Relevant technical role."
        for line in text.splitlines():
            if line.startswith("SCORE:"):
                digits = ''.join(filter(str.isdigit, line))
                score = int(digits) if digits else 5
            elif line.startswith("REASON:"):
                reason = line.replace("REASON:", "").strip()
        return score, reason
    except Exception:
        return 5, "Network/API error during evaluation."

async def run_portal_scan(portal_url: str, max_pages: int):
    analyzed_jobs = []
    
    async with async_playwright() as p:
        user_data_dir = os.path.join(os.getcwd(), "chrome_session")
        # Must be False so the user can see the Passport York login screen
        context = await p.chromium.launch_persistent_context(
            user_data_dir, headless=False, channel="chrome",
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0] if len(context.pages) > 0 else await context.new_page()
        
        await page.goto(portal_url, wait_until="domcontentloaded")
        
        # Give user up to 60 seconds to do the Duo Push / SSO login if needed
        try:
            await page.wait_for_selector("table tbody tr", timeout=60000)
        except Exception:
            await context.close()
            return "Error: Timed out waiting for job listings table. Did you log in successfully?"

        for current_page_num in range(1, max_pages + 1):
            row_count = await page.locator("table tbody tr").count()
            
            for idx in range(row_count):
                try:
                    row = page.locator("table tbody tr").nth(idx)
                    row_text = await row.inner_text(timeout=5000)
                    if "application submitted" in row_text.lower():
                        continue

                    cells = row.locator("td")
                    if await cells.count() < 5:
                        continue

                    job_id = (await cells.nth(2).inner_text()).strip()
                    title = (await cells.nth(3).inner_text()).strip()
                    company = (await cells.nth(4).inner_text()).strip()

                    if not job_id.isdigit() or len(title) < 2:
                        continue

                    await row.locator("a").first.click(force=True, timeout=10000)
                    await page.wait_for_selector(f"text={job_id}", timeout=10000)
                    await page.wait_for_timeout(500)
                    desc = await page.inner_text("body", timeout=5000)
                    
                    score, reason = await asyncio.to_thread(sync_evaluate_fit, title, company, desc)
                    analyzed_jobs.append({"job_id": job_id, "title": title, "company": company, "score": score, "reason": reason})
                    
                    # Navigate back to the table
                    try:
                        results_btn = page.locator("a:has-text('Back to Search Results')").first
                        if await results_btn.count() > 0:
                            await results_btn.click(force=True, timeout=3000)
                        else:
                            await page.evaluate("window.history.back()")
                    except:
                        await page.evaluate("window.history.back()")
                        
                    await page.wait_for_selector("table tbody tr", timeout=10000)
                except Exception:
                    try:
                        await page.evaluate("window.history.back()")
                        await page.wait_for_selector("table tbody tr", timeout=10000)
                    except:
                        pass
                    continue
                    
            if current_page_num < max_pages:
                next_btn = (
                    await page.query_selector("a:has-text('»')")
                    or await page.query_selector(f"a:has-text('{current_page_num + 1}')")
                    or await page.query_selector(".pagination .next a")
                )
                if next_btn and await next_btn.is_visible():
                    await next_btn.click(force=True)
                    await page.wait_for_timeout(4000)
                else:
                    break
                    
        await context.close()

    analyzed_jobs.sort(key=lambda x: x["score"], reverse=True)
    
    report = f"# 🎯 Curated Experience York Job Leads\n\n"
    report += "> Note: Search the **Job ID** in the portal to find the listing.\n\n"
    report += "| Score | Job ID | Role Title | Company | Match Rationale |\n"
    report += "| :---: | :--- | :--- | :--- | :--- |\n"
    
    for job in analyzed_jobs:
        report += f"| **{job['score']}/10** | `{job['job_id']}` | {job['title']} | {job['company']} | {job['reason']} |\n"
        
    report += "\n\n## 🚀 Top Recommended Jobs (Score >= 7)\n\n"
    for job in analyzed_jobs:
        if job['score'] >= 7:
            report += f"- **{job['company']} — {job['title']}** (ID: `{job['job_id']}`, Score: {job['score']}/10)\n"

    return report