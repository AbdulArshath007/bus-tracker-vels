import json

with open('route_data.json', 'r') as f:
    data = json.load(f)

# Update simulate.ts
with open('backend/src/simulate.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.startswith('const WAYPOINTS = ['):
        skip = True
        new_lines.append('const WAYPOINTS = ' + json.dumps(data['waypoints'], indent=2).replace('"', "'") + ';\n')
    elif skip and line.strip() == '];':
        skip = False
    elif not skip:
        new_lines.append(line)

with open('backend/src/simulate.ts', 'w') as f:
    f.writelines(new_lines)


# Update LiveMap.tsx
with open('admin-portal/src/components/LiveMap.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.startswith('const ROUTE_PATH: [number, number][] = ['):
        skip = True
        new_lines.append('const ROUTE_PATH: [number, number][] = ' + json.dumps(data['path']) + ';\n')
    elif skip and line.strip() == '];':
        skip = False
    elif not skip:
        new_lines.append(line)

with open('admin-portal/src/components/LiveMap.tsx', 'w') as f:
    f.writelines(new_lines)

print('Done')
