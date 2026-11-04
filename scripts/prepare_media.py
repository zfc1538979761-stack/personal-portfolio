"""Prepare approved website copies; never modify source media or GEO project."""
import sys, io, json, hashlib
from pathlib import Path
from PIL import Image, ImageOps, ImageCms
try:
 import pillow_heif
 pillow_heif.register_heif_opener()
except ImportError:
 pass
sys.stdout.reconfigure(encoding='utf-8')
BASE=Path(__file__).resolve().parents[1]
SOURCE=Path(r'C:\Users\zfc\Desktop\个人作品集照片素材')
DEST=BASE/'public/media'
DEST.mkdir(exist_ok=True)
PHOTOS=sorted(p for p in SOURCE.iterdir() if p.is_file())[:47]
assert len(PHOTOS)==47 and PHOTOS[40].stem.endswith('7371') and PHOTOS[43].stem.endswith('0827')
GROUPS=[('wugong','武功山',[3,1,2,4]),('tengger','腾格里沙漠',[5,6,8,9,11,33]),('nantaihang','南太行',[15,16,13,14,12]),('hutiao','虎跳峡',[19,20,21]),('haba','哈巴黑海',[18,36,22,17]),('jiesi','结斯沟',[24,25,23]),('yema','野马海子',[41,26,28,27]),('tiejiang','铁匠山',[32,31,30,29]),('shizikou','狮子口',[34,35]),('wutai','五台山',[40,39,37,38,47]),('hongxing','红星岩海子',[45,42,46,43,44])]
indices=[n for _,_,ns in GROUPS for n in ns]
assert len(indices)==45 and len(set(indices))==45 and set(range(1,48))-set(indices)=={7,10}
manifest=[]
def export(src,name,maximum=(2200,2600),crop=None):
 with Image.open(src) as original:
  im=ImageOps.exif_transpose(original)
  profile=im.info.get('icc_profile')
  if profile:
   im=ImageCms.profileToProfile(im,ImageCms.ImageCmsProfile(io.BytesIO(profile)),ImageCms.createProfile('sRGB'),outputMode='RGB')
  else: im=im.convert('RGB')
  if crop: im=im.crop(crop)
  width,height=im.size
  im.thumbnail(maximum)
  im.save(DEST/name,'WEBP',quality=91,method=6)
  manifest.append({'output':name,'source':str(src),'originalSize':[width,height],'outputSize':list(im.size),'colorManaged':bool(profile),'sha256':hashlib.sha256(src.read_bytes()).hexdigest()})
  return {'src':'/media/'+name,'width':im.width,'height':im.height}
def photo(src,name,id,alt,caption):
 return {'kind':'image','id':id,**export(src,name),**({'displaySrc':'/media/display/'+name} if name.startswith('outdoor-') else {}),'alt':alt,'caption':caption}
destinations=[]
for slug,title,nums in GROUPS:
 images=[]
 for n in nums:
  item=photo(PHOTOS[n-1],f'outdoor-{n:02}.webp',f'outdoor-{n:02}',f'{title} · 本人提供的户外照片 {n:02}',title)
  item['sourceIndex']=n
  images.append(item)
 destinations.append({'id':slug,'name':title,'photos':images})
# Re-export existing intro image with matching source color, preserving all pixels.
export(PHOTOS[40],'yema-portrait.webp')
# Existing profile evidence is cropped to account identity and public metrics only.
profile={'kind':'image','id':'dolla-profile',**export(next(p for p in SOURCE.iterdir() if p.stem.endswith('2688')),'dolla-profile.webp',crop=(0,290,930,920)),'alt':'Dolla账号主页与粉丝、获赞记录','caption':'账号主页记录'}
# Manually checked against all 13 supplied screenshots; likes are not inferred from plays.
records=[('2671',230000,'171.5万','1万'),('2676',8732,'15.2万','1634'),('2683',7185,'27.9万','385'),('2684',6549,'9.9万','410'),('2687',6439,'13.4万','574'),('2685',4346,'3.8万','277'),('2680',3215,'4万','164'),('2686',2863,'7.5万','283'),('2677',2727,'5.6万','162'),('2679',2332,'1.7万','51'),('2681',1897,'4.5万','59'),('2682',1385,'4万','101'),('2678',1057,'2.9万','31')]
performance=[]
for suffix,likes,plays,collections in records:
 assert likes>1000
 src=next(p for p in SOURCE.iterdir() if p.stem.endswith(suffix))
 item=photo(src,f'performance-{suffix}.webp',f'performance-{suffix}',f'Dolla作品后台记录：{"23万" if suffix=="2671" else str(likes)}点赞，{plays}播放','作品后台记录')
 item['metrics']={'likes':likes,'likesLabel':'23万' if suffix=='2671' else str(likes),'plays':plays,'collections':collections}
 performance.append(item)
assert len(performance)==13 and len(set(x['id'] for x in performance))==13
# Raw recording frames: crop browser chrome only, retain business values/statuses.
GEOSOURCE=Path(r'E:\电商产业园实习项目\GEO-SaaS\docs\portfolio\video-review')
geo=[]
for row in json.loads((GEOSOURCE/'private-selection-manifest.json').read_text(encoding='utf-8')):
 src=GEOSOURCE/'private-raw'/row['raw_frame']
 item={'kind':'image','id':'geo-'+row['file'][:2],**export(src,'geo-real-'+row['file'].replace('.jpg','.webp'),maximum=(2390,1500),crop=(0,112,2390,1412)),'alt':'原GEO项目历史录屏：'+row['title'],'caption':row['title'],'sourceNote':f'2026-08-26 原项目录屏 · 约 {row["approx_seconds"]//60:02}:{row["approx_seconds"]%60:02}'}
 geo.append(item)
text='import type { Destination, ImageMedia } from "./types";\n\n'
for name,value,typ in [('destinations',destinations,'Destination[]'),('performanceRecords',performance,'ImageMedia[]'),('accountEvidence',[profile],'ImageMedia[]'),('geoEvidence',geo,'ImageMedia[]')]:
 text+=f'export const {name} = '+json.dumps(value,ensure_ascii=False,indent=2)+f' satisfies {typ};\n\n'
(BASE/'src/media-data.ts').write_text(text,encoding='utf-8')
(BASE/'docs/media-manifest.json').write_text(json.dumps({'excludedPhotoIndices':[7,10],'destinations':[{ 'id':d['id'],'name':d['name'],'indices':[p['sourceIndex'] for p in d['photos']]} for d in destinations],'files':manifest},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'destinations':len(destinations),'photos':sum(len(d['photos']) for d in destinations),'records':len(performance),'geoFrames':len(geo),'colorManagedFiles':sum(x['colorManaged'] for x in manifest)},ensure_ascii=False))
from prepare_display_media import prepare
prepare()
