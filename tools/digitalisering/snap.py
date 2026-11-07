from model import *
exec(open('fit.py').read().split('# similarity')[0])
t=Transformer.from_crs(25833,25832,always_xy=True)
E32,N32=t.transform(W[:,0],W[:,1])
ge,gn=px2grid(P[:,0],P[:,1])
dE=E32-ge; dN=N32-gn
for k,a,b in zip(pts,dE,dN): print(k,round(a),round(b))
print('median',np.median(dE),np.median(dN))
