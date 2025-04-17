import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with demo placeholders
// NOTE: These are non-functional placeholder values for demo purposes only
const supabaseUrl = 'https://REMOVED-FOR-DEMO.supabase.co';
const supabaseAnonKey = 'REMOVED-FOR-DEMO';

// Create Supabase client
// This client will not work in the demo environment
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 