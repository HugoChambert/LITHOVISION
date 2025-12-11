import { supabase } from './supabase';

export interface UploadResponse {
  image_id: string;
  image_url: string;
  message: string;
}

export interface MaskResponse {
  mask_id: string;
  mask_url: string;
  message: string;
}

export interface TaskStatus {
  task_id: string;
  status: string;
  progress?: number;
  result_url?: string;
  error?: string;
}

export async function uploadImage(file: File | Blob, filename?: string): Promise<UploadResponse> {
  const fileName = filename || `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from('stone-images')
    .upload(filePath, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('stone-images')
    .getPublicUrl(data.path);

  return {
    image_id: data.path,
    image_url: publicUrl,
    message: 'Image uploaded successfully'
  };
}

export async function generateMask(imageId: string, clickX: number, clickY: number): Promise<MaskResponse> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const response = await fetch(`${apiUrl}/mask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_id: imageId,
      click_x: clickX,
      click_y: clickY
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate mask');
  }

  return response.json();
}

export async function uploadMask(maskBlob: Blob): Promise<UploadResponse> {
  const fileName = `mask_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
  const filePath = `masks/${fileName}`;

  const { data, error } = await supabase.storage
    .from('stone-images')
    .upload(filePath, maskBlob, {
      contentType: 'image/png',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload mask: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('stone-images')
    .getPublicUrl(data.path);

  return {
    image_id: data.path,
    image_url: publicUrl,
    message: 'Mask uploaded successfully'
  };
}

export async function generateStoneReplacement(
  imageId: string,
  maskId: string,
  stoneMaterial: any
): Promise<{ task_id: string }> {
  const { data, error } = await supabase
    .from('processing_jobs')
    .insert({
      image_id: imageId,
      mask_id: maskId,
      stone_material: stoneMaterial,
      status: 'pending',
      progress: 0
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create processing job: ${error.message}`);
  }

  processWithAI(data.id, imageId, maskId, stoneMaterial);

  return { task_id: data.id };
}

async function processWithAI(jobId: string, imageId: string, maskId: string, stoneMaterial: any) {
  try {
    await supabase
      .from('processing_jobs')
      .update({ status: 'processing', progress: 10 })
      .eq('id', jobId);

    const originalImageUrl = getImageUrl(imageId);
    const maskImageUrl = getImageUrl(maskId);

    await supabase
      .from('processing_jobs')
      .update({ status: 'processing', progress: 20 })
      .eq('id', jobId);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-ai-image`;

    const { data: { session } } = await supabase.auth.getSession();

    await supabase
      .from('processing_jobs')
      .update({ status: 'processing', progress: 30 })
      .eq('id', jobId);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalImageUrl,
        maskImageUrl,
        selectedStone: stoneMaterial,
        adjustments: stoneMaterial.adjustments || {
          brightness: 1.0,
          contrast: 1.0,
          scale: 1.0
        }
      })
    });

    await supabase
      .from('processing_jobs')
      .update({ status: 'processing', progress: 80 })
      .eq('id', jobId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'AI processing failed');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'AI processing failed');
    }

    const resultBlob = await fetch(`data:image/png;base64,${result.resultImageBase64}`).then(r => r.blob());
    const resultFileName = `result_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const resultFilePath = `results/${resultFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('stone-images')
      .upload(resultFilePath, resultBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload result: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('stone-images')
      .getPublicUrl(uploadData.path);

    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        progress: 100,
        result_url: publicUrl
      })
      .eq('id', jobId);

  } catch (error) {
    console.error('AI processing error:', error);
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
      .eq('id', jobId);
  }
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const { data, error } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    throw new Error(`Failed to get task status: ${error.message}`);
  }

  return {
    task_id: data.id,
    status: data.status,
    progress: data.progress,
    result_url: data.result_url,
    error: data.error_message
  };
}

export function getImageUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('stone-images')
    .getPublicUrl(path);

  return publicUrl;
}
