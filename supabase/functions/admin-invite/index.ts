import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const allowedRoles = new Set(['viewer', 'editor', 'club_admin'])
const allowedTemplateKeys = new Set(['club_member', 'club_admin', 'platform_admin'])
const APP_REDIRECT_URL = 'https://vbcoco.github.io/VB_Aufstellung/'
const defaultTemplates: Record<string, {subject:string, body:string}> = {
  club_member: {
    subject: 'Einladung zum Volleyball Trainer – {{club_name}}',
    body: 'Hallo {{recipient_name}},\n\n{{sender_name}} lädt dich zum Volleyball Trainer von {{club_name}} ein.\n\nDu erhältst die Rolle {{roles}}.\n\nÜber den Button in dieser E-Mail kannst du die Einladung annehmen und anschließend dein Passwort festlegen.\n\nViele Grüße\n{{sender_name}}',
  },
  club_admin: {
    subject: 'Einladung als Vereinsadmin – {{club_name}}',
    body: 'Hallo {{recipient_name}},\n\n{{sender_name}} lädt dich als Vereinsadmin für {{club_name}} zum Volleyball Trainer ein.\n\nAls Vereinsadmin kannst du Benutzer einladen, Rollen verwalten und den Vereinszugang organisieren.\n\nÜber den Button in dieser E-Mail kannst du die Einladung annehmen und anschließend dein Passwort festlegen.\n\nViele Grüße\n{{sender_name}}',
  },
  platform_admin: {
    subject: 'Einladung als Superadmin zum Volleyball Trainer',
    body: 'Hallo {{recipient_name}},\n\n{{sender_name}} lädt dich als Superadmin zum Volleyball Trainer ein.\n\nAls Superadmin kannst du die Plattform, Vereine und administrative Berechtigungen verwalten. Vereinsinhalte werden dadurch nicht automatisch freigeschaltet.\n\nÜber den Button in dieser E-Mail kannst du die Einladung annehmen und anschließend dein Passwort festlegen.\n\nViele Grüße\n{{sender_name}}',
  },
}

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: cors }) }
function cleanText(value: unknown, max: number) { return String(value || '').trim().slice(0, max) }
function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ ok: false, error: 'Nur POST ist erlaubt' }, 405)
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const publishableMap = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}')
    const secretMap = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
    const publishable = publishableMap.default || Deno.env.get('SUPABASE_ANON_KEY')!
    const secret = secretMap.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!url || !publishable || !secret) throw new Error('Supabase-Konfiguration der Edge Function fehlt')

    const auth = req.headers.get('Authorization') || ''
    const userClient = createClient(url, publishable, { global: { headers: { Authorization: auth } } })
    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) throw new Error('Nicht angemeldet')
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')

    const { data: platformRow } = await admin.from('vt_platform_admins').select('user_id').eq('user_id', user.id).eq('active', true).maybeSingle()
    const isPlatform = Boolean(platformRow)
    const { data: callerProfile } = await admin.from('vt_profiles').select('display_name').eq('user_id', user.id).maybeSingle()
    const senderName = callerProfile?.display_name || user.email || 'Administration'

    async function membershipById(membershipId: string) {
      const { data, error } = await admin.from('vt_club_memberships').select('id,user_id,club_id,active').eq('id', membershipId).maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Mitgliedschaft nicht gefunden')
      return data
    }
    async function callerIsClubAdmin(clubId: string) {
      const { data: membership, error } = await admin.from('vt_club_memberships').select('id').eq('user_id', user.id).eq('club_id', clubId).eq('active', true).maybeSingle()
      if (error) throw error
      if (!membership) return false
      const { data: role, error: roleErr } = await admin.from('vt_club_member_roles').select('role').eq('membership_id', membership.id).eq('role', 'club_admin').maybeSingle()
      if (roleErr) throw roleErr
      return Boolean(role)
    }
    async function assertClubManager(clubId: string) {
      if (isPlatform) return { platform: true }
      if (await callerIsClubAdmin(clubId)) return { platform: false }
      throw new Error('Keine Admin-Berechtigung für diesen Verein')
    }
    async function activeClubAdminCount(clubId: string) {
      const { data: memberships, error: membershipErr } = await admin.from('vt_club_memberships').select('id').eq('club_id', clubId).eq('active', true)
      if (membershipErr) throw membershipErr
      const ids = (memberships || []).map(m => m.id)
      if (!ids.length) return 0
      const { data: roles, error: roleErr } = await admin.from('vt_club_member_roles').select('membership_id').in('membership_id', ids).eq('role', 'club_admin')
      if (roleErr) throw roleErr
      return new Set((roles || []).map(r => r.membership_id)).size
    }
    async function findExistingUserByEmail(email: string) {
      const target = email.trim().toLowerCase()
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
        if (error) throw error
        const hit = data.users.find(u => (u.email || '').toLowerCase() === target)
        if (hit) return hit
        if (data.users.length < 100) break
      }
      return null
    }
    async function getAuthUser(userId: string) {
      const { data, error } = await admin.auth.admin.getUserById(userId)
      if (error) throw error
      if (!data.user) throw new Error('Benutzer nicht gefunden')
      return data.user
    }
    async function getClub(clubId: string) {
      const { data, error } = await admin.from('vt_clubs').select('id,name').eq('id', clubId).maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Verein nicht gefunden')
      return data
    }
    async function templateFor(key: string, clubId = '') {
      if (!allowedTemplateKeys.has(key)) throw new Error('Unbekannte Vorlage')
      const scope = key === 'club_member' || (key === 'club_admin' && clubId) ? 'club' : 'platform'
      let q = admin.from('vt_invite_templates').select('subject_template,body_template,updated_at').eq('template_key', key).eq('scope_type', scope)
      q = scope === 'club' ? q.eq('club_id', clubId) : q.is('club_id', null)
      const { data, error } = await q.maybeSingle()
      if (error) throw error
      return data ? { subject: data.subject_template, body: data.body_template, saved: true, updated_at: data.updated_at } : { ...defaultTemplates[key], saved: false, updated_at: null }
    }

    if (action === 'get_invite_template') {
      const key = cleanText(body.template_key, 40)
      const clubId = cleanText(body.club_id, 60)
      if (key === 'club_member' || (key === 'club_admin' && clubId)) { if (!clubId) throw new Error('Verein fehlt'); await assertClubManager(clubId) }
      else if (!isPlatform) throw new Error('Nur Superadmins dürfen diese Vorlage verwalten')
      return json({ ok: true, template: await templateFor(key, clubId) })
    }

    if (action === 'save_invite_template') {
      const key = cleanText(body.template_key, 40)
      const clubId = cleanText(body.club_id, 60)
      const subject = cleanText(body.subject, 180)
      const text = cleanText(body.body, 5000)
      if (!allowedTemplateKeys.has(key) || !subject || !text) throw new Error('Vorlage ist unvollständig')
      const scope = key === 'club_member' || (key === 'club_admin' && clubId) ? 'club' : 'platform'
      if (scope === 'club') { if (!clubId) throw new Error('Verein fehlt'); await assertClubManager(clubId) }
      else if (!isPlatform) throw new Error('Nur Superadmins dürfen diese Vorlage verwalten')
      const row = { scope_type: scope, club_id: scope === 'club' ? clubId : null, template_key: key, subject_template: subject, body_template: text, updated_by: user.id, updated_at: new Date().toISOString() }
      const { error } = await admin.from('vt_invite_templates').upsert(row, { onConflict: 'scope_type,club_key,template_key' })
      if (error) throw error
      return json({ ok: true })
    }

    if (action === 'create_club') {
      if (!isPlatform) throw new Error('Nur Superadmins dürfen neue Vereine anlegen')
      const name = cleanText(body.name, 120)
      const requestedSlug = cleanText(body.slug, 80)
      const teamName = cleanText(body.team_name, 80)
      if (!name) throw new Error('Vereinsname fehlt')
      const slug = slugify(requestedSlug || name)
      if (!slug) throw new Error('Für den Verein konnte kein gültiger Kurzname erzeugt werden')
      const { data: club, error: clubErr } = await admin.from('vt_clubs').insert({ name, slug, active: true }).select('id,name,slug').single()
      if (clubErr) {
        if (String(clubErr.message || '').toLowerCase().includes('duplicate')) throw new Error('Dieser Kurzname / Slug wird bereits verwendet')
        throw clubErr
      }
      if (teamName) {
        const { error: teamErr } = await admin.from('vt_teams').insert({ club_id: club.id, name: teamName, active: true })
        if (teamErr) {
          await admin.from('vt_clubs').delete().eq('id', club.id)
          throw teamErr
        }
      }
      return json({ ok: true, id: club.id, name: club.name, slug: club.slug, team_name: teamName })
    }

    if (action === 'invite_member') {
      const clubId = cleanText(body.club_id, 60)
      const email = cleanText(body.email, 320).toLowerCase()
      const recipientName = cleanText(body.recipient_name, 120)
      const inviteSubject = cleanText(body.invite_subject, 180)
      const inviteBody = cleanText(body.invite_body, 5000)
      if (!clubId || !email || !inviteSubject || !inviteBody) throw new Error('Verein, E-Mail und Einladungstext sind erforderlich')
      const manager = await assertClubManager(clubId)
      let roles = Array.isArray(body.roles) ? body.roles.map(String).filter(r => allowedRoles.has(r)) : ['viewer']
      roles = [...new Set(roles)]
      if (!roles.length) throw new Error('Mindestens eine zulässige Rolle auswählen')
      const requestedKey = cleanText(body.template_key, 40)
      const key = roles.includes('club_admin') ? 'club_admin' : 'club_member'
      if (requestedKey && requestedKey !== key) throw new Error('Vorlage passt nicht zu den ausgewählten Rollen')
      const club = await getClub(clubId)

      let target = await findExistingUserByEmail(email)
      let invited = false
      if (!target) {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: APP_REDIRECT_URL, data: {
          display_name: recipientName,
          club_name: club.name,
          roles,
          invite_type: key,
          invite_subject: inviteSubject,
          invite_body: inviteBody,
          inviter_name: senderName,
          inviter_email: user.email || '',
        }})
        if (error) throw error
        target = data.user
        invited = true
      }
      if (!target) throw new Error('Benutzer konnte nicht angelegt werden')
      if (target.id === user.id) throw new Error('Der eigene Vereinszugang wird nicht über die Einladungsfunktion geändert')
      await admin.from('vt_profiles').upsert({ user_id: target.id, ...(recipientName ? {display_name: recipientName} : {}) }, { onConflict: 'user_id' })
      const { data: membership, error: membershipErr } = await admin.from('vt_club_memberships').upsert({ user_id: target.id, club_id: clubId, active: true }, { onConflict: 'user_id,club_id' }).select('id').single()
      if (membershipErr) throw membershipErr
      if (manager.platform) {
        const { error: deleteErr } = await admin.from('vt_club_member_roles').delete().eq('membership_id', membership.id); if (deleteErr) throw deleteErr
        const { error: insertErr } = await admin.from('vt_club_member_roles').insert(roles.map(role => ({ membership_id: membership.id, role }))); if (insertErr) throw insertErr
      } else {
        const { error: deleteErr } = await admin.from('vt_club_member_roles').delete().eq('membership_id', membership.id).in('role', ['viewer', 'editor']); if (deleteErr) throw deleteErr
        const { error: insertErr } = await admin.from('vt_club_member_roles').insert(roles.map(role => ({ membership_id: membership.id, role }))); if (insertErr) throw insertErr
      }
      return json({ ok: true, invited, user_id: target.id, membership_id: membership.id })
    }

    if (action === 'invite_platform_admin') {
      if (!isPlatform) throw new Error('Nur Superadmins dürfen weitere Superadmins einladen')
      const email = cleanText(body.email, 320).toLowerCase(), recipientName = cleanText(body.recipient_name, 120)
      const inviteSubject = cleanText(body.invite_subject, 180), inviteBody = cleanText(body.invite_body, 5000)
      if (!email || !inviteSubject || !inviteBody) throw new Error('E-Mail und Einladungstext sind erforderlich')
      let target = await findExistingUserByEmail(email), invited = false
      if (!target) {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: APP_REDIRECT_URL, data: { display_name: recipientName, roles:['platform_admin'], invite_type:'platform_admin', invite_subject:inviteSubject, invite_body:inviteBody, inviter_name:senderName, inviter_email:user.email||'' } })
        if (error) throw error
        target = data.user; invited = true
      }
      if (!target) throw new Error('Benutzer konnte nicht angelegt werden')
      if (target.id === user.id) throw new Error('Das eigene Superadmin-Konto wird hier nicht geändert')
      await admin.from('vt_profiles').upsert({ user_id: target.id, ...(recipientName ? {display_name:recipientName}: {}) }, { onConflict:'user_id' })
      const { data: allAdmins, error: listErr } = await admin.from('vt_platform_admins').select('admin_code'); if (listErr) throw listErr
      const next = Math.max(0,...(allAdmins||[]).map(a=>Number(String(a.admin_code||'').match(/^SA-(\d+)$/)?.[1]||0)))+1
      const adminCode = `SA-${String(next).padStart(2,'0')}`
      const { error } = await admin.from('vt_platform_admins').upsert({ user_id:target.id, admin_code:adminCode, active:true }, { onConflict:'user_id' })
      if (error) throw error
      return json({ ok:true, invited, user_id:target.id, admin_code:adminCode })
    }

    if (action === 'set_roles') {
      const membershipId = cleanText(body.membership_id, 60); if (!membershipId) throw new Error('Mitgliedschaft fehlt')
      const targetMembership = await membershipById(membershipId); if (targetMembership.user_id === user.id) throw new Error('Eigene Rollen können hier nicht geändert werden')
      const manager = await assertClubManager(targetMembership.club_id)
      let roles = Array.isArray(body.roles) ? body.roles.map(String).filter(r => allowedRoles.has(r)) : []; roles = [...new Set(roles)]
      if (!roles.length) throw new Error('Mindestens eine Rolle muss aktiv bleiben')
      const { data: currentAdminRole, error: currentAdminErr } = await admin.from('vt_club_member_roles').select('role').eq('membership_id', membershipId).eq('role', 'club_admin').maybeSingle()
      if (currentAdminErr) throw currentAdminErr
      if (currentAdminRole && !roles.includes('club_admin') && await activeClubAdminCount(targetMembership.club_id) <= 1) throw new Error('Der letzte aktive Vereinsadmin kann nicht entfernt werden')
      const { error: deleteErr } = await admin.from('vt_club_member_roles').delete().eq('membership_id', membershipId); if (deleteErr) throw deleteErr
      const { error: insertErr } = await admin.from('vt_club_member_roles').insert(roles.map(role => ({ membership_id: membershipId, role }))); if (insertErr) throw insertErr
      return json({ ok: true })
    }

    if (action === 'set_membership_active') {
      const membershipId = cleanText(body.membership_id, 60), active = body.active === true; if (!membershipId) throw new Error('Mitgliedschaft fehlt')
      const targetMembership = await membershipById(membershipId); if (targetMembership.user_id === user.id) throw new Error('Der eigene Vereinszugang kann hier nicht deaktiviert werden')
      await assertClubManager(targetMembership.club_id)
      if (!active && targetMembership.active) {
        const { data: adminRole, error: adminRoleErr } = await admin.from('vt_club_member_roles').select('role').eq('membership_id', membershipId).eq('role', 'club_admin').maybeSingle()
        if (adminRoleErr) throw adminRoleErr
        if (adminRole && await activeClubAdminCount(targetMembership.club_id) <= 1) throw new Error('Der letzte aktive Vereinsadmin kann nicht deaktiviert werden')
      }
      const { error } = await admin.from('vt_club_memberships').update({ active }).eq('id', membershipId); if (error) throw error
      return json({ ok: true, active })
    }

    if (action === 'remove_membership') {
      const membershipId = cleanText(body.membership_id, 60); if (!membershipId) throw new Error('Mitgliedschaft fehlt')
      const targetMembership = await membershipById(membershipId); if (targetMembership.user_id === user.id) throw new Error('Der eigene Vereinszugang kann hier nicht entfernt werden')
      await assertClubManager(targetMembership.club_id)
      if (targetMembership.active) {
        const { data: adminRole, error: adminRoleErr } = await admin.from('vt_club_member_roles').select('role').eq('membership_id', membershipId).eq('role', 'club_admin').maybeSingle()
        if (adminRoleErr) throw adminRoleErr
        if (adminRole && await activeClubAdminCount(targetMembership.club_id) <= 1) throw new Error('Der letzte aktive Vereinsadmin kann nicht aus dem Verein entfernt werden')
      }
      const { error } = await admin.from('vt_club_memberships').delete().eq('id', membershipId); if (error) throw error
      return json({ ok:true })
    }

    if (action === 'send_password_reset') {
      const membershipId = cleanText(body.membership_id, 60); if (!membershipId) throw new Error('Mitgliedschaft fehlt')
      const targetMembership = await membershipById(membershipId); await assertClubManager(targetMembership.club_id)
      const target = await getAuthUser(targetMembership.user_id); if (!target.email) throw new Error('Für diesen Benutzer ist keine E-Mail-Adresse hinterlegt')
      const mailClient = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } })
      const { error } = await mailClient.auth.resetPasswordForEmail(target.email, { redirectTo: APP_REDIRECT_URL }); if (error) throw error
      return json({ ok: true, email: target.email })
    }

    if (action === 'delete_user') {
      if (!isPlatform) throw new Error('Nur Superadmins dürfen Benutzerkonten endgültig löschen')
      const targetUserId = cleanText(body.user_id, 60); if (!targetUserId) throw new Error('Benutzer fehlt')
      if (targetUserId === user.id) throw new Error('Das eigene Benutzerkonto kann hier nicht gelöscht werden')
      const { data: targetPlatform } = await admin.from('vt_platform_admins').select('user_id,active').eq('user_id', targetUserId).eq('active', true).maybeSingle()
      if (targetPlatform) throw new Error('Aktive Superadmins können hier nicht gelöscht werden. Entferne zuerst die Superadmin-Berechtigung.')
      const target = await getAuthUser(targetUserId)
      const { error: clearUpdaterErr } = await admin.from('vt_team_states').update({ updated_by: null }).eq('updated_by', targetUserId); if (clearUpdaterErr) throw clearUpdaterErr
      const { error } = await admin.auth.admin.deleteUser(targetUserId); if (error) throw error
      return json({ ok: true, email: target.email || '' })
    }

    throw new Error('Unbekannte Aktion')
  } catch (e) { return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 400) }
})
