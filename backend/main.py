from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from services.tailor_agent import process_tailored_application
from services.scanner_agent import run_portal_scan
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class TailorRequest(BaseModel):
    url: str
    company: str
    merge: bool = True
    swe_latex: str
    ds_latex: str

class ScanRequest(BaseModel):
    url: str = "https://experience.yorku.ca/myAccount/co-opProgram/centralcoop/jobs.htm"
    pages: int = 3

@app.post("/api/tailor")
async def tailor_resume(req: TailorRequest):
    try:
        pdf_path = await process_tailored_application(
            req.url, 
            req.company, 
            req.swe_latex, 
            req.ds_latex, 
            req.merge
        )
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail="Compilation failed")
        return FileResponse(pdf_path, media_type='application/pdf', filename=f"{req.company}_Application.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan")
async def scan_portal(req: ScanRequest):
    try:
        markdown_report = await run_portal_scan(req.url, req.pages)
        return {"report": markdown_report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))