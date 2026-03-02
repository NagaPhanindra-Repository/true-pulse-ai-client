import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent {
  lastUpdated = 'January 2026';

  sections = [
    {
      title: 'Introduction',
      content: 'TruePulse AI is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website and use our services.'
    },
    {
      title: 'Information We Collect',
      subsections: [
        {
          subtitle: 'Personal Information',
          content: 'We collect information you provide directly to us, including: name, email address, company information, phone number, and any other information you choose to provide. This may include account registration, contact forms, and support requests.'
        },
        {
          subtitle: 'Automatically Collected Information',
          content: 'When you access TruePulse AI, we automatically collect certain technical information, including: IP address, browser type, operating system, referring URLs, and pages visited. We use cookies and similar tracking technologies to enhance your experience.'
        },
        {
          subtitle: 'Usage Data',
          content: 'We collect information about how you interact with our platform, including feature usage, team retrospective data, and feedback patterns. This helps us improve our services and provide better insights.'
        }
      ]
    },
    {
      title: 'How We Use Your Information',
      content: 'We use collected information to: (1) provide, maintain, and improve our services; (2) process transactions and send confirmations; (3) send transactional emails and support communications; (4) respond to inquiries and provide customer support; (5) analyze usage patterns and optimize user experience; (6) comply with legal obligations; (7) detect and prevent fraud and security incidents; (8) develop new features and products.'
    },
    {
      title: 'Data Security',
      content: 'We implement comprehensive security measures to protect your personal information, including: end-to-end encryption for data in transit and at rest, industry-standard SSL/TLS protocols, regular security audits and penetration testing, SOC 2 Type II compliance, role-based access controls, and continuous monitoring for security threats. While we strive to protect your information, no method of transmission over the internet is 100% secure.'
    },
    {
      title: 'Data Retention',
      content: 'We retain personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time. We retain certain information as required by law or for legitimate business purposes, encrypted and securely stored separately.'
    },
    {
      title: 'Third-Party Services',
      content: 'We may share information with third-party service providers who assist us in operating our platform, including cloud infrastructure providers, payment processors, and analytics services. We ensure these providers maintain appropriate security and confidentiality measures. We do not sell or share your personal information for marketing purposes without your explicit consent.'
    },
    {
      title: 'Your Rights and Choices',
      content: 'Depending on your location, you may have rights including: access to your personal information, correction of inaccurate data, deletion of your data, portability of your information in a machine-readable format, and opt-out from certain data processing. To exercise these rights, contact us at ravurinagaphanindra@gmail.com.'
    },
    {
      title: 'Cookies and Tracking',
      content: 'We use cookies and similar technologies to enhance your experience. You can control cookie preferences through your browser settings. However, disabling cookies may affect functionality. We do not engage in cross-site tracking or selling of behavioral data.'
    },
    {
      title: 'International Data Transfers',
      content: 'Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws different from your home country. By using TruePulse AI, you consent to such transfers subject to appropriate safeguards.'
    },
    {
      title: 'Children\'s Privacy',
      content: 'TruePulse AI is not intended for children under 13. We do not knowingly collect personal information from children. If we discover that a child has provided us with personal information, we will delete such information promptly.'
    },
    {
      title: 'Changes to This Policy',
      content: 'We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of material changes by email or by posting the updated policy on our website with an updated effective date.'
    }
  ];
}
