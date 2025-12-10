import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StoneMaterial = {
  id: string;
  name: string;
  type: 'granite' | 'marble' | 'quartz';
  description: string;
  image_url: string;
  thumbnail_url: string | null;
  texture_scale: number;
  metadata: Record<string, any>;
  is_active: boolean;
  sort_order: number;
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
