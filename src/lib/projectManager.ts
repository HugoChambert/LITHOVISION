import { supabase } from './supabase';
import { type StoneMaterial } from './supabase';

export interface UserProject {
  id: string;
  user_id: string;
  name: string;
  original_image_url: string;
  result_image_url: string | null;
  mask_image_url: string | null;
  stone_material_id: string | null;
  stone_material?: StoneMaterial;
  processing_status: 'draft' | 'processing' | 'completed' | 'failed';
  share_token: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  original_image_url: string;
  result_image_url?: string;
  mask_image_url?: string;
  stone_material_id?: string;
  processing_status?: 'draft' | 'processing' | 'completed' | 'failed';
}

export interface UpdateProjectData {
  name?: string;
  result_image_url?: string;
  mask_image_url?: string;
  stone_material_id?: string;
  processing_status?: 'draft' | 'processing' | 'completed' | 'failed';
}

export async function createProject(userId: string, data: CreateProjectData): Promise<UserProject> {
  const { data: project, error } = await supabase
    .from('user_projects')
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return project;
}

export async function updateProject(projectId: string, data: UpdateProjectData): Promise<UserProject> {
  const { data: project, error } = await supabase
    .from('user_projects')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return project;
}

export async function getUserProjects(userId: string): Promise<UserProject[]> {
  const { data, error } = await supabase
    .from('user_projects')
    .select(`
      *,
      stone_material:stone_materials(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data as UserProject[];
}

export async function getProject(projectId: string): Promise<UserProject> {
  const { data, error } = await supabase
    .from('user_projects')
    .select(`
      *,
      stone_material:stone_materials(*)
    `)
    .eq('id', projectId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  return data as UserProject;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('user_projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

export async function generateShareLink(projectId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_share_token');

  if (error || !data) {
    throw new Error('Failed to generate share token');
  }

  const shareToken = data;

  const { error: updateError } = await supabase
    .from('user_projects')
    .update({
      share_token: shareToken,
      is_public: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (updateError) {
    throw new Error(`Failed to enable sharing: ${updateError.message}`);
  }

  return `${window.location.origin}/shared/${shareToken}`;
}

export async function disableSharing(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('user_projects')
    .update({
      is_public: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) {
    throw new Error(`Failed to disable sharing: ${error.message}`);
  }
}

export async function getSharedProject(shareToken: string): Promise<UserProject | null> {
  const { data, error } = await supabase
    .from('user_projects')
    .select(`
      *,
      stone_material:stone_materials(*)
    `)
    .eq('share_token', shareToken)
    .eq('is_public', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch shared project: ${error.message}`);
  }

  return data as UserProject | null;
}
