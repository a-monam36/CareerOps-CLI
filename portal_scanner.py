import os
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright
from google import genai
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    print("[!] Error: GEMINI_API_KEY not found in .env file.")
    exit(1)

client = genai.Client(api_key=API_KEY)

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
    """Runs Gemini in a separate thread so it can never freeze your terminal."""
    prompt = f"""
    Candidate Profile:
    {STUDENT_PROFILE}

    Job Listing:
    Title: {job_title}
    Company: {company}
    Description Snippet:
    {description_snippet[:1500]}

    Evaluate if this role is a strong technical fit for the candidate's profile.
    Respond strictly in this format:
    SCORE: <number between 1 and 10>
    REASON: <1 brief sentence explaining why it fits or does not fit>
    """
    for model_name in ["gemini-3.8-flash", "gemini-3.6-flash"]:
        try:
            res = client.interactions.create(model=model_name, input=prompt)
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
        except Exception as e:
            err_str = str(e)
            if any(code in err_str for code in ["429", "503", "500", "high demand", "RateLimitError", "InternalServerError"]):
                continue
            break
    return 5, "Could not evaluate with AI (Network Error)."

async def scan_portal():
    print("=" * 60)
    print("Experience York Automated Job Harvester (Unstoppable SPA Mode)")
    print("=" * 60)

    default_portal_url = "https://experience.yorku.ca/myAccount/co-opProgram/centralcoop/jobs.htm"
    print(f"Default URL: {default_portal_url}")
    user_url = input("Enter Portal URL (or press ENTER to use default): ").strip()
    portal_url = user_url if user_url else default_portal_url

    max_pages = input("How many pages do you want to scan? (default 3): ").strip()
    max_pages = int(max_pages) if max_pages.isdigit() else 3

    async with async_playwright() as p:
        user_data_dir = os.path.join(os.getcwd(), "chrome_session")
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0] if len(context.pages) > 0 else await context.new_page()

        print(f"\nNavigating to: {portal_url}")
        await page.goto(portal_url, wait_until="domcontentloaded")

        print("\n" + "#" * 60)
        print("ACTION REQUIRED:")
        print("1. Log in via Passport York SSO and Duo 2FA (if not cached).")
        print("2. Apply your desired search filters.")
        print("3. Ensure the job listings table is visible on your screen.")
        print("#" * 60)
        input("\n>>> Press ENTER in this terminal once the table is ready... ")

        analyzed_jobs = []

        for current_page_num in range(1, max_pages + 1):
            print(f"\n--- Scanning Page {current_page_num} of {max_pages} ---")
            
            try:
                await page.wait_for_selector("table tbody tr", timeout=15000)
            except Exception:
                print("[!] Timeout waiting for table rows. Stopping pagination.")
                break

            row_count = await page.locator("table tbody tr").count()
            print(f"Detected {row_count} total rows on this page.")
            
            page_leads = 0

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
                        
                    print(f"[{idx+1}/{row_count}] Inspecting: {title} at {company} (ID: {job_id})...")

                    # FORCE CLICK the title to bypass any UI overlap issues
                    await row.locator("a").first.click(force=True, timeout=10000)
                    
                    # Wait for Job ID header to prove the page changed
                    await page.wait_for_selector(f"text={job_id}", timeout=10000)
                    await page.wait_for_timeout(500)
                    
                    desc = await page.inner_text("body", timeout=5000)
                    
                    # Score via Gemini in background thread
                    score, reason = await asyncio.to_thread(sync_evaluate_fit, title, company, desc)
                    
                    analyzed_jobs.append({
                        "job_id": job_id,
                        "title": title,
                        "company": company,
                        "score": score,
                        "reason": reason
                    })
                    
                    page_leads += 1

                    # --- BULLETPROOF RETURN LOGIC ---
                    try:
                        # Attempt 1: Try forcing the exact text button inside the dropdown directly
                        results_btn = page.locator("a:has-text('Back to Search Results')").first
                        if await results_btn.count() > 0:
                            await results_btn.click(force=True, timeout=3000)
                        else:
                            # Attempt 2: Click "Back to" then the results button
                            back_menu = page.locator("a:has-text('Back to')").first
                            await back_menu.click(force=True, timeout=3000)
                            await page.wait_for_timeout(500)
                            await page.locator("a:has-text('Back to Search Results')").first.click(force=True, timeout=3000)
                    except Exception:
                        # Attempt 3: If Orbis completely blocks Playwright clicks, inject JS to hit the browser Back button
                        await page.evaluate("window.history.back()")
                        
                    # Wait for the table to reappear before looping
                    await page.wait_for_selector("table tbody tr", timeout=10000)

                except Exception as e:
                    print(f"    [!] Minor error on row {idx+1}, forcing recovery...")
                    # Ultimate fallback: Force a browser back action so the script NEVER gets stuck
                    try:
                        await page.evaluate("window.history.back()")
                        await page.wait_for_selector("table tbody tr", timeout=10000)
                    except Exception:
                        pass
                    continue

            print(f"Completed analysis of {page_leads} unapplied jobs from Page {current_page_num}.")

            if current_page_num < max_pages:
                next_btn = (
                    await page.query_selector("a:has-text('»')")
                    or await page.query_selector(f"a:has-text('{current_page_num + 1}')")
                    or await page.query_selector(".pagination .next a")
                )
                if next_btn and await next_btn.is_visible():
                    print(f"Advancing to page {current_page_num + 1}...")
                    await next_btn.click(force=True)
                    await page.wait_for_timeout(4000)
                else:
                    print("No more pages detected.")
                    break

        await context.close()

        analyzed_jobs.sort(key=lambda x: x["score"], reverse=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        output_filename = f"curated_job_leads_{timestamp}.md"

        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(f"# 🎯 Curated Experience York Job Leads ({timestamp})\n\n")
            f.write("> **Note:** Experience York uses dynamic links. Search the **Job ID** in the portal to find the listing.\n\n")
            f.write("| Score | Job ID | Role Title | Company | Match Rationale |\n")
            f.write("| :---: | :--- | :--- | :--- | :--- |\n")

            for job in analyzed_jobs:
                f.write(f"| **{job['score']}/10** | `{job['job_id']}` | {job['title']} | {job['company']} | {job['reason']} |\n")

            f.write("\n\n## 🚀 Top Recommended Jobs (Score >= 7)\n\n")
            for job in analyzed_jobs:
                if job['score'] >= 7:
                    f.write(f"- **{job['company']} — {job['title']}** (ID: `{job['job_id']}`, Score: {job['score']}/10)\n")

        print(f"\n[+] Done! Analyzed report saved to: {output_filename}")

if __name__ == "__main__":
    asyncio.run(scan_portal())