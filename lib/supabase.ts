import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://beruaiestzghkwajerrh.supabase.co'
const supabaseKey = 'sb_publishable_5v-bd943gYRZ8UDkm6DI8w_dw9RVR2O'

export const supabase = createClient(supabaseUrl, supabaseKey)
