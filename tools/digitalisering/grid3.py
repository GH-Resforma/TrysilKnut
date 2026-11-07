import numpy as np, cv2
im=cv2.imread('web/Trysil-Knuts-Turkart.jpg')[:,:,::-1].astype(int)
R,G,B=im[...,0],im[...,1],im[...,2]
m=(((B-R)>60)&(B>140)).astype(np.float32)
h,w=m.shape
best={}
for axis,name in [(0,'vert'),(1,'horiz')]:
  for ang in np.arange(0.3,0.7,0.01):
    M=cv2.getRotationMatrix2D((w/2,h/2),ang,1)
    p=cv2.warpAffine(m,M,(w,h)).sum(axis=axis)
    # comb score for spacing ~158.4
    for sp in np.arange(157,160,0.05):
      for off in np.arange(0,sp,0.5):
        idx=np.round(np.arange(off,len(p),sp)).astype(int); idx=idx[idx<len(p)]
        sc=p[idx].sum()
        if name not in best or sc>best[name][0]: best[name]=(sc,ang,sp,off)
  print(name,best[name])
