import { hasSupabase } from "@/lib/env";
import { fileAdapter } from "./file-adapter";
import { supabaseAdapter } from "./supabase-adapter";

export const db = hasSupabase() ? supabaseAdapter : fileAdapter;
