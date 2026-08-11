import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type'}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok',{headers:cors})
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const publishableMap = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}')
    const secretMap = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
    const publishable = publishableMap.default || Deno.env.get('SUPABASE_ANON_KEY')!
    const secret = secretMap.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const auth = req.headers.get('Authorization') || ''
    const userClient = createClient(url,publishable,{global:{headers:{Authorization:auth}}})
    const admin = createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data:{user},error:userErr}=await userClient.auth.getUser()
    if(userErr||!user) throw new Error('Nicht angemeldet')
    const body=await req.json()
    const action=body.action
    const {data:isPlatform}=await admin.from('vt_platform_admins').select('user_id').eq('user_id',user.id).eq('active',true).maybeSingle()
    if(action==='create_club'){
      if(!isPlatform) throw new Error('Nur Superadmins duerfen Vereine anlegen')
      const {club_name,team_name='Volleyball',admin_email,redirect_to}=body
      const slug=String(club_name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+crypto.randomUUID().slice(0,6)
      const {data:club,error:ce}=await admin.from('vt_clubs').insert({name:club_name,slug}).select().single(); if(ce) throw ce
      const {data:team,error:te}=await admin.from('vt_teams').insert({club_id:club.id,name:team_name}).select().single(); if(te) throw te
      await admin.from('vt_team_states').insert({team_id:team.id,payload:null})
      const {data:invite,error:ie}=await admin.auth.admin.inviteUserByEmail(admin_email,{redirectTo:redirect_to}); if(ie) throw ie
      const uid=invite.user.id
      await admin.from('vt_profiles').upsert({user_id:uid})
      const {data:m,error:me}=await admin.from('vt_club_memberships').upsert({user_id:uid,club_id:club.id,active:true},{onConflict:'user_id,club_id'}).select().single(); if(me) throw me
      await admin.from('vt_club_member_roles').upsert([{membership_id:m.id,role:'club_admin'}])
      return Response.json({ok:true,club_id:club.id},{headers:cors})
    }
    if(action==='invite_member'){
      const {club_id,email,roles=['viewer'],redirect_to}=body
      const {data:m}=await admin.from('vt_club_memberships').select('id').eq('user_id',user.id).eq('club_id',club_id).eq('active',true).maybeSingle()
      let allowed=Boolean(isPlatform)
      if(m){const {data:r}=await admin.from('vt_club_member_roles').select('role').eq('membership_id',m.id).eq('role','club_admin').maybeSingle();allowed=allowed||Boolean(r)}
      if(!allowed) throw new Error('Keine Admin-Berechtigung')
      const {data:invite,error:ie}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:redirect_to}); if(ie) throw ie
      const uid=invite.user.id
      await admin.from('vt_profiles').upsert({user_id:uid})
      const {data:mem,error:me}=await admin.from('vt_club_memberships').upsert({user_id:uid,club_id,active:true},{onConflict:'user_id,club_id'}).select().single(); if(me) throw me
      const safeRoles=(roles as string[]).filter(x=>['viewer','editor','club_admin'].includes(x))
      if(safeRoles.length) await admin.from('vt_club_member_roles').upsert(safeRoles.map(role=>({membership_id:mem.id,role})))
      return Response.json({ok:true},{headers:cors})
    }
    throw new Error('Unbekannte Aktion')
  } catch (e) {
    return Response.json({ok:false,error:e instanceof Error?e.message:String(e)},{status:400,headers:cors})
  }
})
