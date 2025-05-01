// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcndotdvcidiceypknyc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbmRvdGR2Y2lkaWNleXBrbnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5MDM1NjIsImV4cCI6MjA2MTQ3OTU2Mn0.zijrBHV72KJwfYoCVZIHXUbg3hEN6hSgWkvPbVl-ryM';

export const supabase = createClient(supabaseUrl, supabaseKey);
