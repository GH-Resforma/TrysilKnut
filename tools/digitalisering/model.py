import numpy as np, cv2
from pyproj import Transformer
h,w=1107,1560
ANG=0.495; SX=158.35; SY=159.15; X0=27.5; Y0=11.0
M=cv2.getRotationMatrix2D((w/2,h/2),ANG,1)
def rot(x,y):
    x=np.asarray(x,float);y=np.asarray(y,float)
    return M[0,0]*x+M[0,1]*y+M[0,2], M[1,0]*x+M[1,1]*y+M[1,2]
def px2grid(x,y):  # km units relative to grid line origin
    xr,yr=rot(x,y); return (xr-X0)/SX*1000, -(yr-Y0)/SY*1000
