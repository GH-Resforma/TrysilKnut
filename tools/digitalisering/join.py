import numpy as np, cv2, json
polys=[np.array(p,float) for p in json.load(open('polys.json'))]
# drop short spurs
polys=[p for p in polys if np.linalg.norm(np.diff(p,axis=0),axis=1).sum()>15]
def ends(p):
    out=[]
    for i,(a,b) in enumerate([(0,min(8,len(p)-1)),(len(p)-1,max(len(p)-9,0))]):
        d=p[a]-p[b]; d/=np.linalg.norm(d)+1e-9; out.append((p[a],d))
    return out
E=[]
for i,p in enumerate(polys):
    for j,(pt,d) in enumerate(ends(p)): E.append((i,j,pt,d))
# endpoint is "free" if no other polyline point within 4px
allpts=[(i,p) for i,p in enumerate(polys)]
def free(i,pt):
    for k,q in allpts:
        if k==i: continue
        if np.min(np.linalg.norm(q-pt,axis=1))<4: return False
    return True
F=[e for e in E if free(e[0],e[2])]
pairs=[]
for a in range(len(F)):
    for b in range(a+1,len(F)):
        i,_,p1,d1=F[a]; k,_,p2,d2=F[b]
        if i==k: continue
        v=p2-p1; dist=np.linalg.norm(v)
        if dist>120: continue
        u=v/dist
        # directions should point toward each other
        c1=np.dot(d1,u); c2=np.dot(d2,-u)
        if c1>0.6 and c2>0.6: pairs.append((dist/(c1*c2),a,b))
pairs.sort(); usedE=set(); links=[]
for s,a,b in pairs:
    if a in usedE or b in usedE: continue
    usedE|={a,b}; links.append([F[a][2].tolist(),F[b][2].tolist()])
print(len(polys),'free ends',len(F),'links',len(links))
for l in links: print([round(x) for x in l[0]],[round(x) for x in l[1]])
json.dump({'polys':[p.tolist() for p in polys],'links':links},open('net.json','w'))
im=cv2.imread('web/Trysil-Knuts-Turkart.jpg')//2+120
for p in polys: cv2.polylines(im,[p.astype(np.int32)],False,(255,0,0),2)
for a,b in links: cv2.line(im,tuple(map(int,a)),tuple(map(int,b)),(0,180,0),3)
for i,j,pt,d in F: cv2.circle(im,tuple(map(int,pt)),5,(0,0,255),1)
cv2.imwrite('check.png',im)
