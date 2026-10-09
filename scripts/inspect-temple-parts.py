import json,struct,numpy as np,sys
from collections import defaultdict
from pathlib import Path
import copy
r=Path(sys.argv[1] if len(sys.argv)>1 else '../meshy-temple-sources/user-colonnade.glb').read_bytes();n=struct.unpack_from('<I',r,12)[0];d=json.loads(r[20:20+n]);b=r[28+n:];p=d['meshes'][0]['primitives'][0];a=d['accessors'][p['attributes']['POSITION']];v=d['bufferViews'][a['bufferView']];x=np.frombuffer(b,dtype='<f4',count=a['count']*3,offset=v.get('byteOffset',0)).reshape(-1,3)
parent=list(range(len(x)//3));seen={}
def find(i):
 while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
 return i
for i,point in enumerate(x):
 key=tuple(np.round(point,5));face=i//3
 if key in seen:parent[find(face)]=find(seen[key])
 else:seen[key]=face
groups=defaultdict(list)
for i in range(len(parent)):groups[find(i)].append(i)
parts=defaultdict(list)
for faces in groups.values():
 points=x.reshape(-1,3,3)[faces].reshape(-1,3);lo=points.min(0);hi=points.max(0)
 kind='full-arch' if hi[0]<0 else 'pillar' if lo[1]>.2 or hi[1]<-.24 or hi[1]-lo[1]>.4 else 'arch-span'
 parts[kind].extend(faces)
binary=bytearray(b);original=copy.deepcopy(p);d['meshes']=[];d['nodes']=[]
for kind,faces in parts.items():
 primitive=copy.deepcopy(original)
 for semantic,index in original['attributes'].items():
  a=copy.deepcopy(d['accessors'][index]);view=d['bufferViews'][a['bufferView']];width={'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
  values=np.frombuffer(b,dtype='<f4',count=a['count']*width,offset=view.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,3,width)[faces].reshape(-1,width).copy()
  while len(binary)%4:binary.append(0)
  a['bufferView']=len(d['bufferViews']);a['count']=len(values);a.pop('byteOffset',None)
  if semantic=='POSITION':a['min']=values.min(0).tolist();a['max']=values.max(0).tolist()
  d['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':values.nbytes,'target':34962});binary.extend(values.tobytes())
  primitive['attributes'][semantic]=len(d['accessors']);d['accessors'].append(a)
 d['meshes'].append({'name':kind,'primitives':[primitive]});d['nodes'].append({'name':kind,'mesh':len(d['meshes'])-1});print(kind,len(faces))
d['scenes']=[{'nodes':list(range(len(d['nodes'])))}];d['scene']=0;d['buffers'][0]['byteLength']=len(binary)
j=json.dumps(d,separators=(',',':')).encode();j+=b' '*((-len(j))%4);binary.extend(b'\0'*((-len(binary))%4))
Path('assets/models/drowned-temple/user-parts.glb').write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary)
