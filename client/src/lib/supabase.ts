import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

export type Database = {
    public: {
        Tables: {
            demos: {
                Row: {
                    id: string;
                    user_id: string;
                    customer_name: string;
                    logo_url: string | null;
                    segment_write_key: string;
                    segment_profile_token: string;
                    segment_unify_space_id: string;
                    frontend_url: string | null;
                    backend_url: string | null;
                    github_repo_url: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    customer_name: string;
                    logo_url?: string | null;
                    segment_write_key: string;
                    segment_profile_token: string;
                    segment_unify_space_id: string;
                    frontend_url?: string | null;
                    backend_url?: string | null;
                    github_repo_url?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    customer_name?: string;
                    logo_url?: string | null;
                    segment_write_key?: string;
                    segment_profile_token?: string;
                    segment_unify_space_id?: string;
                    frontend_url?: string | null;
                    backend_url?: string | null;
                    github_repo_url?: string | null;
                    created_at?: string;
                };
            };
        };
    };
}; 