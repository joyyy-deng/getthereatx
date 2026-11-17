"""Bus route numbers for each pair of Plan places, from CapMetro's public GTFS feed.

Usage: download https://data.texas.gov/download/r4v4-vz24/application%2Fx-zip-compressed, unzip it, then
  python3 scripts/build-bus-routes.py <unzipped folder> src/content/places.json src/content/bus-routes.json
Rules: stops inside a place's outline or within 0.3 mi of its centre; Night Owl routes left out; UT shuttles
(600s, UT ID needed) listed apart under utTrips, direct rides only; rare patterns (<40 trips) left out; prefers frequent, short rides; else one transfer.
"""
import csv, json, math, sys, collections
F=sys.argv[1]; places=json.load(open(sys.argv[2]))
def rd(n): return csv.DictReader(open(F+'/'+n+'.txt',encoding='utf-8-sig'))
def mi(a,b,c,d):
    x=math.radians(d-b)*math.cos(math.radians((a+c)/2)); y=math.radians(c-a); return 3959*math.hypot(x,y)
def inside(lat,lng,poly):
    n=len(poly); c=False; j=n-1
    for i in range(n):
        yi,xi=poly[i]; yj,xj=poly[j]
        if (yi>lat)!=(yj>lat) and lng < (xj-xi)*(lat-yi)/(yj-yi)+xi: c=not c
        j=i
    return c
stops={r['stop_id']:(float(r['stop_lat']),float(r['stop_lon'])) for r in rd('stops')}
routes={r['route_id']:r for r in rd('routes')}
trips={r['trip_id']:(r['route_id'],r['direction_id']) for r in rd('trips')}
near={}
for p in places:
    c=p['centroid']; poly=p.get('polygon') or []
    near[p['id']]={s for s,(la,lo) in stops.items() if mi(c['lat'],c['lng'],la,lo)<=0.3 or (poly and inside(la,lo,poly))}
seq=collections.defaultdict(list)
for r in rd('stop_times'): seq[r['trip_id']].append((int(r['stop_sequence']),r['stop_id'],r['arrival_time']))
def t(s): h,m,_=map(int,s.split(':')); return h*60+m
# pattern per (route,dir): longest trip; count trips
pattern={}; count=collections.Counter()
for tid,st in seq.items():
    st.sort(); k=trips[tid]; count[k]+=1
    if k not in pattern or len(st)>len(pattern[k]): pattern[k]=st
def ride(k,A,B):
    """minutes riding pattern k from a stop in A to a later stop in B; (mins, board idx, alight idx) or None"""
    st=pattern[k]; best=None
    for i,(_,s,_) in enumerate(st):
        if s not in A: continue
        for j in range(i+1,len(st)):
            if st[j][1] in B:
                m=t(st[j][2])-t(st[i][2])
                if best is None or m<best[0]: best=(m,i,j)
                break
    return best
name=lambda k: routes[k[0]]['route_short_name']
# skip weak patterns (<20 trips per service-day set) to avoid oddball school/event trippers
keys=[k for k in pattern if count[k]>=40 and routes[k[0]]['route_type']=='3' and not routes[k[0]]['route_short_name'].startswith('6') and 'Night Owl' not in routes[k[0]]['route_long_name']]
# UT shuttles (600s) are kept apart: anyone can see them, but riders need a UT ID.
ut_keys=[k for k in pattern if count[k]>=20 and routes[k[0]]['route_short_name'].startswith('6')]
ut_out={}
for a in places:
  for b in places:
    if a is b: continue
    opts=[(r[0]+600/count[k],name(k)) for k in ut_keys for r in [ride(k,near[a['id']],near[b['id']])] if r]
    if opts: ut_out[f"{a['id']}>{b['id']}"]=[min(opts)[1]]
out={}
for a in places:
  for b in places:
    if a is b: continue
    A,B=near[a['id']],near[b['id']]
    direct=[]
    for k in keys:
        r=ride(k,A,B)
        if r: direct.append((r[0]+ 600/count[k], [name(k)], r[0]))  # penalise rare routes
    if direct:
        direct.sort(); out[f"{a['id']}>{b['id']}"]=direct[0]; continue
    best=None
    for k1 in keys:
        st1=pattern[k1]
        bi=[i for i,(_,s,_) in enumerate(st1) if s in A]
        if not bi: continue
        i0=bi[0]
        for k2 in keys:
            if k2[0]==k1[0]: continue
            st2=pattern[k2]
            aj=[j for j,(_,s,_) in enumerate(st2) if s in B]
            if not aj: continue
            j1=aj[-1]
            # transfer: stop x on k1 after i0, stop y on k2 before j1, within 0.12 mi
            for x in range(i0+1,len(st1)):
                lx=stops[st1[x][1]]; hit=None
                for y in range(0,j1):
                    ly=stops[st2[y][1]]
                    if mi(lx[0],lx[1],ly[0],ly[1])<=0.12: hit=y; break
                if hit is not None:
                    m=(t(st1[x][2])-t(st1[i0][2]))+(t(st2[j1][2])-t(st2[hit][2]))+10
                    s=m+600/count[k1]+600/count[k2]
                    if best is None or s<best[0]: best=(s,[name(k1),name(k2)],m)
                    break
    out[f"{a['id']}>{b['id']}"]=best
fi=next(rd('feed_info'))
used=sorted({n for v in out.values() if v for n in v[1]}|{n for v in ut_out.values() for n in v},key=int)
names={r['route_short_name']:r['route_long_name'] for r in routes.values()}
doc={'source':'CapMetro GTFS feed (data.texas.gov r4v4-vz24), version '+fi['feed_version']+', valid '+fi['feed_start_date']+' to '+fi['feed_end_date'],
 'note':'Best direct route, else one transfer, between stops in each place. Built by scripts/build-bus-routes.py; do not edit by hand.',
 'routes':{n:names[n] for n in used},'trips':{k:v[1] for k,v in out.items() if v},'utTrips':ut_out}
json.dump(doc,open(sys.argv[3],'w'),indent=2,ensure_ascii=False); open(sys.argv[3],'a').write('\n')
