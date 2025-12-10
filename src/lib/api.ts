const API_URL = 'http://localhost:8000';

export interface UploadResponse {
  image_id: string;
  image_url: string;
  message: string;
}

export interface JobStatus {
  job_id: string;
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

export async function uploadMask(maskBlob: Blob): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', maskBlob, 'mask.png');

  const response = await fetch(`${API_URL}/api/upload-mask`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload mask');
  }

  return response.json();
}

export async function processStoneReplacement(
  imageId: string,
  maskId: string,
  stoneMaterial: any,
  scale?: number,
  orientation?: number
): Promise<{ job_id: string }> {
  const response = await fetch(`${API_URL}/api/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_id: imageId,
      mask_data: maskId,
      stone_material: {
        ...stoneMaterial,
        texture_scale: scale || stoneMaterial.texture_scale,
        metadata: {
          ...stoneMaterial.metadata,
          vein_orientation: orientation || 0,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to start processing');
  }

  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_URL}/api/job/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to get job status');
  }

  return response.json();
}

export function getImageUrl(path: string): string {
  return `${API_URL}${path}`;
}
