import numpy as np
from PIL import Image
import cv2
from typing import Tuple

class PostProcessor:

    @staticmethod
    def preserve_color_histogram(
        original: np.ndarray,
        generated: np.ndarray,
        mask: np.ndarray,
        strength: float = 0.6
    ) -> np.ndarray:
        result = generated.copy()

        for channel in range(3):
            orig_channel = original[:, :, channel]
            gen_channel = generated[:, :, channel]

            orig_masked = orig_channel[~mask]
            gen_masked = gen_channel[mask]

            if len(orig_masked) > 0 and len(gen_masked) > 0:
                orig_mean = np.mean(orig_masked)
                orig_std = np.std(orig_masked)
                gen_mean = np.mean(gen_masked)
                gen_std = np.std(gen_masked)

                if gen_std > 0:
                    normalized = (gen_channel[mask] - gen_mean) / gen_std
                    matched = normalized * orig_std + orig_mean

                    result[mask, channel] = np.clip(
                        gen_channel[mask] * (1 - strength) + matched * strength,
                        0, 255
                    ).astype(np.uint8)

        return result

    @staticmethod
    def match_brightness(
        original: np.ndarray,
        generated: np.ndarray,
        mask: np.ndarray,
        border_width: int = 30
    ) -> np.ndarray:
        mask_uint8 = mask.astype(np.uint8)

        kernel = np.ones((border_width, border_width), np.uint8)
        dilated = cv2.dilate(mask_uint8, kernel, iterations=1)
        border_area = dilated - mask_uint8
        border_mask = border_area > 0

        if not np.any(border_mask):
            return generated

        orig_lab = cv2.cvtColor(original, cv2.COLOR_RGB2LAB).astype(np.float32)
        gen_lab = cv2.cvtColor(generated, cv2.COLOR_RGB2LAB).astype(np.float32)

        orig_border_l = orig_lab[:, :, 0][border_mask]
        gen_border_l = gen_lab[:, :, 0][border_mask]

        orig_brightness = np.mean(orig_border_l)
        gen_brightness = np.mean(gen_border_l)

        brightness_diff = orig_brightness - gen_brightness

        result_lab = gen_lab.copy()
        result_lab[mask, 0] = np.clip(
            result_lab[mask, 0] + brightness_diff * 0.7,
            0, 255
        )

        result_rgb = cv2.cvtColor(result_lab.astype(np.uint8), cv2.COLOR_LAB2RGB)

        return result_rgb

    @staticmethod
    def blend_edges_multiscale(
        original: np.ndarray,
        generated: np.ndarray,
        mask: np.ndarray,
        feather_radius: int = 40,
        scales: int = 3
    ) -> np.ndarray:
        result = generated.copy()

        mask_float = mask.astype(np.float32)

        for scale in range(scales):
            kernel_size = feather_radius // (2 ** scale)
            if kernel_size < 3:
                break

            kernel_size = kernel_size if kernel_size % 2 == 1 else kernel_size + 1

            blurred_mask = cv2.GaussianBlur(
                mask_float,
                (kernel_size, kernel_size),
                kernel_size / 3
            )

            mask_3d = np.stack([blurred_mask] * 3, axis=-1)

            result = (
                result * mask_3d +
                original * (1 - mask_3d)
            ).astype(np.uint8)

        return result

    @staticmethod
    def apply_seamless_clone(
        original: np.ndarray,
        generated: np.ndarray,
        mask: np.ndarray
    ) -> np.ndarray:
        try:
            mask_uint8 = (mask * 255).astype(np.uint8)

            contours, _ = cv2.findContours(
                mask_uint8,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )

            if not contours:
                return generated

            largest_contour = max(contours, key=cv2.contourArea)

            M = cv2.moments(largest_contour)
            if M["m00"] == 0:
                return generated

            center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))

            result = cv2.seamlessClone(
                generated,
                original,
                mask_uint8,
                center,
                cv2.NORMAL_CLONE
            )

            return result
        except:
            return generated

    @staticmethod
    def enhance_details(
        image: np.ndarray,
        mask: np.ndarray,
        strength: float = 0.3
    ) -> np.ndarray:
        blurred = cv2.GaussianBlur(image, (5, 5), 1.0)

        detail = image.astype(np.float32) - blurred.astype(np.float32)

        enhanced = image.astype(np.float32) + detail * strength
        enhanced = np.clip(enhanced, 0, 255).astype(np.uint8)

        mask_3d = np.stack([mask.astype(np.float32)] * 3, axis=-1)
        result = (
            enhanced * mask_3d +
            image * (1 - mask_3d)
        ).astype(np.uint8)

        return result

    @staticmethod
    def full_pipeline(
        original_image_path: str,
        inpainted_image: Image.Image,
        mask_path: str,
        enable_seamless: bool = False
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

        result = inpainted.copy()

        result = PostProcessor.match_brightness(
            original_resized,
            result,
            mask_bool,
            border_width=30
        )

        result = PostProcessor.preserve_color_histogram(
            original_resized,
            result,
            mask_bool,
            strength=0.5
        )

        result = PostProcessor.enhance_details(
            result,
            mask_bool,
            strength=0.2
        )

        if enable_seamless:
            result = PostProcessor.apply_seamless_clone(
                original_resized,
                result,
                mask_bool
            )
        else:
            result = PostProcessor.blend_edges_multiscale(
                original_resized,
                result,
                mask_bool,
                feather_radius=40,
                scales=3
            )

        return Image.fromarray(result)

post_processor = PostProcessor()
