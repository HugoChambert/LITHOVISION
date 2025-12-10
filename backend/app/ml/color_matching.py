import numpy as np
from PIL import Image
import cv2

class ColorMatcher:

    @staticmethod
    def match_colors(
        original_image_path: str,
        inpainted_image: Image.Image,
        mask_path: str
    ) -> Image.Image:
        original = cv2.imread(original_image_path)
        original = cv2.cvtColor(original, cv2.COLOR_BGR2RGB)

        inpainted = np.array(inpainted_image)

        mask = Image.open(mask_path).convert('L')
        mask = np.array(mask)
        mask_bool = mask > 127

        mask_bool = cv2.resize(
            mask_bool.astype(np.uint8),
            (inpainted.shape[1], inpainted.shape[0]),
            interpolation=cv2.INTER_NEAREST
        ).astype(bool)

        original_resized = cv2.resize(
            original,
            (inpainted.shape[1], inpainted.shape[0])
        )

        inverted_mask = ~mask_bool
        border_kernel = np.ones((50, 50), np.uint8)
        border_area = cv2.dilate(mask_bool.astype(np.uint8), border_kernel) - mask_bool.astype(np.uint8)
        border_area = border_area.astype(bool)

        if np.any(border_area):
            original_border_mean = np.mean(original_resized[border_area], axis=0)
            inpainted_border_mean = np.mean(inpainted[border_area], axis=0)

            color_diff = original_border_mean - inpainted_border_mean

            inpainted_adjusted = inpainted.copy()
            inpainted_adjusted[mask_bool] = np.clip(
                inpainted_adjusted[mask_bool] + color_diff * 0.3,
                0, 255
            ).astype(np.uint8)
        else:
            inpainted_adjusted = inpainted

        feather_kernel = np.ones((30, 30), np.float32) / 900
        mask_feathered = cv2.filter2D(mask_bool.astype(np.float32), -1, feather_kernel)
        mask_feathered = np.clip(mask_feathered, 0, 1)

        mask_3d = np.stack([mask_feathered] * 3, axis=-1)

        blended = (
            inpainted_adjusted * mask_3d +
            original_resized * (1 - mask_3d)
        ).astype(np.uint8)

        blended_pil = Image.fromarray(blended)

        return blended_pil

color_matcher = ColorMatcher()
