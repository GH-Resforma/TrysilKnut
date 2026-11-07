import numpy as np
pts={ # name: (px,py, E33,N33)
'Eltsjoen':(1135,760,339436.7,6819466.2),
'Rosjoen':(1185,245,339980.0,6822601.8),
'Lyngasen':(128,640,333062.6,6820655.5),
'Kjolsaetra':(1355,615,340786.9,6820259.0),
'Nyvangsaetra':(585,88,336336.1,6823903.5),
'Rosjovola':(1350,195,341151.6,6822442.4),
'Snurru':(915,505,338140.5,6821070.9),
'Hoa':(720,310,336935.4,6822365.5),
'Tomtasen':(762,848,336964.7,6818931.5),
'Skjerasen':(320,745,334279.7,6819855.2),
'Litlasen':(600,385,335681.8,6822103.1),
}
P=np.array([[v[0],v[1]] for v in pts.values()],float); W=np.array([[v[2],v[3]] for v in pts.values()])
# similarity: E=a x - b y + c ; N= -b x - a y + d  (y down)
A=[];L=[]
for (x,y),(E,N) in zip(P,W):
    A.append([x,-y,1,0]);L.append(E)
    A.append([-y,-x,0,1]);L.append(N)
s,res,_,_=np.linalg.lstsq(np.array(A),np.array(L),rcond=None)
a,b,c,d=s
print('scale m/px',np.hypot(a,b),'rot deg',np.degrees(np.arctan2(b,a)))
for k,(x,y),(E,N) in zip(pts,P,W):
    pe=a*x-b*y+c; pn=-b*x-a*y+d; print(k,round(pe-E),round(pn-N))
np.save('sim.npy',s)
