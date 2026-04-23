// menu-block.util.ts
// Utility to generate Menu/Services Block HTML+JS with backend integration for both preview and published site
import { environment } from '../../../environments/environment';

export function getMenuBlockHtml(entityId: string, entityDisplayName: string): string {
  const apiUrl = environment.apiUrl || '';
  // The script is injected as a string, so we must escape backticks and use classic string concatenation inside the script.
  return [
    '<section id="menu-block"',
    '  data-entity-id="' + entityId + '"',
    '  data-entity-display-name="' + entityDisplayName + '"',
    '  style="padding:2.5rem 2rem;background:var(--block-bg,#f9f4ee);text-align:center;font-family:var(--font-body);color:var(--color-text)">',
    '  <h2 style="margin-bottom:0.8rem;font-family:var(--font-heading);color:var(--color-primary)">Our Offerings</h2>',
    '  <div id="menuBlockContent" style="margin:0 auto;max-width:900px"></div>',
    '  <script>(function() {',
    '    var section = document.getElementById("menu-block");',
    '    if (!section) return;',
    '    var entityId = section.getAttribute("data-entity-id");',
    '    var contentDiv = document.getElementById("menuBlockContent");',
    '    if (!contentDiv) return;',
    '    contentDiv.innerHTML = "<div style=\"text-align:center;color:#aaa\">Loading offerings...</div>";',
    '    fetch("' + apiUrl + '/api/offerings/public/list/" + encodeURIComponent(entityId))',
    '      .then(function(r) { return r.json(); })',
    '      .then(function(data) {',
    '        if (!data || Object.keys(data).length === 0) {',
    '          contentDiv.innerHTML = "<div style=\"color:#888\">No offerings found.</div>";',
    '          return;',
    '        }',
    '        var html = "";',
    '        Object.keys(data).forEach(function(category) {',
    '          var items = data[category];',
    '          if (!Array.isArray(items) || items.length === 0) return;',
    '          html += "<div style=\"margin-bottom:2.5rem;text-align:left\">";',
    '          html += "<h3 style=\"margin-bottom:1.2rem;color:var(--color-primary,#c1440e);font-size:1.35rem;font-family:var(--font-heading)\">" + category + "</h3>";',
    '          html += "<div style=\"display:flex;flex-wrap:wrap;gap:1.5rem\">";',
    '          items.forEach(function(item) {',
    '            html += "<div style=\"background:var(--color-cream,#fff);border:1px solid #eee;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);padding:1.2rem;width:260px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;\">";',
    '            if (item.image) {',
    '              html += "<img src=\"" + item.image + "\" alt=\"" + (item.name || "") + "\" style=\"width:120px;height:120px;object-fit:cover;border-radius:8px;margin-bottom:0.8rem;background:#f5f5f5\">";',
    '            }',
    '            html += "<div style=\"font-weight:700;font-size:1.08rem;margin-bottom:0.3rem;color:var(--color-primary,#c1440e)\">" + (item.name || "") + "</div>";',
    '            if (item.description) html += "<div style=\"color:#666;font-size:0.97rem;margin-bottom:0.5rem;text-align:center\">" + item.description + "</div>";',
    '            if (item.price) html += "<div style=\"font-weight:600;color:var(--color-primary,#c1440e);margin-bottom:0.4rem\">" + item.price + "</div>";',
    '            if (item.available) html += "<div style=\"color:#888;font-size:0.92rem\">Available: " + item.available + "</div>";',
    '            html += "</div>";',
    '          });',
    '          html += "</div></div>";',
    '        });',
    '        contentDiv.innerHTML = html;',
    '      })',
    '      .catch(function() {',
    '        contentDiv.innerHTML = "<div style=\"color:#c00\">Failed to load offerings.</div>";',
    '      });',
    '  })();<\/script>',
    '</section>'
  ].join('\n');
}
