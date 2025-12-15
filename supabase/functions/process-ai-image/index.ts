import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProcessRequest {
  originalImageUrl: string;
  maskImageUrl: string;
  selectedStone: {
    name: string;
    type: string;
    description: string;
    pattern: string;
    color_family?: string;
    finish?: string;
    texture_scale?: number;
  };
  adjustments: {
    brightness: number;
    contrast: number;
    scale: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { originalImageUrl, maskImageUrl, selectedStone, adjustments }: ProcessRequest = await req.json();

    console.log(`Processing with user-selected stone: ${selectedStone.name} (${selectedStone.type})`);
    console.log(`Stone details - Pattern: ${selectedStone.pattern}, Color: ${selectedStone.color_family || 'natural'}, Finish: ${selectedStone.finish || 'polished'}`);

    const azureEndpoint = Deno.env.get("AZURE_OPENAI_ENDPOINT");
    const azureApiKey = Deno.env.get("AZURE_OPENAI_KEY");
    const deploymentName = Deno.env.get("AZURE_OPENAI_DEPLOYMENT") || "dall-e-3";

    if (!azureEndpoint || !azureApiKey) {
      throw new Error("Azure OpenAI credentials not configured. This function strictly uses Azure OpenAI for image processing.");
    }

    const originalImageResponse = await fetch(originalImageUrl);
    const originalImageBlob = await originalImageResponse.blob();
    const originalImageBuffer = await originalImageBlob.arrayBuffer();
    const originalImageBase64 = btoa(String.fromCharCode(...new Uint8Array(originalImageBuffer)));

    const maskImageResponse = await fetch(maskImageUrl);
    const maskImageBlob = await maskImageResponse.blob();
    const maskImageBuffer = await maskImageBlob.arrayBuffer();
    const maskImageBase64 = btoa(String.fromCharCode(...new Uint8Array(maskImageBuffer)));

    const prompt = `CRITICAL: Apply EXACTLY ${selectedStone.name} ${selectedStone.type} material to the horizontal surface.

SELECTED STONE SPECIFICATIONS (USE EXACTLY THESE):
- Material Name: ${selectedStone.name}
- Stone Type: ${selectedStone.type}
- Color Family: ${selectedStone.color_family || 'natural'}
- Pattern: ${selectedStone.pattern}
- Finish: ${selectedStone.finish || 'polished'}
- Description: ${selectedStone.description}
- Texture Scale: ${selectedStone.texture_scale || 1.0}

SURFACE CONTEXT:
The selected area is a horizontal surface (kitchen countertop, bathroom vanity, dining table, or similar flat surface). Automatically recognize the surface type and apply the EXACT stone material specified above.

RENDERING REQUIREMENTS:
Must apply ${selectedStone.name} with these exact characteristics:
- Pattern style MUST match: ${selectedStone.pattern}
- Color tones MUST match ${selectedStone.color_family || 'natural'} family
- Surface finish MUST be: ${selectedStone.finish || 'polished'}
- Natural stone veining and pattern flow appropriate for ${selectedStone.type}
- Realistic lighting and reflections on the ${selectedStone.finish || 'polished'} surface
- Proper perspective and depth for horizontal plane
- Seamless edges where surface meets walls or backsplash
- Authentic shadows from objects on the surface
- Texture scale at ${selectedStone.texture_scale || 1.0}x for realistic material representation
- Consistent ${selectedStone.name} appearance across entire selected surface

Material adjustments: Brightness ${adjustments.brightness}, Contrast ${adjustments.contrast}, Scale ${adjustments.scale}.

REMINDER: The user specifically selected ${selectedStone.name} - apply ONLY this exact material, not similar alternatives.`;

    const apiUrl = `${azureEndpoint}/openai/deployments/${deploymentName}/images/edits?api-version=2024-02-01`;

    const formData = new FormData();
    formData.append("image", new Blob([originalImageBuffer], { type: "image/png" }), "image.png");
    formData.append("mask", new Blob([maskImageBuffer], { type: "image/png" }), "mask.png");
    formData.append("prompt", prompt);
    formData.append("n", "1");
    formData.append("size", "1024x1024");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "api-key": azureApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const editedImageUrl = result.data[0].url;

    const editedImageResponse = await fetch(editedImageUrl);
    const editedImageBlob = await editedImageResponse.blob();
    const editedImageBuffer = await editedImageBlob.arrayBuffer();
    const editedImageBase64 = btoa(String.fromCharCode(...new Uint8Array(editedImageBuffer)));

    return new Response(
      JSON.stringify({
        success: true,
        resultImageBase64: editedImageBase64,
        message: `Image processed successfully with Azure OpenAI using ${selectedStone.name}`,
        appliedStone: {
          name: selectedStone.name,
          type: selectedStone.type,
          pattern: selectedStone.pattern,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing image:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
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