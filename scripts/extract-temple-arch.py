"""Keep the generated arch surround; remove the unwanted wall and rear masonry.

Coordinates are specific to the recorded Meshy task, not a generic GLB optimizer.
Original UVs/normals and embedded PBR images are retained unchanged.
"""
import json, struct, sys
from pathlib import Path
import numpy as np

path=Path(sys.argv[1]); raw=path.read_bytes()
json_size=struct.unpack_from('<I',raw,12)[0]
doc=json.loads(raw[20:20+json_size]); binary=bytearray(raw[28+json_size:])
def read(index):
 a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
 dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']]
 width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
 return np.frombuffer(binary,dtype=dtype,count=a['count']*width,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,width).copy()
for mesh in doc['meshes']:
 for primitive in mesh['primitives']:
  positions=read(primitive['attributes']['POSITION']); indices=read(primitive['indices']).reshape(-1,3)
  centroids=positions[indices].mean(axis=1)
  # Central aperture surround: slender jambs and upper semicircular arch.
  x,y,z=centroids.T
  keep=(abs(x)<.43)&(z>.45)&((y<-.19)|((x/.43)**2+((y+.19)/.43)**2<1.05))&~((y<-.43)&(abs(x)<.28))
  selected=indices[keep].reshape(-1).astype('<u4')
  assert len(selected)>900, 'Extraction must retain a useful arch'
  used,remapped=np.unique(selected,return_inverse=True);selected=remapped.astype('<u4')
  for semantic,old in list(primitive['attributes'].items()):
   values=read(old)[used];a=dict(doc['accessors'][old]);a.pop('byteOffset',None)
   while len(binary)%4:binary.append(0)
   a['bufferView']=len(doc['bufferViews']);a['count']=len(used)
   if semantic=='POSITION':a['min']=values.min(0).tolist();a['max']=values.max(0).tolist()
   else:a.pop('min',None);a.pop('max',None)
   doc['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':values.nbytes,'target':34962});binary.extend(values.tobytes())
   primitive['attributes'][semantic]=len(doc['accessors']);doc['accessors'].append(a)
  while len(binary)%4:binary.append(0)
  view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':selected.nbytes,'target':34963})
  binary.extend(selected.tobytes()); accessor=len(doc['accessors'])
  doc['accessors'].append({'bufferView':view,'componentType':5125,'count':len(selected),'type':'SCALAR','min':[int(selected.min())],'max':[int(selected.max())]})
  primitive['indices']=accessor
  print(json.dumps({'sourceTriangles':len(indices),'retainedTriangles':len(selected)//3}))
doc['buffers'][0]['byteLength']=len(binary)
j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);binary.extend(b'\0'*((-len(binary))%4))
out=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary
Path(sys.argv[2]).write_bytes(out)
