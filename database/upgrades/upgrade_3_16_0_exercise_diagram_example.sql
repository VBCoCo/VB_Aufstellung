-- Release 3.16.0 / V1.2b – schreibgeschützte System-Beispielübung mit fünf Grafikschritten

insert into public.vt_exercises (
  id, club_id, team_id, owner_id, exercise_type, visibility, family_key, variant_label,
  name, short_description, main_focus, secondary_tags, body_areas, difficulty, execution,
  coaching_points, materials, social_form, load_type, load_value, volleyball_relevance,
  warmup_phases, youth_suitable, playful, circuit_suitable, form_type, goal, player_mode,
  player_exact, player_min, player_max, group_size, min_groups, max_groups, field_need,
  organization, competition_oriented, rules, scoring, game_phases, ball_initiation,
  duration_min, hall_requirements, parallel_groups
) values (
  '31600000-0000-4000-8000-000000000001', null, null, null, 'volleyball', 'system',
  'receive-set-outside-example', 'Fünf Schritte', 'Annahme – Zuspiel – Außenangriff',
  'Fünfstufiges Anschauungsbeispiel für Annahme, Zuspiel, Außenangriff und Angriffssicherung.',
  'attack', array['receive_lower','set_front','attack_outside'], array[]::text[], 'medium', '',
  array['Früh zum Ball bewegen','Zuspiel unter den Ball','Anlauf rhythmisch gestalten','Angriff absichern'],
  '[{"code":"volleyball","quantity":"1"},{"code":"net","quantity":"1"}]'::jsonb,
  null, null, null, array[]::text[], array[]::text[], true, false, false, 'exercise',
  'Komplette Angriffsentwicklung aus einer angenommenen Ballaufgabe darstellen und besprechen.',
  'range', null, 5, 8, null, null, null, 'Ganzfeld',
  'Trainer oder Ballgeber eröffnet. Annahme zum Zuspieler, hohes Zuspiel auf Außen, Angriff mit Sicherung. Die Grafik kann schrittweise oder als Animation in 2D und 2,5D betrachtet werden.',
  false, array[]::text[], '', array['K1'], 'coach', 12, array['full_court','net'], false
) on conflict (id) do update set
  name = excluded.name, short_description = excluded.short_description, organization = excluded.organization,
  coaching_points = excluded.coaching_points, updated_at = now();

insert into public.vt_exercise_diagrams (id, exercise_id, schema_version, revision, document, updated_by)
values (
  '31600000-0000-4000-8000-000000000002',
  '31600000-0000-4000-8000-000000000001',
  1, 1,
  $diagram$
  {
    "schemaVersion": 1,
    "court": {"type": "full"},
    "steps": [
      {
        "id": "31600000-0000-4000-8000-000000000011",
        "objects": [
          {"id":"31600000-0000-4000-8000-000000000101","type":"person","x":350,"y":70,"rotation":0,"team":"coach","number":"","role":"coach","label":"Ballgeber"},
          {"id":"31600000-0000-4000-8000-000000000102","type":"person","x":180,"y":690,"rotation":0,"team":"a","number":"5","role":"outside","label":"Annahme"},
          {"id":"31600000-0000-4000-8000-000000000103","type":"person","x":350,"y":630,"rotation":0,"team":"a","number":"2","role":"setter","label":"Zuspiel"},
          {"id":"31600000-0000-4000-8000-000000000104","type":"person","x":540,"y":700,"rotation":0,"team":"a","number":"4","role":"outside","label":"Außen"},
          {"id":"31600000-0000-4000-8000-000000000105","type":"person","x":350,"y":760,"rotation":0,"team":"a","number":"3","role":"middle","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000106","type":"person","x":170,"y":790,"rotation":0,"team":"a","number":"6","role":"libero","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000107","type":"person","x":430,"y":180,"rotation":0,"team":"b","number":"1","role":"","label":"Ziel"},
          {"id":"31600000-0000-4000-8000-000000000108","type":"ball","x":350,"y":105,"rotation":0},
          {"id":"31600000-0000-4000-8000-000000000109","type":"line","x":95,"y":450,"x2":605,"y2":450,"rotation":0}
        ],
        "paths": []
      },
      {
        "id": "31600000-0000-4000-8000-000000000012",
        "objects": [
          {"id":"31600000-0000-4000-8000-000000000101","type":"person","x":350,"y":70,"rotation":0,"team":"coach","number":"","role":"coach","label":"Ballgeber"},
          {"id":"31600000-0000-4000-8000-000000000102","type":"person","x":180,"y":690,"rotation":0,"team":"a","number":"5","role":"outside","label":"Annahme"},
          {"id":"31600000-0000-4000-8000-000000000103","type":"person","x":350,"y":630,"rotation":0,"team":"a","number":"2","role":"setter","label":"Zuspiel"},
          {"id":"31600000-0000-4000-8000-000000000104","type":"person","x":540,"y":700,"rotation":0,"team":"a","number":"4","role":"outside","label":"Außen"},
          {"id":"31600000-0000-4000-8000-000000000105","type":"person","x":350,"y":760,"rotation":0,"team":"a","number":"3","role":"middle","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000106","type":"person","x":170,"y":790,"rotation":0,"team":"a","number":"6","role":"libero","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000107","type":"person","x":430,"y":180,"rotation":0,"team":"b","number":"1","role":"","label":"Ziel"},
          {"id":"31600000-0000-4000-8000-000000000108","type":"ball","x":205,"y":650,"rotation":0},
          {"id":"31600000-0000-4000-8000-000000000109","type":"line","x":95,"y":450,"x2":605,"y2":450,"rotation":0}
        ],
        "paths": [{"id":"31600000-0000-4000-8000-000000000201","objectId":"31600000-0000-4000-8000-000000000108","kind":"ball","points":[{"x":350,"y":105},{"x":330,"y":250},{"x":270,"y":470},{"x":205,"y":650}]}]
      },
      {
        "id": "31600000-0000-4000-8000-000000000013",
        "objects": [
          {"id":"31600000-0000-4000-8000-000000000101","type":"person","x":350,"y":70,"rotation":0,"team":"coach","number":"","role":"coach","label":"Ballgeber"},
          {"id":"31600000-0000-4000-8000-000000000102","type":"person","x":205,"y":650,"rotation":0,"team":"a","number":"5","role":"outside","label":"Annahme"},
          {"id":"31600000-0000-4000-8000-000000000103","type":"person","x":365,"y":505,"rotation":0,"team":"a","number":"2","role":"setter","label":"Zuspiel"},
          {"id":"31600000-0000-4000-8000-000000000104","type":"person","x":540,"y":700,"rotation":0,"team":"a","number":"4","role":"outside","label":"Außen"},
          {"id":"31600000-0000-4000-8000-000000000105","type":"person","x":350,"y":760,"rotation":0,"team":"a","number":"3","role":"middle","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000106","type":"person","x":170,"y":790,"rotation":0,"team":"a","number":"6","role":"libero","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000107","type":"person","x":430,"y":180,"rotation":0,"team":"b","number":"1","role":"","label":"Ziel"},
          {"id":"31600000-0000-4000-8000-000000000108","type":"ball","x":365,"y":500,"rotation":0},
          {"id":"31600000-0000-4000-8000-000000000109","type":"line","x":95,"y":450,"x2":605,"y2":450,"rotation":0}
        ],
        "paths": [
          {"id":"31600000-0000-4000-8000-000000000202","objectId":"31600000-0000-4000-8000-000000000102","kind":"player","points":[{"x":180,"y":690},{"x":190,"y":670},{"x":205,"y":650}]},
          {"id":"31600000-0000-4000-8000-000000000203","objectId":"31600000-0000-4000-8000-000000000103","kind":"player","points":[{"x":350,"y":630},{"x":355,"y":560},{"x":365,"y":505}]},
          {"id":"31600000-0000-4000-8000-000000000204","objectId":"31600000-0000-4000-8000-000000000108","kind":"ball","points":[{"x":205,"y":650},{"x":255,"y":590},{"x":315,"y":530},{"x":365,"y":500}]}
        ]
      },
      {
        "id": "31600000-0000-4000-8000-000000000014",
        "objects": [
          {"id":"31600000-0000-4000-8000-000000000101","type":"person","x":350,"y":70,"rotation":0,"team":"coach","number":"","role":"coach","label":"Ballgeber"},
          {"id":"31600000-0000-4000-8000-000000000102","type":"person","x":240,"y":650,"rotation":0,"team":"a","number":"5","role":"outside","label":"Annahme"},
          {"id":"31600000-0000-4000-8000-000000000103","type":"person","x":365,"y":505,"rotation":0,"team":"a","number":"2","role":"setter","label":"Zuspiel"},
          {"id":"31600000-0000-4000-8000-000000000104","type":"person","x":525,"y":505,"rotation":0,"team":"a","number":"4","role":"outside","label":"Außen"},
          {"id":"31600000-0000-4000-8000-000000000105","type":"person","x":390,"y":650,"rotation":0,"team":"a","number":"3","role":"middle","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000106","type":"person","x":190,"y":720,"rotation":0,"team":"a","number":"6","role":"libero","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000107","type":"person","x":430,"y":180,"rotation":0,"team":"b","number":"1","role":"","label":"Ziel"},
          {"id":"31600000-0000-4000-8000-000000000108","type":"ball","x":515,"y":485,"rotation":0},
          {"id":"31600000-0000-4000-8000-000000000109","type":"line","x":95,"y":450,"x2":605,"y2":450,"rotation":0}
        ],
        "paths": [
          {"id":"31600000-0000-4000-8000-000000000205","objectId":"31600000-0000-4000-8000-000000000104","kind":"player","points":[{"x":540,"y":700},{"x":555,"y":650},{"x":555,"y":585},{"x":525,"y":505}]},
          {"id":"31600000-0000-4000-8000-000000000206","objectId":"31600000-0000-4000-8000-000000000105","kind":"player","points":[{"x":350,"y":760},{"x":365,"y":710},{"x":390,"y":650}]},
          {"id":"31600000-0000-4000-8000-000000000207","objectId":"31600000-0000-4000-8000-000000000106","kind":"player","points":[{"x":170,"y":790},{"x":175,"y":755},{"x":190,"y":720}]},
          {"id":"31600000-0000-4000-8000-000000000208","objectId":"31600000-0000-4000-8000-000000000108","kind":"ball","points":[{"x":365,"y":500},{"x":410,"y":440},{"x":470,"y":440},{"x":515,"y":485}]}
        ]
      },
      {
        "id": "31600000-0000-4000-8000-000000000015",
        "objects": [
          {"id":"31600000-0000-4000-8000-000000000101","type":"person","x":350,"y":70,"rotation":0,"team":"coach","number":"","role":"coach","label":"Ballgeber"},
          {"id":"31600000-0000-4000-8000-000000000102","type":"person","x":260,"y":620,"rotation":0,"team":"a","number":"5","role":"outside","label":"Annahme"},
          {"id":"31600000-0000-4000-8000-000000000103","type":"person","x":370,"y":560,"rotation":0,"team":"a","number":"2","role":"setter","label":"Zuspiel"},
          {"id":"31600000-0000-4000-8000-000000000104","type":"person","x":535,"y":425,"rotation":0,"team":"a","number":"4","role":"outside","label":"Außen"},
          {"id":"31600000-0000-4000-8000-000000000105","type":"person","x":420,"y":610,"rotation":0,"team":"a","number":"3","role":"middle","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000106","type":"person","x":210,"y":690,"rotation":0,"team":"a","number":"6","role":"libero","label":"Sicherung"},
          {"id":"31600000-0000-4000-8000-000000000107","type":"person","x":430,"y":180,"rotation":0,"team":"b","number":"1","role":"","label":"Ziel"},
          {"id":"31600000-0000-4000-8000-000000000108","type":"ball","x":430,"y":205,"rotation":0},
          {"id":"31600000-0000-4000-8000-000000000109","type":"line","x":95,"y":450,"x2":605,"y2":450,"rotation":0}
        ],
        "paths": [
          {"id":"31600000-0000-4000-8000-000000000209","objectId":"31600000-0000-4000-8000-000000000104","kind":"player","points":[{"x":525,"y":505},{"x":530,"y":465},{"x":535,"y":425}]},
          {"id":"31600000-0000-4000-8000-000000000210","objectId":"31600000-0000-4000-8000-000000000102","kind":"player","points":[{"x":240,"y":650},{"x":250,"y":635},{"x":260,"y":620}]},
          {"id":"31600000-0000-4000-8000-000000000211","objectId":"31600000-0000-4000-8000-000000000103","kind":"player","points":[{"x":365,"y":505},{"x":368,"y":535},{"x":370,"y":560}]},
          {"id":"31600000-0000-4000-8000-000000000212","objectId":"31600000-0000-4000-8000-000000000105","kind":"player","points":[{"x":390,"y":650},{"x":405,"y":630},{"x":420,"y":610}]},
          {"id":"31600000-0000-4000-8000-000000000213","objectId":"31600000-0000-4000-8000-000000000106","kind":"player","points":[{"x":190,"y":720},{"x":200,"y":705},{"x":210,"y":690}]},
          {"id":"31600000-0000-4000-8000-000000000214","objectId":"31600000-0000-4000-8000-000000000108","kind":"ball","points":[{"x":515,"y":485},{"x":525,"y":400},{"x":500,"y":310},{"x":430,"y":205}]}
        ]
      }
    ]
  }
  $diagram$::jsonb,
  null
) on conflict (exercise_id) do update set
  schema_version = excluded.schema_version,
  revision = public.vt_exercise_diagrams.revision + 1,
  document = excluded.document,
  updated_by = null,
  updated_at = now();
