// 精简脚本：仅初始化 Leaflet 地图并从 /fAOD/list 加载 WebP 覆盖（全局 WGS84）
const imageBounds = [[-90.0, -180.0], [90.0, 180.0]];

// 初始化地图
const imagery = L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
const map = L.map('map', { zoomControl: true, minZoom: 2 }).setView([20, 0], 2);
imagery.addTo(map);

// 图层容器
const fAODLayerGroup = L.layerGroup().addTo(map);

// 从后端获取 fAOD 下的 .webp 列表并将每个作为全局 ImageOverlay 添加
function loadFAOD() {
    fetch('list.json')
        .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
        .then(list => {
            if (!Array.isArray(list)) return;
            list.forEach(p => {
                try { L.imageOverlay(p, imageBounds, { opacity: 0.85 }).addTo(fAODLayerGroup); }
                catch (e) { console.error('overlay error', p, e); }
            });
            // 添加简单图层控制
            L.control.layers(null, { 'fAOD images': fAODLayerGroup }).addTo(map);
        })
        .catch(e => console.error('loadFAOD error', e));
}

document.addEventListener('DOMContentLoaded', loadFAOD);
