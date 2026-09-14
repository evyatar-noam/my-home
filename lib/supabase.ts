import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vhnrmebcjoovqutvkfrq.supabase.co'
const supabaseAnonKey = 'sb_publishable_AAJWnorc_NR6v2NuiFlVGA_2TTIzAQu'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)