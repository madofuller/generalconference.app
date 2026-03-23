import json
d = json.load(open('conference-app/public/insights.json', 'r', encoding='utf-8'))
profiles = d.get('apostleProfiles', [])
print(f"Total profiles: {len(profiles)}")
for i, p in enumerate(profiles):
    sp = p.get('signaturePhrases') or []
    phrases = ', '.join(s['phrase'] for s in sp[:5]) if sp else '(none)'
    print(f"  {i+1}. {p['name']:35s} talks={p.get('totalTalks',0):3d}  {phrases}")
