import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from PIL import Image
import io
import numpy as np
from app.models.schemas import (
    ImageUploadResponse,
    MaskRequest,
    MaskResponse,
    DepthRequest,
    DepthResponse,
    GenerateRequest,
    GenerateResponse,
    TaskStatus
)
from app.api.tasks import process_stone_replacement
from app.celery_app import celery_app
from app.config import UPLOAD_DIR, supabase, USE_STUB_MODELS

if USE_STUB_MODELS:
    from app.ml.sam_segmentation_stub import sam_segmenter
    from app.ml.depth_estimation_stub import depth_estimator
else:
    from app.ml.sam_segmentation import sam_segmenter
    from app.ml.depth_estimation import depth_estimator

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

@router.post("/mask", response_model=MaskResponse)
async def generate_mask(request: MaskRequest):
    try:
        image_path = os.path.join(UPLOAD_DIR, f"{request.image_id}.jpg")

        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail="Image not found")

        image = Image.open(image_path).convert('RGB')
        image_np = np.array(image)

        point_coords = np.array([[request.click_x, request.click_y]])
        point_labels = np.array([1])

        sam_predictor = sam_segmenter.load_model()
        sam_predictor.set_image(image_np)

        masks, scores, logits = sam_predictor.predict(
            point_coords=point_coords,
            point_labels=point_labels,
            mask_input=None,
            multimask_output=True,
        )

        best_mask_idx = np.argmax(scores)
        mask = masks[best_mask_idx]

        mask_uint8 = (mask * 255).astype(np.uint8)
        mask_image = Image.fromarray(mask_uint8, mode='L')

        mask_id = str(uuid.uuid4())
        mask_path = os.path.join(UPLOAD_DIR, f"{mask_id}.png")
        mask_image.save(mask_path)

        return MaskResponse(
            mask_id=mask_id,
            mask_url=f"/uploads/{mask_id}.png",
            message="Mask generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating mask: {str(e)}")

@router.post("/depth", response_model=DepthResponse)
async def generate_depth(request: DepthRequest):
    try:
        image_path = os.path.join(UPLOAD_DIR, f"{request.image_id}.jpg")

        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail="Image not found")

        depth_map = depth_estimator.estimate_depth(image_path)

        depth_image = Image.fromarray(depth_map, mode='L')

        depth_id = str(uuid.uuid4())
        depth_path = os.path.join(UPLOAD_DIR, f"{depth_id}_depth.png")
        depth_image.save(depth_path)

        return DepthResponse(
            depth_id=depth_id,
            depth_url=f"/uploads/{depth_id}_depth.png",
            message="Depth map generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating depth map: {str(e)}")

@router.post("/generate", response_model=GenerateResponse)
async def generate_preview(request: GenerateRequest):
    try:
        image_path = os.path.join(UPLOAD_DIR, f"{request.image_id}.jpg")
        mask_path = os.path.join(UPLOAD_DIR, f"{request.mask_id}.png")

        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail="Image not found")
        if not os.path.exists(mask_path):
            raise HTTPException(status_code=404, detail="Mask not found")

        task = process_stone_replacement.delay(
            request.image_id,
            request.mask_id,
            request.stone_material,
            request.scale,
            request.orientation
        )

        return GenerateResponse(
            task_id=task.id,
            status="queued",
            message="Generation started"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting generation: {str(e)}")

@router.get("/status/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    task = celery_app.AsyncResult(task_id)

    if task.state == 'PENDING':
        response = TaskStatus(
            task_id=task_id,
            status='pending',
            progress=0
        )
    elif task.state == 'PROGRESS':
        response = TaskStatus(
            task_id=task_id,
            status='processing',
            progress=task.info.get('progress', 0)
        )
    elif task.state == 'SUCCESS':
        result = task.result
        response = TaskStatus(
            task_id=task_id,
            status='completed',
            progress=100,
            result_url=result.get('result_url')
        )
    elif task.state == 'FAILURE':
        response = TaskStatus(
            task_id=task_id,
            status='failed',
            error=str(task.info)
        )
    else:
        response = TaskStatus(
            task_id=task_id,
            status=task.state.lower()
        )

    return response

@router.get("/result/{task_id}")
async def get_result(task_id: str):
    task = celery_app.AsyncResult(task_id)

    if task.state != 'SUCCESS':
        raise HTTPException(status_code=404, detail="Result not ready or task failed")

    result = task.result
    result_url = result.get('result_url')

    if not result_url:
        raise HTTPException(status_code=404, detail="Result URL not found")

    filename = result_url.split('/')[-1]
    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Result file not found")

    return FileResponse(file_path, media_type="image/jpeg", filename=filename)

@router.get("/uploads/{filename}")
async def get_upload(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@router.get("/materials")
async def get_materials(
    type: str = None,
    color_family: str = None
):
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not configured")

        query = supabase.table('material_presets').select('*').eq('is_active', True)

        if type:
            query = query.eq('type', type)
        if color_family:
            query = query.eq('color_family', color_family)

        response = query.order('name').execute()

        return {
            "materials": response.data,
            "count": len(response.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching materials: {str(e)}")

@router.get("/materials/{material_id}")
async def get_material(material_id: str):
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not configured")

        response = supabase.table('material_presets').select('*').eq('id', material_id).maybeSingle().execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Material not found")

        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching material: {str(e)}")

@router.get("/materials/types/list")
async def get_material_types():
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not configured")

        response = supabase.table('material_presets').select('type').eq('is_active', True).execute()

        types = list(set([item['type'] for item in response.data]))
        types.sort()

        return {
            "types": types,
            "count": len(types)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching material types: {str(e)}")
