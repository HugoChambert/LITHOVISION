import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StoneMaterial = {
  id: string;
  name: string;
  type: string;
  description: string;
  color_family: string;
  pattern: string;
  finish: string;
  texture_scale: number;
  preview_image_url: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type UserProject = {
  id: string;
  user_id: string;
  name: string;
  original_image_url: string;
  mask_data: string | null;
  selected_stone_id: string | null;
  result_image_url: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

export async function getMaterials(type?: string, colorFamily?: string): Promise<StoneMaterial[]> {
  let query = supabase
    .from('material_presets')
    .select('*')
    .eq('is_active', true);

  if (type) {
    query = query.eq('type', type);
  }
  if (colorFamily) {
    query = query.eq('color_family', colorFamily);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching materials:', error);
    return [];
  }

  return data || [];
}

export async function getMaterial(materialId: string): Promise<StoneMaterial | null> {
  const { data, error } = await supabase
    .from('material_presets')
    .select('*')
    .eq('id', materialId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching material:', error);
    return null;
  }

  return data;
}

export async function getMaterialTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('material_presets')
    .select('type')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching material types:', error);
    return [];
  }

  const types = [...new Set(data.map(item => item.type))];
  return types.sort();
}
