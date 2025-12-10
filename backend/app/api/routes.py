import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from PIL import Image
import io
from app.models.schemas import (
    ImageUploadResponse,
    ProcessingRequest,
    ProcessingResponse,
    JobStatus
)
from app.api.tasks import process_stone_replacement
from app.celery_app import celery_app
from app.config import UPLOAD_DIR

router = APIRouter()

@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        image = image.convert('RGB')

        image_id = str(uuid.uuid4())
        image_path = os.path.join(UPLOAD_DIR, f"{image_id}.jpg")
        image.save(image_path, quality=95)

        return ImageUploadResponse(
            image_id=image_id,
            image_url=f"/uploads/{image_id}.jpg",
            message="Image uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

@router.post("/upload-mask", response_model=ImageUploadResponse)
async def upload_mask(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        mask = Image.open(io.BytesIO(contents)).convert('L')

        mask_id = str(uuid.uuid4())
        mask_path = os.path.join(UPLOAD_DIR, f"{mask_id}.png")
        mask.save(mask_path)

        return ImageUploadResponse(
            image_id=mask_id,
            image_url=f"/uploads/{mask_id}.png",
            message="Mask uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing mask: {str(e)}")

@router.post("/process", response_model=ProcessingResponse)
async def process_image(request: ProcessingRequest):
    try:
        task = process_stone_replacement.delay(
            request.image_id,
            request.mask_data,
            request.stone_material
        )

        return ProcessingResponse(
            job_id=task.id,
            status="queued",
            message="Processing started"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting job: {str(e)}")

@router.get("/job/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    task = celery_app.AsyncResult(job_id)

    if task.state == 'PENDING':
        response = JobStatus(
            job_id=job_id,
            status='pending',
            progress=0
        )
    elif task.state == 'PROGRESS':
        response = JobStatus(
            job_id=job_id,
            status='processing',
            progress=task.info.get('progress', 0)
        )
    elif task.state == 'SUCCESS':
        result = task.result
        response = JobStatus(
            job_id=job_id,
            status='completed',
            progress=100,
            result_url=result.get('result_url')
        )
    elif task.state == 'FAILURE':
        response = JobStatus(
            job_id=job_id,
            status='failed',
            error=str(task.info)
        )
    else:
        response = JobStatus(
            job_id=job_id,
            status=task.state.lower()
        )

    return response

@router.get("/uploads/{filename}")
async def get_upload(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
