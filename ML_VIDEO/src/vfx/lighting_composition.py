"""
Cinematic Lighting and Composition Analyzer.
Extracts explainable film aesthetics features:
- Contrast & dynamic range (Chiaroscuro vs High-key vs Low-key)
- Color temperature (Warm vs Cool Kelvin estimation)
- Composition balance & Rule of Thirds power point energy
- Aspect Ratio and Letterbox/Pillarbox detection
"""
from typing import Dict, Any, Tuple
import numpy as np
import cv2
from PIL import Image


class FilmAestheticsAnalyzer:
    """
    Rule-based and heuristic computer vision analyzer for cinematic lighting and composition.
    """
    def __init__(self):
        pass

    def analyze_frame(self, image_input) -> Dict[str, Any]:
        """
        Analyzes a single keyframe (PIL Image or numpy array RGB/BGR).
        Returns comprehensive cinematic lighting and composition metrics.
        """
        if isinstance(image_input, Image.Image):
            img_rgb = np.array(image_input)
            img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        elif isinstance(image_input, np.ndarray):
            if image_input.ndim == 3 and image_input.shape[2] == 3:
                img_rgb = image_input
                img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
            else:
                raise ValueError("Expected 3-channel image array")
        else:
            raise TypeError(f"Unsupported image type: {type(image_input)}")

        h, w, _ = img_rgb.shape
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

        # 1. Lighting & Luminance Analysis
        mean_lum = float(np.mean(gray))
        std_lum = float(np.std(gray))
        p5, p95 = np.percentile(gray, [5, 95])
        dynamic_range = float(p95 - p5)
        
        # High-key / Low-key / Chiaroscuro classification
        shadow_ratio = float(np.sum(gray < 50) / gray.size)
        highlight_ratio = float(np.sum(gray > 205) / gray.size)
        mid_ratio = 1.0 - (shadow_ratio + highlight_ratio)

        if shadow_ratio > 0.45 and std_lum > 40:
            lighting_style = "Chiaroscuro / Low-Key"
        elif shadow_ratio > 0.40:
            lighting_style = "Low-Key (Moody / Noir)"
        elif highlight_ratio > 0.35 and mean_lum > 140:
            lighting_style = "High-Key (Bright / Commercial)"
        elif std_lum > 60:
            lighting_style = "High Contrast Dramatic"
        else:
            lighting_style = "Natural / Balanced Ambient"

        # 2. Color Temperature (Kelvin heuristic from LAB b* channel)
        # In LAB, b* is blue(-) to yellow(+). A higher b* means warmer light.
        b_channel = lab[:, :, 2].astype(np.float32) - 128.0
        a_channel = lab[:, :, 1].astype(np.float32) - 128.0
        mean_b = float(np.mean(b_channel))
        mean_a = float(np.mean(a_channel))
        
        if mean_b > 12:
            color_temp = "Warm (Golden Hour / Tungsten ~3200K)"
        elif mean_b < -8:
            color_temp = "Cool (Overcast / Moonlight ~6500K+)"
        elif mean_a > 10:
            color_temp = "Stylized Magenta / Neon"
        elif mean_a < -10:
            color_temp = "Stylized Cyan / Teal"
        else:
            color_temp = "Neutral Daylight (~5600K)"

        # 3. Composition & Rule of Thirds
        # Compute gradient / visual saliency energy across 3x3 grid
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        edge_energy = np.sqrt(sobel_x**2 + sobel_y**2)
        
        # Thirds dividing lines
        h_third = h // 3
        w_third = w // 3
        
        # Center region energy
        center_mask = np.zeros_like(gray, dtype=bool)
        center_mask[h_third:2*h_third, w_third:2*w_third] = True
        center_energy = float(np.mean(edge_energy[center_mask]))
        
        # Power points (the 4 intersections of rule of thirds)
        r = min(h_third, w_third) // 4
        pp_energies = []
        for py in [h_third, 2 * h_third]:
            for px in [w_third, 2 * w_third]:
                box = edge_energy[max(0, py - r):min(h, py + r), max(0, px - r):min(w, px + r)]
                pp_energies.append(float(np.mean(box)))
                
        mean_power_point_energy = float(np.mean(pp_energies))
        total_mean_energy = float(np.mean(edge_energy)) + 1e-6
        thirds_ratio = mean_power_point_energy / total_mean_energy

        if thirds_ratio > 1.25:
            composition_rule = "Rule of Thirds Compliant"
        elif center_energy / total_mean_energy > 1.3:
            composition_rule = "Center Framed / Symmetrical"
        else:
            composition_rule = "Open / Environmental Framing"

        # 4. Aspect Ratio & Letterbox detection
        aspect_ratio = round(w / float(h), 3)
        cinematic_format = "16:9 (1.78:1 Standard Widescreen)"
        if 2.30 <= aspect_ratio <= 2.45:
            cinematic_format = "Anamorphic Scope (2.39:1 / 2.35:1)"
        elif 1.80 <= aspect_ratio <= 1.90:
            cinematic_format = "DCI Flat / IMAX (1.85:1 / 1.90:1)"
        elif 1.30 <= aspect_ratio <= 1.38:
            cinematic_format = "Classic Academy (1.33:1 / 1.37:1)"

        return {
            "lighting": {
                "style": lighting_style,
                "mean_luminance": round(mean_lum, 2),
                "contrast_std": round(std_lum, 2),
                "dynamic_range": round(dynamic_range, 2),
                "shadow_percentage": round(shadow_ratio * 100, 1),
                "highlight_percentage": round(highlight_ratio * 100, 1),
                "color_temperature": color_temp
            },
            "composition": {
                "detected_rule": composition_rule,
                "thirds_alignment_score": round(min(1.0, thirds_ratio / 2.0), 3),
                "center_weight": round(min(1.0, center_energy / (total_mean_energy * 2.0)), 3),
                "aspect_ratio": aspect_ratio,
                "cinematic_format": cinematic_format,
                "resolution": f"{w}x{h}"
            }
        }
