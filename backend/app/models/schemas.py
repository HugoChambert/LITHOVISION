from pydantic import BaseModel
from typing import Optional, Dict, Any

class ImageUploadResponse(BaseModel):
    image_id: str
    image_url: str
    message: str

class MaskRequest(BaseModel):
    image_id: str
    click_x: float
    click_y: float

class MaskResponse(BaseModel):
    mask_id: str
    mask_url: str
    message: str

class DepthRequest(BaseModel):
    image_id: str

class DepthResponse(BaseModel):
    depth_id: str
    depth_url: str
    message: str

class GenerateRequest(BaseModel):
    image_id: str
    mask_id: str
    stone_material: Dict[str, Any]
    scale: Optional[float] = 1.0
    orientation: Optional[int] = 0

class GenerateResponse(BaseModel):
    task_id: str
    status: str
    message: str

class TaskStatus(BaseModel):
    task_id: str
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
