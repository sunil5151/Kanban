import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opjjgimtbjmcxosulekj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'your-anon-key'; // Replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseKey);