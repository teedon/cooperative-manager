import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfczybbaqrghesocwhuc.supabase.co'; // Update with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmY3p5YmJhcXJnaGVzb2N3aHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjU1MDAsImV4cCI6MjA4MDkwMTUwMH0.go45qX3hE2ikzhyEJhPEI4xD2QAJvfSXyvVqWQdJsi4'; // Update with your Supabase anon key

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We handle auth separately with JWT
  },
});
