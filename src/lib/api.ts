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

  simulateProcessing(data.id);

  return { task_id: data.id };
}

async function simulateProcessing(jobId: string) {
  await new Promise(resolve => setTimeout(resolve, 1000));

  await supabase
    .from('processing_jobs')
    .update({ status: 'processing', progress: 25 })
    .eq('id', jobId);

  await new Promise(resolve => setTimeout(resolve, 1500));

  await supabase
    .from('processing_jobs')
    .update({ status: 'processing', progress: 50 })
    .eq('id', jobId);

  await new Promise(resolve => setTimeout(resolve, 1500));

  await supabase
    .from('processing_jobs')
    .update({ status: 'processing', progress: 75 })
    .eq('id', jobId);

  await new Promise(resolve => setTimeout(resolve, 1000));

  await supabase
    .from('processing_jobs')
    .update({
      status: 'completed',
      progress: 100,
      result_url: 'https://via.placeholder.com/800x600/4a5568/ffffff?text=AI+Processing+Complete'
    })
    .eq('id', jobId);
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
