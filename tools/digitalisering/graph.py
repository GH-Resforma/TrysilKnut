import numpy as np, cv2, json
sk=np.load('skel.npy').astype(np.uint8)
h,w=sk.shape
ys,xs=np.nonzero(sk); P=set(zip(xs.tolist(),ys.tolist()))
N8=[(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)]
nb=lambda p:[(p[0]+dx,p[1]+dy) for dx,dy in N8 if (p[0]+dx,p[1]+dy) in P]
deg={p:len(nb(p)) for p in P}
nodes={p for p in P if deg[p]!=2}
# cluster nodes
seen=set(); polys=[]
used=set()
def edgekey(a,b): return (a,b) if a<b else (b,a)
for n in nodes:
    for q in nb(n):
        if edgekey(n,q) in used: continue
        path=[n,q]; used.add(edgekey(n,q)); prev,cur=n,q
        while cur not in nodes:
            nxt=[r for r in nb(cur) if r!=prev and edgekey(cur,r) not in used]
            if not nxt: break
            r=nxt[0]; used.add(edgekey(cur,r)); prev,cur=cur,r; path.append(cur)
        polys.append(path)
# loops without nodes ignored
polys=[p for p in polys if len(p)>=6]
print(len(polys))
json.dump(polys,open('polys.json','w'))
