import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Initialize client only if URL and Anon Key are present
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);

export interface SyncResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Checks if the Supabase table 'app_state' is accessible.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tableExists: boolean }> {
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase credentials are not configured in your environment properties.',
      tableExists: false,
    };
  }

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('key')
      .limit(1);

    if (error) {
      // Check if error corresponds to "relation does not exist"
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! However, the "app_state" table does not exist in your database yet. Please run the SQL initialization script.',
          tableExists: false,
        };
      }
      return {
        success: false,
        message: `API query error during connection check: ${error.message} (Code: ${error.code})`,
        tableExists: false,
      };
    }

    return {
      success: true,
      message: 'Successfully connected and verified the "app_state" database table!',
      tableExists: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Critically failed to connect: ${err?.message || err}`,
      tableExists: false,
    };
  }
}

/**
 * Backs up all the individual keys to Supabase database.
 */
export async function pushDataToSupabase(keys: { [key: string]: any }): Promise<SyncResult> {
  if (!supabase) {
    return { success: false, message: 'Supabase client has not been configured.' };
  }

  try {
    // Retrieve currently logged-in user to map the tenant context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: 'No authenticated operator session found. Cloud backup aborted.' };
    }

    const rows = Object.entries(keys).map(([key, value]) => ({
      tenant_id: user.id,
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    // Perform upserts key-by-key targeting the composite unique constraint (tenant_id, key)
    for (const row of rows) {
      const { error } = await supabase
        .from('app_state')
        .upsert(row, { onConflict: 'tenant_id,key' });

      if (error) {
        throw new Error(`Failed to upsert key "${row.key}": ${error.message}`);
      }
    }

    return {
      success: true,
      message: `Successfully backed up ${rows.length} modules to your cloud Supabase database!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to push data to Supabase.',
      error: err?.message || String(err),
    };
  }
}

/**
 * Retrieves all backed up state keys from Supabase tables.
 */
export async function pullDataFromSupabase(): Promise<{ success: boolean; data?: { [key: string]: any }; message: string; error?: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase is not configured.' };
  }

  try {
    // Validate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: 'No authenticated session. Access denied.' };
    }

    // Explicitly filter by tenant_id to guarantee database isolation
    const { data, error } = await supabase
      .from('app_state')
      .select('key, value')
      .eq('tenant_id', user.id);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No backed up data found in your Supabase "app_state" table yet.',
      };
    }

    const stateMap: { [key: string]: any } = {};
    data.forEach((row) => {
      stateMap[row.key] = row.value;
    });

    return {
      success: true,
      data: stateMap,
      message: `Retrieved ${data.length} data modules from your Supabase cloud successfully!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to retrieve data from Supabase.',
      error: err?.message || String(err),
    };
  }
}
