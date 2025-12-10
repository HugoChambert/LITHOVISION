import torch
import numpy as np
from PIL import Image
import cv2
from transformers import DPTImageProcessor, DPTForDepthEstimation

class DepthEstimator:
    _instance = None
    _model = None
    _processor = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DepthEstimator, cls).__new__(cls)
        return cls._instance

    def load_model(self):
        if self._model is None:
            print("Loading MiDaS depth estimation model")
            device = "cuda" if torch.cuda.is_available() else "cpu"

            self._processor = DPTImageProcessor.from_pretrained("Intel/dpt-large")
            self._model = DPTForDepthEstimation.from_pretrained("Intel/dpt-large")
            self._model.to(device)
            self._model.eval()

            print(f"Depth model loaded on {device}")
        return self._model, self._processor

    def estimate_depth(self, image_path: str) -> np.ndarray:
        model, processor = self.load_model()
        device = "cuda" if torch.cuda.is_available() else "cpu"

        image = Image.open(image_path).convert('RGB')

        inputs = processor(images=image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            predicted_depth = outputs.predicted_depth

        prediction = torch.nn.functional.interpolate(
            predicted_depth.unsqueeze(1),
            size=image.size[::-1],
            mode="bicubic",
            align_corners=False,
        )

        depth_map = prediction.squeeze().cpu().numpy()

        depth_map = (depth_map - depth_map.min()) / (depth_map.max() - depth_map.min())
        depth_map = (depth_map * 255).astype(np.uint8)

        return depth_map

depth_estimator = DepthEstimator()
