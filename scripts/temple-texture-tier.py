"""Downsample embedded Meshy maps for the Quest-friendly runtime tier."""
import io,json,struct,sys
from pathlib import Path
from PIL import Image
path=Path(sys.argv[1]);raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0]
doc=json.loads(raw[20:20+n]);source=raw[28+n:];binary=bytearray()
image_views={image['bufferView']:image for image in doc['images']}
for i,view in enumerate(doc['bufferViews']):
 start=view.get('byteOffset',0);data=source[start:start+view['byteLength']]
 if i in image_views:
  image=Image.open(io.BytesIO(data));image.thumbnail((1024,1024),Image.Resampling.LANCZOS)
  out=io.BytesIO();image.save(out,format='PNG',optimize=True);data=out.getvalue();image_views[i]['mimeType']='image/png'
 while len(binary)%4:binary.append(0)
 view['byteOffset']=len(binary);view['byteLength']=len(data);binary.extend(data)
doc['buffers'][0]['byteLength']=len(binary)
j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);binary.extend(b'\0'*((-len(binary))%4))
path.write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary)
print(path.name,len(raw),'->',path.stat().st_size)
