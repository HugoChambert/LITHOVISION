import torch
import numpy as np
from PIL import Image
from diffusers import StableDiffusionXLInpaintPipeline, ControlNetModel, StableDiffusionXLControlNetPipeline
from diffusers.utils import load_image
import cv2

class SDXLInpainter:
    _instance = None
    _pipe = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SDXLInpainter, cls).__new__(cls)
        return cls._instance

    def load_model(self):
        if self._pipe is None:
            print("Loading SDXL Inpainting pipeline")
            device = "cuda" if torch.cuda.is_available() else "cpu"

            self._pipe = StableDiffusionXLInpaintPipeline.from_pretrained(
                "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                variant="fp16" if device == "cuda" else None,
            )
            self._pipe.to(device)

            if device == "cuda":
                self._pipe.enable_model_cpu_offload()
                self._pipe.enable_vae_slicing()

            print(f"SDXL pipeline loaded on {device}")
        return self._pipe

    def generate_stone_texture_prompt(self, stone_material: dict) -> str:
        stone_type = stone_material.get("type", "stone")
        stone_name = stone_material.get("name", "")
        description = stone_material.get("description", "")

        base_prompt = f"high quality {stone_name} {stone_type} countertop surface, "
        base_prompt += f"realistic texture, natural stone pattern, {description}, "
        base_prompt += "photorealistic, detailed, professional interior design photo"

        return base_prompt

    def inpaint_stone(
        self,
        image_path: str,
        mask_path: str,
        stone_material: dict,
        depth_map: np.ndarray = None
    ) -> Image.Image:
        pipe = self.load_model()

        image = load_image(image_path).convert("RGB")
        mask = load_image(mask_path).convert("L")

        prompt = self.generate_stone_texture_prompt(stone_material)
        negative_prompt = "blurry, low quality, distorted, unrealistic, cartoon, drawing, painting, artificial"

        result = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=image,
            mask_image=mask,
            num_inference_steps=30,
            guidance_scale=8.0,
            strength=0.85,
        ).images[0]

        return result

sdxl_inpainter = SDXLInpainter()
