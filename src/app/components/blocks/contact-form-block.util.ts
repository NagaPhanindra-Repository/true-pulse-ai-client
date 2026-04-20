// contact-form-block.util.ts
// Utility to generate Contact Form HTML+JS with backend integration for both preview and published site
import { environment } from '../../../environments/environment';

export function getContactFormBlockHtml(entityId: string, entityDisplayName: string): string {
  const apiUrl = environment.apiUrl || '';
  return `
<section id="contact-form-block"
         data-entity-id="${entityId}"
         data-entity-display-name="${entityDisplayName}"
         style="padding:3rem 2rem;background:var(--color-bg,#f9f9f9);text-align:center;font-family:var(--font-body);color:var(--color-text)">
  <h2 style="margin-bottom:1.5rem;font-family:var(--font-heading);color:var(--color-primary)">Get In Touch</h2>
  <form id="contactForm" style="max-width:540px;margin:0 auto;display:flex;flex-direction:column;gap:1rem">
    <input id="cfName" type="text" placeholder="Your Name" required style="padding:0.9rem 1.1rem;border:1px solid var(--color-primary,#c1440e);border-radius:var(--btn-radius,8px);font-size:1rem;font-family:var(--font-body);color:var(--color-text);background:var(--color-cream,#fff)" />
    <input id="cfEmail" type="email" placeholder="Your Email" required style="padding:0.9rem 1.1rem;border:1px solid var(--color-primary,#c1440e);border-radius:var(--btn-radius,8px);font-size:1rem;font-family:var(--font-body);color:var(--color-text);background:var(--color-cream,#fff)" />
    <textarea id="cfMessage" rows="5" placeholder="Your Message" required style="padding:0.9rem 1.1rem;border:1px solid var(--color-primary,#c1440e);border-radius:var(--btn-radius,8px);font-size:1rem;font-family:var(--font-body);color:var(--color-text);background:var(--color-cream,#fff)"></textarea>
    <button type="submit" style="padding:1rem 0;background:var(--color-primary,#c1440e);color:#fff;border:none;border-radius:var(--btn-radius,8px);font-weight:700;font-size:1.1rem;cursor:pointer;font-family:var(--font-body)">Send Message</button>
    <div id="cfResult" style="margin-top:1rem;font-weight:600;color:var(--color-primary,#c1440e)"></div>
  </form>
  <script>(function() {
    var form = document.getElementById('contactForm');
    var result = document.getElementById('cfResult');
    form.onsubmit = function(e) {
      e.preventDefault();
      var section = document.getElementById('contact-form-block');
      var entityId = section.getAttribute('data-entity-id');
      var entityDisplayName = section.getAttribute('data-entity-display-name');
      var payload = {
        entityId: entityId,
        displayName: entityDisplayName,
        name: document.getElementById('cfName').value,
        email: document.getElementById('cfEmail').value,
        message: document.getElementById('cfMessage').value
      };
      result.textContent = 'Submitting...';
      fetch('${apiUrl}/api/contact-form/public/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(res => {
        result.textContent = res.message;
        if (res.success) form.reset();
      })
      .catch(() => { result.textContent = 'Submission failed. Please try again.'; });
    };
  })();</script>
</section>
`;
}
