const API_URL = 'http://localhost:8000';

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

export interface DepthResponse {
  depth_id: string;
  depth_url: string;
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
  const formData = new FormData();
  formData.append('file', file, filename || 'image.jpg');

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
}

export async function generateMask(imageId: string): Promise<MaskResponse> {
  const response = await fetch(`${API_URL}/api/mask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_id: imageId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate mask');
  }

  return response.json();
}

export async function generateDepth(imageId: string): Promise<DepthResponse> {
  const response = await fetch(`${API_URL}/api/depth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_id: imageId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate depth map');
  }

  return response.json();
}

export async function uploadMask(maskBlob: Blob): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', maskBlob, 'mask.png');

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload mask');
  }

  return response.json();
}

export async function generateStoneReplacement(
  imageId: string,
  maskId: string,
  stoneMaterial: any,
  scale?: number,
  orientation?: number
): Promise<{ task_id: string }> {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_id: imageId,
      mask_id: maskId,
      stone_material: stoneMaterial,
      scale: scale || 1.0,
      orientation: orientation || 0,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to start generation');
  }

  return response.json();
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await fetch(`${API_URL}/api/status/${taskId}`);

  if (!response.ok) {
    throw new Error('Failed to get task status');
  }

  return response.json();
}

export async function getResult(taskId: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/result/${taskId}`);

  if (!response.ok) {
    throw new Error('Failed to get result');
  }

  return response.blob();
}

export function getImageUrl(path: string): string {
  return `${API_URL}${path}`;
}
