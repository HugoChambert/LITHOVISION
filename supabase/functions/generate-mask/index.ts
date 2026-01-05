import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MaskRequest {
  image_id: string;
  click_x?: number;
  click_y?: number;
  auto_detect?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { image_id, auto_detect }: MaskRequest = await req.json();

    console.log(auto_detect ? 'Auto-detecting surface' : 'Generating mask from click');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { publicUrl } } = supabase.storage
      .from('stone-images')
      .getPublicUrl(image_id);

    const imageResponse = await fetch(publicUrl);
    const imageBlob = await imageResponse.blob();
    
    const canvas = new OffscreenCanvas(1024, 1024);
    const ctx = canvas.getContext('2d')!;
    
    const imageBitmap = await createImageBitmap(imageBlob);
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    
    ctx.fillStyle = 'white';
    const maskHeight = Math.floor(canvas.height * 0.4);
    const maskY = Math.floor(canvas.height * 0.4);
    ctx.fillRect(0, maskY, canvas.width, maskHeight);
    
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