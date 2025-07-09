import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://opjjgimtbjmcxosulekj.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-service-role-key'; // Replace with your service role key

export const supabase = createClient(supabaseUrl, supabaseKey);