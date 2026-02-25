// ====== 配置区 ======

// 你的 fAOD 图片覆盖范围（假设图片是全球等经纬投影贴图）
const IMAGE_BOUNDS = [[-90, -180], [90, 180]];

// list.json 放在与 index.html 同目录：
// 内容示例：["20010101_fAOD.webp", "20010102_fAOD.webp"]
const LIST_URL = new URL('list.json', location.href); // 关键：适配 GitHub Pages 子路径
// ====== 初始化地图 ======

const map = L.map('map', {
  zoomControl: true,
  minZoom: 2,
  worldCopyJump: true
}).setView([20, 0], 2);

// 底图（Esri 影像）
L.tileLayer(
  'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19, attribution: 'Tiles © Esri' }
).addTo(map);

// fAOD 图层组 + 控制器
const faodGroup = L.layerGroup().addTo(map);
L.control.layers(null, { 'fAOD': faodGroup }, { collapsed: false }).addTo(map);

// 首次布局后修正尺寸（避免容器初始尺寸计算不准）
setTimeout(() => map.invalidateSize(), 0);
window.addEventListener('resize', () => map.invalidateSize());

// ====== 加载 list.json 并叠加 ======

async function loadFAOD() {
  faodGroup.clearLayers();

  // 1) 拉取 list.json
  const r = await fetch(LIST_URL, { cache: 'no-store' });
  if (!r.ok) throw new Error(`list.json fetch failed: ${r.status} ${r.statusText} @ ${r.url}`);

  const list = await r.json();
  if (!Array.isArray(list)) throw new Error('list.json 必须是 JSON 数组，例如 ["20010101_fAOD.webp"]');

  // 2) 逐个叠加（如果你只想显示最新一张，把 for 改成只取 list[0] 或 list.at(-1)）
  let added = 0;

  for (const p of list) {
    if (typeof p !== 'string' || !p.trim()) continue;

    // 关键：把 list 里的路径解析为相对于“当前页面”的 URL
    // 建议 list.json 里用相对路径： "20010101_fAOD.webp"
    const imgUrl = new URL(p, location.href).toString();

    // 先探测一下资源是否真的存在（可避免“其实 404 但你看不出来”）
    const probe = await fetch(imgUrl, { cache: 'no-store' });
    if (!probe.ok) {
      console.warn('Image 404/failed:', imgUrl, probe.status);
      continue;
    }

    L.imageOverlay(imgUrl, IMAGE_BOUNDS, {
      opacity: 0.85,
      interactive: false
    }).addTo(faodGroup);

    added++;
  }

  console.log('fAOD overlays added:', added);
}

 /**
 * 根据类型字段和值确定点颜色
 */
function getColor(field, val) {
    let colors = ["rgb(49, 54, 149)",
        "rgb(74, 123, 183)",
        "rgb(128, 183, 214)",
        "rgb(189, 226, 238)",
        "rgb(238, 248, 223)",
        "rgb(254, 238, 165)",
        "rgb(253, 191, 113)",
        "rgb(246, 123, 74)",
        "rgb(218, 55, 42)",
        "rgb(165, 0, 38)"];
    if (field == "fAOD") {
        if (val == 0) {
            return colors[0];
        } else if (val <= 0.125) {
            return colors[1];
        } else if (val <= 0.25) {
            return colors[2];
        } else if (val <= 0.375) {
            return colors[3];
        } else if (val <= 0.5) {
            return colors[4];
        } else if (val <= 0.625) {
            return colors[5];
        } else if (val <= 0.75) {
            return colors[6];
        } else if (val <= 0.875) {
            return colors[7];
        } else {
            return colors[8];
        }
    }
}
  /*
 *根据气体类型更新图例   
*/
function updateLegendLabel() {
    if (selectType == "type-fAOD") {
        document.getElementById('gas-label').innerHTML = 'fAOD:';
        document.getElementById('tick0').innerHTML = '0.125';
        document.getElementById('tick1').innerHTML = '0.25';
        document.getElementById('tick2').innerHTML = '0.375';
        document.getElementById('tick3').innerHTML = '0.5';
        document.getElementById('tick4').innerHTML = '0.625';
        document.getElementById('tick5').innerHTML = '0.75';
        document.getElementById('tick6').innerHTML = '0.875';
    }
}
  

// 启动
loadFAOD().catch(err => console.error(err));
