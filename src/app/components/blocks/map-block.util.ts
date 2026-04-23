// map-block.util.ts
// Utility to generate Map Block HTML+JS with backend integration for both preview and published site
import { environment } from '../../../environments/environment';

export function getMapBlockHtml(entityId: string, entityDisplayName: string): string {
  const apiUrl = environment.apiUrl || '';
  return `
<section id="map-block"
         data-entity-id="${entityId}"
         data-entity-display-name="${entityDisplayName}"
         style="padding:3rem 2rem;background:var(--color-bg,#f9f9f9);text-align:center;font-family:var(--font-body);color:var(--color-text)">
  <h2 style="margin-bottom:1.5rem;font-family:var(--font-heading);color:var(--color-primary)">Find Us</h2>
  <div id="mapAddress" style="margin-bottom:1.2rem;font-size:1.1rem;color:var(--color-text)"></div>
  <div id="mapContainer" style="width:100%;max-width:540px;height:320px;margin:0 auto;border-radius:12px;overflow:hidden;background:#e8e8e8;display:flex;align-items:center;justify-content:center;color:#555;font-size:1.1rem">
    Loading map...
  </div>
  <script>(function() {
    var section = document.getElementById('map-block');
    var entityId = section.getAttribute('data-entity-id');
    var addressDiv = document.getElementById('mapAddress');
    var mapDiv = document.getElementById('mapContainer');
    fetch('${apiUrl}/api/entity/public/location?entityId=' + encodeURIComponent(entityId))
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          addressDiv.textContent = res.address;
          var lat = res.latitude, lng = res.longitude;
          // Embed Google Maps iframe
          mapDiv.innerHTML = '<iframe width="100%" height="100%" frameborder="0" style="border:0" allowfullscreen src="https://maps.google.com/maps?q=' + lat + ',' + lng + '&z=15&output=embed"></iframe>';
        } else {
          addressDiv.textContent = '';
          mapDiv.textContent = res.message || 'Location not found.';
        }
      })
      .catch(function() {
        addressDiv.textContent = '';
        mapDiv.textContent = 'Could not load map.';
      });
  })();</script>
</section>
`;
}
