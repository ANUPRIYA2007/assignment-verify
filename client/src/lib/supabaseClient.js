import { createClient } from '@supabase/supabase-js';

// Public anon key — safe for client-side use (RLS enforced on Supabase)
const SUPABASE_URL = 'https://ifabspeeahpnqmkdxiey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWJzcGVlYWhwbnFta2R4aWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODU0MzIsImV4cCI6MjA4NjU2MTQzMn0.UzXJUZRZzVjSvWnn7ExkrVFUAET5jkeb_lhsPKCsJlI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

export default supabase;
