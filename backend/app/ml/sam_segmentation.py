import torch
import numpy as np
from PIL import Image
import cv2
from segment_anything import sam_model_registry, SamPredictor
from app.config import SAM_CHECKPOINT, SAM_MODEL_TYPE

class SAMSegmenter:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SAMSegmenter, cls).__new__(cls)
        return cls._instance

    def load_model(self):
        if self._model is None:
            print(f"Loading SAM model from {SAM_CHECKPOINT}")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            sam = sam_model_registry[SAM_MODEL_TYPE](checkpoint=SAM_CHECKPOINT)
            sam.to(device=device)
            self._model = SamPredictor(sam)
            print(f"SAM model loaded on {device}")
        return self._model

    def refine_mask(self, image_path: str, mask_path: str) -> np.ndarray:
        predictor = self.load_model()

        image = cv2.imread(image_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        mask_img = Image.open(mask_path).convert('L')
        mask_np = np.array(mask_img)

        predictor.set_image(image)

        mask_bool = mask_np > 127

        y_indices, x_indices = np.where(mask_bool)
        if len(y_indices) == 0:
            return mask_np

        point_coords = np.array([
            [x_indices[len(x_indices)//2], y_indices[len(y_indices)//2]],
            [x_indices[0], y_indices[0]],
            [x_indices[-1], y_indices[-1]]
        ])
        point_labels = np.array([1, 1, 1])

        masks, scores, logits = predictor.predict(
            point_coords=point_coords,
            point_labels=point_labels,
            mask_input=None,
            multimask_output=True,
        )

        best_mask_idx = np.argmax(scores)
        refined_mask = masks[best_mask_idx]

        refined_mask_uint8 = (refined_mask * 255).astype(np.uint8)

        return refined_mask_uint8

sam_segmenter = SAMSegmenter()
