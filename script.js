<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Leaflet fAOD</title>

  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <style>
    html, body { height: 100%; margin: 0; }
    #map { height: 100vh; width: 100vw; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    // 全球覆盖范围（WGS84 经纬度）
    const imageBounds = [[-90, -180], [90, 180]];

    // 初始化地图
    const map = L.map('map', { zoomControl: true, minZoom: 2 }).setView([20, 0], 2);

    // 底图
    L.tileLayer(
      'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Tiles © Esri' }
    ).addTo(map);

    // fAOD 图层组 + 图层控制（只创建一次）
    const fAODLayerGroup = L.layerGroup().addTo(map);
    L.control.layers(null, { 'fAOD images': fAODLayerGroup }, { collapsed: false }).addTo(map);

    // 关键：用“相对路径”取 list.json，自动适配 GitHub Pages 项目页子路径
    const listUrl = new URL('list.json', location.href);

    async function loadFAOD() {
      try {
        const r = await fetch(listUrl, { cache: 'no-store' });
        if (!r.ok) throw new Error(`list.json fetch failed: ${r.status} ${r.statusText} @ ${r.url}`);

        const list = await r.json();
        if (!Array.isArray(list)) throw new Error('list.json must be a JSON array of image paths');

        // 清空旧图层
        fAODLayerGroup.clearLayers();

        // 逐个添加 overlay
        for (const p of list) {
          if (typeof p !== 'string' || !p.trim()) continue;

          // 将 list 内的相对/绝对路径统一解析为“相对于当前页面”的 URL
          // 这样 list 里写 "fAOD/a.webp" 或 "./fAOD/a.webp" 都行；
          // 若你写了 "/fAOD/a.webp" 会被当成站点根路径，不推荐。
          const imgUrl = new URL(p, location.href).toString();

          L.imageOverlay(imgUrl, imageBounds, {
            opacity: 0.85,
            crossOrigin: true,   // 同域不需要；跨域且允许时有用
            interactive: false
          }).addTo(fAODLayerGroup);
        }

        // 让视图覆盖到全球范围，便于确认 overlay 是否出现
        map.fitBounds(imageBounds);

        // 如果容器大小刚计算不准，强制刷新一次
        setTimeout(() => map.invalidateSize(), 0);

        console.log('Loaded fAOD overlays:', fAODLayerGroup.getLayers().length);
      } catch (e) {
        console.error('loadFAOD error:', e);
      }
    }

    document.addEventListener('DOMContentLoaded', loadFAOD);
    window.addEventListener('resize', () => map.invalidateSize());
  </script>
</body>
</html>
