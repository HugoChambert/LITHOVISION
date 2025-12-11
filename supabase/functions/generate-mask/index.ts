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

    const imageResponse = await fetch(publicUrl);
    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    
    const imageBitmap = await createImageBitmap(new Blob([arrayBuffer]));
    
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imageBitmap, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = new Uint8ClampedArray(imageData.data.length);
    
    const tolerance = 30;
    const targetPixel = getPixel(imageData, click_x, click_y);
    
    floodFill(imageData, maskData, click_x, click_y, targetPixel, tolerance);
    
    for (let i = 0; i < maskData.length; i += 4) {
      const alpha = maskData[i + 3];
      maskData[i] = alpha;
      maskData[i + 1] = alpha;
      maskData[i + 2] = alpha;
      maskData[i + 3] = 255;
    }
    
    const maskImageData = new ImageData(maskData, canvas.width, canvas.height);
    ctx.putImageData(maskImageData, 0, 0);
    
    const maskBlob = await canvas.convertToBlob({ type: 'image/png' });
    
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
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function floodFill(
  imageData: ImageData,
  maskData: Uint8ClampedArray,
  x: number,
  y: number,
  targetColor: [number, number, number],
  tolerance: number
) {
  const width = imageData.width;
  const height = imageData.height;
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
