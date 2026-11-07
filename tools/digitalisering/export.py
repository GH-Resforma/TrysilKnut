import numpy as np, cv2, json
from model import *
from pyproj import Transformer
net=json.load(open('net.json'))
lines=[np.array(p) for p in net['polys']]+[np.array(l) for l in net['links']]
t=Transformer.from_crs(25832,4326,always_xy=True)
segs=[];tot=0
for p in lines:
    if len(p)>2: p=cv2.approxPolyDP(p.astype(np.float32).reshape(-1,1,2),0.8,False).reshape(-1,2)
    ge,gn=px2grid(p[:,0],p[:,1]); E=652000+ge; N=6824000+gn
    tot+=np.hypot(np.diff(E),np.diff(N)).sum()
    lon,lat=t.transform(E,N); segs.append(list(zip(lon,lat)))
print('total km',tot/1000, 'segments',len(segs))
json.dump(segs,open('segs_wgs84.json','w'))
g=['<?xml version="1.0" encoding="UTF-8"?>','<gpx version="1.1" creator="Trysil-Knut løypekart (digitalisert)" xmlns="http://www.topografix.com/GPX/1/1">',
 '<metadata><name>Trysil-Knuts fjellverden – løypenett</name><desc>Digitalisert fra turkart på trysilknutfjellverden.no. Nøyaktighet ca. 30–60 m.</desc></metadata>',
 '<trk><name>Trysil-Knut løypenett</name>']
for s in segs:
    g.append('<trkseg>'+''.join(f'<trkpt lat="{la:.6f}" lon="{lo:.6f}"/>' for lo,la in s)+'</trkseg>')
g+=['</trk>','</gpx>']
open('../Trysilknut-loyper.gpx','w').write('\n'.join(g))
k=['<?xml version="1.0" encoding="UTF-8"?>','<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Trysil-Knut løypenett</name>',
 '<Style id="l"><LineStyle><color>ff0000dd</color><width>4</width></LineStyle></Style>',
 '<Placemark><name>Løyper</name><styleUrl>#l</styleUrl><MultiGeometry>']
for s in segs:
    k.append('<LineString><tessellate>1</tessellate><coordinates>'+' '.join(f'{lo:.6f},{la:.6f}' for lo,la in s)+'</coordinates></LineString>')
k+=['</MultiGeometry></Placemark></Document></kml>']
open('../Trysilknut-loyper.kml','w').write('\n'.join(k))
