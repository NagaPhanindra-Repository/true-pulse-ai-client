import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-of-service.component.html',
  styleUrl: './terms-of-service.component.scss'
})
export class TermsOfServiceComponent {
  effectiveDate = 'January 1, 2026';

  sections = [
    {
      title: 'Agreement to Terms',
      content: 'By accessing and using the TruePulse AI platform (the "Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to abide by the above, please do not use this service.'
    },
    {
      title: 'Use License',
      content: 'Permission is granted to temporarily download one copy of the materials (information or software) on TruePulse AI\'s platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: (a) modify or copy the materials; (b) use the materials for any commercial purpose, or for any public display (commercial or non-commercial); (c) attempt to decompile or reverse engineer any software contained on TruePulse AI; (d) remove any copyright or other proprietary notations from the materials; or (e) transfer the materials to another person or "mirror" the materials on any other server.'
    },
    {
      title: 'Disclaimer of Warranties',
      content: 'The materials on TruePulse AI\'s platform are provided on an \'as is\' basis. TruePulse AI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.'
    },
    {
      title: 'Limitations of Liability',
      content: 'In no event shall TruePulse AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on TruePulse AI\'s platform, even if TruePulse AI or an authorized representative has been notified of the possibility of such damage.'
    },
    {
      title: 'Accuracy of Materials',
      content: 'The materials appearing on TruePulse AI could include technical, typographical, or photographic errors. TruePulse AI does not warrant that any of the materials on its platform are accurate, complete, or current. TruePulse AI may make changes to the materials contained on its platform at any time without notice.'
    },
    {
      title: 'Materials and Links',
      content: 'TruePulse AI has not reviewed all of the sites linked to its platform and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by TruePulse AI of the site. Use of any such linked website is at the user\'s own risk.'
    },
    {
      title: 'Modifications',
      content: 'TruePulse AI may revise these terms of service for its platform at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.'
    },
    {
      title: 'User Accounts and Responsibilities',
      content: 'When you register for an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.'
    },
    {
      title: 'User Content',
      content: 'The Service may allow you to post, store, and share content including retrospective feedback, team discussions, and business documents. You retain ownership of your content. By posting content to the Service, you grant TruePulse AI a license to use, reproduce, and display the content as necessary to operate the Service.'
    },
    {
      title: 'Prohibited Activities',
      content: 'You agree not to engage in any of the following prohibited activities: (a) harassing, threatening, or intimidating other users; (b) posting or transmitting unlawful content; (c) attempting to gain unauthorized access to the platform or related systems; (d) interfering with the normal operation of the Service; (e) violating any applicable laws or regulations; (f) uploading malicious software; (g) using the Service for competitive intelligence or reverse engineering.'
    },
    {
      title: 'Cancellation and Termination',
      content: 'You may cancel your account at any time. TruePulse AI reserves the right to terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason or no reason, including if TruePulse AI believes you have violated these Terms of Service. Upon termination, your right to use the Service will immediately cease.'
    },
    {
      title: 'Indemnification',
      content: 'You agree to indemnify and hold harmless TruePulse AI and its officers, directors, employees, agents, and successors from any and all claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms of Service.'
    },
    {
      title: 'Governing Law',
      content: 'These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.'
    }
  ];
}
