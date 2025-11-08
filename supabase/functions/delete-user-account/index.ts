// =============================================================================
// Supabase Edge Function: Delete User Account
// Description: Completely deletes a user account including all associated data
// Author: Claude Code
// Date: 2025-11-05
// =============================================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Get the authorization token from the request header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const errorResponse = {
        success: false,
        error: 'Missing authorization header'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create a Supabase client with the user's auth token
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      const errorResponse = {
        success: false,
        error: 'Unauthorized - invalid token',
        details: userError?.message
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create a Supabase admin client with service role key
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const userId = user.id;
    console.log(`Starting account deletion for user: ${userId}`);
    // Track deletion results
    let avatarDeleted = false;
    let userDeleted = false;
    // Step 1: Delete user's avatar from storage bucket (if exists)
    try {
      // List all files in the user's avatar folder
      const { data: files, error: listError } = await supabaseAdmin.storage.from('avatars').list(userId);
      if (listError) {
        console.error('Error listing avatar files:', listError);
      } else if (files && files.length > 0) {
        // Delete all files in the user's folder
        const filePaths = files.map((file)=>`${userId}/${file.name}`);
        const { error: deleteError } = await supabaseAdmin.storage.from('avatars').remove(filePaths);
        if (deleteError) {
          console.error('Error deleting avatar files:', deleteError);
        } else {
          console.log(`Deleted ${filePaths.length} avatar file(s)`);
          avatarDeleted = true;
        }
      } else {
        console.log('No avatar files to delete');
        avatarDeleted = true;
      }
    } catch (error) {
      console.error('Exception while deleting avatar:', error);
    // Continue with user deletion even if avatar deletion fails
    }
    // Step 2: Delete user from auth.users
    // This will cascade delete to all related data due to foreign key constraints:
    // - profiles (ON DELETE CASCADE)
    // - sessions (created_by -> profiles -> auth.users)
    // - session_participants (user_id -> profiles -> auth.users)
    // - drink_entries (user_id -> profiles -> auth.users)
    // - friendships (user_id/friend_id -> profiles -> auth.users)
    // - active_sessions (user_id -> profiles -> auth.users)
    try {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteUserError) {
        console.error('Error deleting user:', deleteUserError);
        const errorResponse = {
          success: false,
          error: 'Failed to delete user account',
          details: deleteUserError.message
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      console.log('User account deleted successfully');
      userDeleted = true;
    } catch (error) {
      console.error('Exception while deleting user:', error);
      const errorResponse = {
        success: false,
        error: 'Failed to delete user account',
        details: error instanceof Error ? error.message : String(error)
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Return success response
    const successResponse = {
      success: true,
      message: 'Account deleted successfully',
      deleted_data: {
        avatar_deleted: avatarDeleted,
        user_deleted: userDeleted
      }
    };
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorResponse = {
      success: false,
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
