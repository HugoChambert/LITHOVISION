import os
import uuid
from PIL import Image
from app.celery_app import celery_app
from app.config import UPLOAD_DIR, USE_STUB_MODELS

if USE_STUB_MODELS:
    from app.ml.sam_segmentation_stub import sam_segmenter
    from app.ml.depth_estimation_stub import depth_estimator
    from app.ml.sdxl_inpainting_stub import sdxl_inpainter
    print("Using STUB ML models - Set USE_STUB_MODELS=false in .env to use real models")
else:
    from app.ml.sam_segmentation import sam_segmenter
    from app.ml.depth_estimation import depth_estimator
    from app.ml.sdxl_inpainting import sdxl_inpainter
    print("Using REAL ML models")

from app.ml.post_processing import post_processor

@celery_app.task(bind=True)
def process_stone_replacement(
    self,
    image_id: str,
    mask_id: str,
    stone_material: dict,
    scale: float = 1.0,
    orientation: int = 0
):
    try:
        self.update_state(state='PROGRESS', meta={'step': 'Starting', 'progress': 0})

        image_path = os.path.join(UPLOAD_DIR, f"{image_id}.jpg")
        mask_path = os.path.join(UPLOAD_DIR, f"{mask_id}.png")

        if not os.path.exists(image_path) or not os.path.exists(mask_path):
            raise FileNotFoundError("Image or mask file not found")

        self.update_state(state='PROGRESS', meta={'step': 'Refining mask with SAM', 'progress': 10})
        refined_mask = sam_segmenter.refine_mask(image_path, mask_path)
        refined_mask_path = os.path.join(UPLOAD_DIR, f"{mask_id}_refined.png")
        Image.fromarray(refined_mask).save(refined_mask_path)

        self.update_state(state='PROGRESS', meta={'step': 'Estimating depth', 'progress': 30})
        depth_map = depth_estimator.estimate_depth(image_path)
        depth_path = os.path.join(UPLOAD_DIR, f"{image_id}_depth.png")
        Image.fromarray(depth_map).save(depth_path)

        self.update_state(state='PROGRESS', meta={'step': 'Generating stone texture with SDXL', 'progress': 50})
        inpainted_image = sdxl_inpainter.inpaint_stone(
            image_path,
            refined_mask_path,
            stone_material,
            depth_map
        )

        self.update_state(state='PROGRESS', meta={'step': 'Post-processing and blending', 'progress': 85})
        final_image = post_processor.full_pipeline(
            image_path,
            inpainted_image,
            refined_mask_path,
            enable_seamless=False
        )

        result_id = str(uuid.uuid4())
        result_path = os.path.join(UPLOAD_DIR, f"{result_id}_result.jpg")
        final_image.save(result_path, quality=95)

        self.update_state(state='PROGRESS', meta={'step': 'Complete', 'progress': 100})

        return {
            'status': 'completed',
            'result_id': result_id,
            'result_url': f"/uploads/{result_id}_result.jpg"
        }

    except Exception as e:
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise e
