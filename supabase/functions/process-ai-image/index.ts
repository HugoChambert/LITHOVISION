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

    const azureEndpoint = Deno.env.get("AZURE_OPENAI_ENDPOINT");
    const azureApiKey = Deno.env.get("AZURE_OPENAI_KEY");
    const deploymentName = Deno.env.get("AZURE_OPENAI_DEPLOYMENT") || "dall-e-3";

    if (!azureEndpoint || !azureApiKey) {
      throw new Error("Azure OpenAI credentials not configured");
    }

    const originalImageResponse = await fetch(originalImageUrl);
    const originalImageBlob = await originalImageResponse.blob();
    const originalImageBuffer = await originalImageBlob.arrayBuffer();
    const originalImageBase64 = btoa(String.fromCharCode(...new Uint8Array(originalImageBuffer)));

    const maskImageResponse = await fetch(maskImageUrl);
    const maskImageBlob = await maskImageResponse.blob();
    const maskImageBuffer = await maskImageBlob.arrayBuffer();
    const maskImageBase64 = btoa(String.fromCharCode(...new Uint8Array(maskImageBuffer)));

    const prompt = `Transform the kitchen countertop surface in the selected area with ${selectedStone.name} ${selectedStone.type} material.
Stone details: ${selectedStone.description}.
Pattern type: ${selectedStone.pattern}.
IMPORTANT: The selected area is a horizontal countertop surface used for food preparation. Apply the stone texture realistically across the flat countertop plane, maintaining:
- Natural stone veining and pattern flow appropriate for countertop installation
- Realistic lighting and reflections on the polished surface
- Proper perspective and depth for a horizontal surface
- Seamless edges where countertop meets walls or backsplash
- Authentic shadows cast by objects on the counter
- Natural color variations and texture detail typical of real ${selectedStone.type}
Adjustments: Brightness ${adjustments.brightness}, Contrast ${adjustments.contrast}, Scale ${adjustments.scale}.`;

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
        message: "Image processed successfully with Azure OpenAI",
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