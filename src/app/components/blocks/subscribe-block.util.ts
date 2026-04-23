// subscribe-block.util.ts
// Utility to generate Subscribe Block HTML+JS with backend integration for both preview and published site
import { environment } from '../../../environments/environment';

export function getSubscribeBlockHtml(entityId: string, entityDisplayName: string): string {
  const apiUrl = environment.apiUrl || '';
  return `
<section id="subscribe-block"
         data-entity-id="${entityId}"
         data-entity-display-name="${entityDisplayName}"
         style="padding:2.5rem 2rem;background:var(--block-bg,#f9f4ee);text-align:center;font-family:var(--font-body);color:var(--color-text)">
  <h2 style="margin-bottom:0.8rem;font-family:var(--font-heading);color:var(--color-primary)">Subscribe for Updates</h2>
  <p style="color:var(--color-subtle,#666);margin-bottom:1.5rem">Get the latest news, offers, and updates. Enter your details below.</p>
  <form id="subscribeForm" style="display:flex;justify-content:center;gap:0.7rem;flex-wrap:wrap;max-width:700px;margin:0 auto;align-items:center" autocomplete="off">
    <input id="subName" type="text" placeholder="Your Name" required style="flex:1;min-width:140px;padding:0.8rem 1.1rem;border:1px solid var(--color-primary,#c1440e);border-radius:6px;font-size:1rem;font-family:var(--font-body);color:var(--color-text);background:var(--color-cream,#fff);transition:border 0.2s" />
    <input id="subEmail" type="email" placeholder="Your Email" required style="flex:1;min-width:180px;padding:0.8rem 1.1rem;border:1px solid var(--color-primary,#c1440e);border-radius:6px;font-size:1rem;font-family:var(--font-body);color:var(--color-text);background:var(--color-cream,#fff);transition:border 0.2s" />
    <input id="subPhone" type="tel" placeholder="Phone (optional)" style="flex:1;min-width:140px;padding:0.8rem 1.1rem;border:1px solid var(--color-primary,#c1440e);border-radius:6px;font-size:1rem;font-family:var(--font-body);color:var(--color-text);background:var(--color-cream,#fff);transition:border 0.2s" />
    <button type="submit" style="padding:0.8rem 2rem;background:var(--color-primary,#c1440e);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-size:1.1rem;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.08)">Subscribe</button>
  </form>
  <div id="subResult" style="margin-top:1rem;font-weight:600;color:var(--color-primary,#c1440e)"></div>
  <script>(function() {
    var form = document.getElementById('subscribeForm');
    var result = document.getElementById('subResult');
    form.onsubmit = function(e) {
      e.preventDefault();
      var section = document.getElementById('subscribe-block');
      var entityId = section.getAttribute('data-entity-id');
      var entityDisplayName = section.getAttribute('data-entity-display-name');
      var payload = {
        entityId: entityId,
        displayName: entityDisplayName,
        name: document.getElementById('subName').value,
        email: document.getElementById('subEmail').value,
        phone: document.getElementById('subPhone').value
      };
      result.textContent = 'Submitting...';
      fetch('${apiUrl}/api/subscribe/public/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(res => {
        result.textContent = res.message;
        if (res.success) form.reset();
      })
      .catch(() => { result.textContent = 'Subscription failed. Please try again.'; });
    };
  })();</script>
</section>
`;
}
