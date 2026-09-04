const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

const getSupabaseConfigurationError = () => {
  if (!supabaseUrl || !supabasePublishableKey) {
    return 'SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured.';
  }

  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
      return 'SUPABASE_URL must be a valid hosted Supabase HTTPS URL.';
    }
  } catch (error) {
    return 'SUPABASE_URL must be a valid hosted Supabase HTTPS URL.';
  }

  return null;
};

const supabaseConfigurationError = getSupabaseConfigurationError();
const supabase = supabaseConfigurationError
  ? null
  : createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      }
    });

const isSupabaseConfigured = () => !supabaseConfigurationError;

const getSupabaseClient = () => {
  if (!supabase) {
    const error = new Error(supabaseConfigurationError);
    error.code = 'SUPABASE_NOT_CONFIGURED';
    throw error;
  }
  return supabase;
};

module.exports = {
  getSupabaseClient,
  isSupabaseConfigured,
  supabaseConfigurationError
};
