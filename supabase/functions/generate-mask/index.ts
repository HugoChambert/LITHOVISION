import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MaskRequest {
  image_id: string;
  click_x: number;
  click_y: number;
}

async function generateMaskWithReplicate(imageUrl: string, clickX: number, clickY: number): Promise<string> {
  const replicateApiKey = Deno.env.get('REPLICATE_API_TOKEN');

  if (!replicateApiKey) {
    console.warn('REPLICATE_API_TOKEN not set, falling back to local algorithm');
    return '';
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'cd86552f6c8fe925d9900f1b3e865c68fdd7c3d46d9f4f2f7d6f7c7b5a1a2b3c',
        input: {
          image: imageUrl,
          point_coords: `[[${clickX},${clickY}]]`,
          point_labels: '[1]',
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    const predictionId = prediction.id;

    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${replicateApiKey}`,
        }
      });

      const statusData = await statusResponse.json();

      if (statusData.status === 'succeeded') {
        return statusData.output;
      } else if (statusData.status === 'failed') {
        throw new Error('Replicate prediction failed');
      }
    }

    throw new Error('Replicate prediction timeout');
  } catch (error) {
    console.error('Replicate error:', error);
    return '';
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { image_id, click_x, click_y }: MaskRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { publicUrl } } = supabase.storage
      .from('stone-images')
      .getPublicUrl(image_id);

    let maskBlob: Blob;
    const replicateMaskUrl = await generateMaskWithReplicate(publicUrl, click_x, click_y);

    if (replicateMaskUrl) {
      const maskResponse = await fetch(replicateMaskUrl);
      maskBlob = await maskResponse.blob();
    } else {
      const maskCanvas = document.createElement('canvas') as any;
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = publicUrl;
      });

      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      const maskCtx = maskCanvas.getContext('2d')!;

      const tempCanvas = document.createElement('canvas') as any;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);

      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      const maskData = new Uint8ClampedArray(imageData.data.length).fill(0);

      const targetPixel = getPixel(imageData, click_x, click_y);
      const tolerance = calculateAdaptiveTolerance(imageData, click_x, click_y, img.width, img.height);

      floodFill(imageData, maskData, img.width, img.height, click_x, click_y, targetPixel, tolerance);

      morphologicalClose(maskData, img.width, img.height, 2);
      removeSmallRegions(maskData, img.width, img.height, 50);

      for (let i = 0; i < maskData.length; i += 4) {
        const alpha = maskData[i + 3];
        maskData[i] = alpha;
        maskData[i + 1] = alpha;
        maskData[i + 2] = alpha;
        maskData[i + 3] = 255;
      }

      const maskImageData = new ImageData(maskData, img.width, img.height);
      maskCtx.putImageData(maskImageData, 0, 0);

      maskBlob = await new Promise<Blob>((resolve) => {
        maskCanvas.toBlob((blob: Blob) => resolve(blob!), 'image/png');
      });
    }

    const fileName = `mask_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const filePath = `masks/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('stone-images')
      .upload(filePath, maskBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload mask: ${uploadError.message}`);
    }

    const { data: { publicUrl: maskUrl } } = supabase.storage
      .from('stone-images')
      .getPublicUrl(uploadData.path);

    return new Response(
      JSON.stringify({
        mask_id: uploadData.path,
        mask_url: maskUrl,
        message: 'Mask generated successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error generating mask:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function getPixel(imageData: ImageData, x: number, y: number): [number, number, number] {
  const i = (y * imageData.width + x) * 4;
  return [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];
}

function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

function calculateAdaptiveTolerance(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): number {
  const sampleRadius = 5;
  const samples: [number, number, number][] = [];

  for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
    for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
      const sx = x + dx;
      const sy = y + dy;
      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        samples.push(getPixel(imageData, sx, sy));
      }
    }
  }

  const centerColor = getPixel(imageData, x, y);
  let totalVariance = 0;

  for (const sample of samples) {
    totalVariance += colorDistance(centerColor, sample);
  }

  const avgVariance = totalVariance / samples.length;
  const baseTolerance = 35;
  const adaptiveTolerance = Math.max(25, Math.min(60, baseTolerance + avgVariance * 0.5));

  return adaptiveTolerance;
}

function morphologicalClose(
  maskData: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) {
  const temp = new Uint8ClampedArray(maskData.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            maxVal = Math.max(maxVal, maskData[i + 3]);
          }
        }
      }
      const i = (y * width + x) * 4;
      temp[i + 3] = maxVal;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 255;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            minVal = Math.min(minVal, temp[i + 3]);
          }
        }
      }
      const i = (y * width + x) * 4;
      maskData[i + 3] = minVal;
    }
  }
}

function removeSmallRegions(
  maskData: Uint8ClampedArray,
  width: number,
  height: number,
  minSize: number
) {
  const visited = new Uint8Array(width * height);
  const regions: { size: number; pixels: number[] }[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const idx = y * width + x;

      if (maskData[i + 3] > 0 && !visited[idx]) {
        const region: number[] = [];
        const queue: [number, number][] = [[x, y]];

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          const cidx = cy * width + cx;

          if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
          if (visited[cidx]) continue;

          const ci = (cy * width + cx) * 4;
          if (maskData[ci + 3] === 0) continue;

          visited[cidx] = 1;
          region.push(cidx);

          queue.push([cx + 1, cy]);
          queue.push([cx - 1, cy]);
          queue.push([cx, cy + 1]);
          queue.push([cx, cy - 1]);
        }

        regions.push({ size: region.length, pixels: region });
      }
    }
  }

  regions.sort((a, b) => b.size - a.size);

  for (let i = 1; i < regions.length; i++) {
    if (regions[i].size < minSize) {
      for (const idx of regions[i].pixels) {
        const pi = idx * 4;
        maskData[pi + 3] = 0;
      }
    }
  }
}

function floodFill(
  imageData: ImageData,
  maskData: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  targetColor: [number, number, number],
  tolerance: number
) {
  const visited = new Set<number>();
  const queue: [number, number][] = [[x, y]];
  
  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
    
    const key = cy * width + cx;
    if (visited.has(key)) continue;
    visited.add(key);
    
    const currentColor = getPixel(imageData, cx, cy);
    const distance = colorDistance(currentColor, targetColor);
    
    if (distance <= tolerance) {
      const i = (cy * width + cx) * 4;
      maskData[i + 3] = 255;
      
      queue.push([cx + 1, cy]);
      queue.push([cx - 1, cy]);
      queue.push([cx, cy + 1]);
      queue.push([cx, cy - 1]);
    }
  }
}
