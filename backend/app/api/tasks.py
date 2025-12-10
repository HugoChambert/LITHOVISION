import os
import uuid
from PIL import Image
from app.celery_app import celery_app
from app.ml.sam_segmentation import sam_segmenter
from app.ml.depth_estimation import depth_estimator
from app.ml.sdxl_inpainting import sdxl_inpainter
from app.ml.color_matching import color_matcher
from app.config import UPLOAD_DIR

@celery_app.task(bind=True)
def process_stone_replacement(
    self,
    image_id: str,
    mask_id: str,
    stone_material: dict
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

        self.update_state(state='PROGRESS', meta={'step': 'Matching colors', 'progress': 85})
        final_image = color_matcher.match_colors(
            image_path,
            inpainted_image,
            refined_mask_path
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
