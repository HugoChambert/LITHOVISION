from pydantic import BaseModel
from typing import Optional, Dict, Any

class ImageUploadResponse(BaseModel):
    image_id: str
    image_url: str
    message: str

class ProcessingRequest(BaseModel):
    image_id: str
    mask_data: str
    stone_material: Dict[str, Any]

class ProcessingResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: Optional[int] = None
    result_url: Optional[str] = None
    error: Optional[str] = None

class StoneReplacement(BaseModel):
    original_image_url: str
    mask_data: str
    stone_id: str
    result_image_url: Optional[str] = None
    status: str
