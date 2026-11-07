import numpy as np, cv2
from skimage.morphology import skeletonize
im=cv2.imread('web/Trysil-Knuts-Turkart.jpg')
hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV).astype(int)
H,S,V=hsv[...,0],hsv[...,1],hsv[...,2]
m=(((H<=7)|(H>=172))&(S>130)&(V>120)).astype(np.uint8)
# keep thick-ish stuff: road is 1px faint dots
n,lab,st,_=cv2.connectedComponentsWithStats(m,8)
keep=np.zeros_like(m)
for i in range(1,n):
    if st[i,cv2.CC_STAT_AREA]>=25: keep[lab==i]=1
keep=cv2.morphologyEx(keep,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
n,lab,st,_=cv2.connectedComponentsWithStats(keep,8)
k2=np.zeros_like(keep)
for i in range(1,n):
    if st[i,cv2.CC_STAT_AREA]>=60: k2[lab==i]=1
sk=skeletonize(k2>0)
np.save('skel.npy',sk)
cv2.imwrite('skel.png',255-(sk*255).astype(np.uint8))
