import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  contactForm = {
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  };

  submitted = false;
  loading = false;

  contactInfo = [
    {
      icon: '📧',
      title: 'Email',
      value: 'ravurinagaphanindra@gmail.com',
      link: 'mailto:ravurinagaphanindra@gmail.com'
    },
    {
      icon: '🌐',
      title: 'Website',
      value: 'ezit.ai',
      link: 'https://ezit.ai'
    },
    {
      icon: '🏢',
      title: 'Platform Support',
      value: 'Brand, onboarding, hosting, and AI workflow guidance',
      link: 'mailto:ravurinagaphanindra@gmail.com'
    }
  ];

  submitForm() {
    if (this.isFormValid()) {
      this.loading = true;
      // Simulate form submission
      setTimeout(() => {
        this.submitted = true;
        this.loading = false;
        this.resetForm();
        setTimeout(() => this.submitted = false, 4000);
      }, 1000);
    }
  }

  isFormValid(): boolean {
    return !!(this.contactForm.name && 
           this.contactForm.email && 
           this.contactForm.subject && 
           this.contactForm.message);
  }

  resetForm() {
    this.contactForm = {
      name: '',
      email: '',
      company: '',
      subject: '',
      message: ''
    };
  }
}
