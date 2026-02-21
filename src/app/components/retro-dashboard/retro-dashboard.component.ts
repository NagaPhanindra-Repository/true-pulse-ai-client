import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/security/auth.service';
import { RetroService } from '../../services/retro.service';
import { FeedbackPoint } from '../../models/feedback-point.model';
import { Discussion } from '../../models/discussion.model';
import { RetroSessionComponent } from '../retro-session/retro-session.component';

// @ts-ignore - pdfmake doesn't have TypeScript definitions
import * as pdfMakeModule from 'pdfmake/build/pdfmake';
// @ts-ignore - pdfmake doesn't have TypeScript definitions  
import * as pdfFontsModule from 'pdfmake/build/vfs_fonts';

@Component({
  selector: 'app-retro-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RetroSessionComponent],
  templateUrl: './retro-dashboard.component.html',
  styleUrl: './retro-dashboard.component.scss'
})
export class RetroDashboardComponent implements OnInit {
  retro: any = null;
  feedbackPoints: FeedbackPoint[] = [];
  discussions: Discussion[] = [];
  actionItems: any[] = [];
  pastActionItems: any[] = [];
  questions: any[] = [];
  loading: boolean = false;

  // Action item entry/edit state
  actionEntry: { description: string; dueDate: string; assignedUserName: string } = { description: '', dueDate: '', assignedUserName: '' };
  actionEdit: { [id: number]: boolean } = {};
  actionEditValue: { [id: number]: any } = {};
  pastActionEdit: { [id: number]: boolean } = {};
  pastActionEditValue: { [id: number]: any } = {};

  showSession = false;
  sessionPaused = false;
  pausedStep: 'summary' | 'feedback' | 'done' = 'summary';
  pausedFeedbackIndex = 0;

  startRetroSession() {
    this.showSession = true;
  }

  onSessionEnded() {
    this.showSession = false;
    this.sessionPaused = false;
    this.pausedStep = 'summary';
    this.pausedFeedbackIndex = 0;
    if (this.retro && this.retro.id) {
      this.fetchRetroDetails(this.retro.id);
    }
  }

  onSessionPaused(state: { step: 'summary' | 'feedback' | 'done'; currentFeedbackIndex: number }) {
    this.showSession = false;
    this.sessionPaused = true;
    this.pausedStep = state.step;
    this.pausedFeedbackIndex = state.currentFeedbackIndex;
  }

  get startRetroLabel(): string {
    return this.sessionPaused ? 'Resume Retro' : 'Start Retro';
  }

  get startRetroSubLabel(): string {
    if (!this.sessionPaused) {
      return 'Start the guided session with AI insights and discussions.';
    }
    if (this.pausedStep === 'summary') {
      return 'Paused at the session summary. Pick up where you left off.';
    }
    if (this.pausedStep === 'done') {
      return 'Paused at the wrap up. Finish the session when you are ready.';
    }
    const total = this.feedbackPoints.length;
    const current = total > 0 ? Math.min(this.pausedFeedbackIndex + 1, total) : 1;
    return `Paused at feedback point ${current}${total > 0 ? ` of ${total}` : ''}. Pick up where you left off.`;
  }

  loadActionItems(): void {
    if (!this.retro || !this.retro.id) return;
    this.retroService.getActionItemsWithPast(this.retro.id).subscribe({
      next: (response) => {
        this.actionItems = response.currentRetroActionItems || [];
        this.pastActionItems = response.pastRetroActionItems || [];
        console.log('Loaded action items:', { current: this.actionItems.length, past: this.pastActionItems.length });
      },
      error: (err) => {
        console.error('Error loading action items:', err);
        // Fallback to old API if new one fails
        this.retroService.getActionItemsByRetroId(this.retro.id).subscribe({
          next: (items: any[]) => {
            this.actionItems = items || [];
            this.pastActionItems = [];
          }
        });
      }
    });
  }

  addActionItem(): void {
    if (!this.actionEntry.description || !this.actionEntry.dueDate || !this.actionEntry.assignedUserName || !this.retro || !this.retro.id) return;
    const payload = {
      description: this.actionEntry.description,
      dueDate: this.actionEntry.dueDate,
      retroId: this.retro.id,
      assignedUserName: this.actionEntry.assignedUserName
    };
    this.retroService.createActionItem(payload).subscribe({
      next: () => {
        this.actionEntry = { description: '', dueDate: '', assignedUserName: '' };
        this.loadActionItems();
      }
    });
  }

  startEditAction(item: any): void {
    this.actionEdit[item.id] = true;
    this.actionEditValue[item.id] = { ...item };
  }

  saveEditAction(item: any): void {
    const updated = this.actionEditValue[item.id];
    this.retroService.updateActionItem(item.id, updated).subscribe({
      next: () => {
        this.actionEdit[item.id] = false;
        this.loadActionItems();
      }
    });
  }

  cancelEditAction(item: any): void {
    this.actionEdit[item.id] = false;
    this.actionEditValue[item.id] = {};
  }

  // Feedback entry state per lane
  feedbackEntry = {
    LIKED: '',
    LEARNED: '',
    LACKED: '',
    LONGED_FOR: ''
  };
  feedbackEdit: { [id: number]: boolean } = {};
  feedbackEditValue: { [id: number]: string } = {};

  // Discussion entry/edit state
  discussionEntry: { [feedbackId: number]: string } = {};
  discussionEdit: { [id: number]: boolean } = {};
  discussionEditValue: { [id: number]: string } = {};

  get likedFeedbacks(): FeedbackPoint[] {
    return this.feedbackPoints.filter(f => f.type === 'LIKED' && f.id !== undefined);
  }
  get learnedFeedbacks(): FeedbackPoint[] {
    return this.feedbackPoints.filter(f => f.type === 'LEARNED' && f.id !== undefined);
  }
  get lackedFeedbacks(): FeedbackPoint[] {
    return this.feedbackPoints.filter(f => f.type === 'LACKED' && f.id !== undefined);
  }
  get longedFeedbacks(): FeedbackPoint[] {
    return this.feedbackPoints.filter(f => f.type === 'LONGED_FOR' && f.id !== undefined);
  }

  getDiscussionsFor(feedbackId: number | undefined): Discussion[] {
    if (!feedbackId) return [];
    return this.discussions.filter(d => d.feedbackPointId === feedbackId && d.id !== undefined);
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private feedbackService: FeedbackService,
    private retroService: RetroService,
    private auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Only fetch data in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      // Fetch user details if authenticated (needed for discussions)
      if (this.auth.isAuthenticated() && !this.auth.user) {
        this.auth.fetchUserDetails().subscribe({
          error: (err) => console.error('Error fetching user details:', err)
        });
      }
      // Try to get retro id from route params
      this.route.paramMap.subscribe(params => {
        const retroId = params.get('id');
        if (retroId) {
          this.fetchRetroDetails(retroId);
        } else if (history.state && history.state.retro) {
          // fallback for navigation state (e.g. after create)
          this.retro = history.state.retro;
          this.loadFeedbackPoints();
          this.loadDiscussions();
        }
      });
    }
  }



  fetchRetroDetails(retroId: string) {
    this.loading = true;
    this.retroService.getRetroDetails(retroId).subscribe({
      next: (data) => {
        this.retro = {
          id: data.id,
          title: data.title,
          description: data.description,
          userId: data.userId,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
        this.feedbackPoints = (data.feedbackPoints || []).map((fp: any) => {
          // Flatten discussions for each feedback point
          return {
            ...fp,
            discussions: undefined // discussions handled separately
          };
        });
        // Flatten all discussions for easy access
        this.discussions = (data.feedbackPoints || []).flatMap((fp: any) =>
          (fp.discussions || []).map((d: any) => ({
            ...d,
            feedbackPointId: fp.id
          }))
        );
        this.questions = data.questions || [];
        this.loadActionItems();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadFeedbackPoints() {
    if (!this.retro?.id) return;
    this.loading = true;
    this.feedbackService.getFeedbackPoints().subscribe({
      next: (points) => {
        this.feedbackPoints = points.filter(p => p.retroId === this.retro.id);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  addFeedbackPoint(type: 'LIKED' | 'LEARNED' | 'LACKED' | 'LONGED_FOR') {
    const description = this.feedbackEntry[type].trim();
    if (!description || !this.retro?.id) return;
    const point: FeedbackPoint = {
      type,
      description,
      retroId: this.retro.id
    };
    this.feedbackService.createFeedbackPoint(point).subscribe({
      next: () => {
        this.feedbackEntry[type] = '';
        this.loadFeedbackPoints();
      }
    });
  }

  startEditFeedback(feedback: FeedbackPoint) {
    this.feedbackEdit[feedback.id!] = true;
    this.feedbackEditValue[feedback.id!] = feedback.description;
  }

  saveEditFeedback(feedback: FeedbackPoint) {
    const newDesc = this.feedbackEditValue[feedback.id!].trim();
    if (!newDesc) return;
    const updated: FeedbackPoint = {
      ...feedback,
      description: newDesc
    };
    this.feedbackService.updateFeedbackPoint(feedback.id!, updated).subscribe({
      next: () => {
        this.feedbackEdit[feedback.id!] = false;
        this.loadFeedbackPoints();
      }
    });
  }

  cancelEditFeedback(feedback: FeedbackPoint) {
    this.feedbackEdit[feedback.id!] = false;
    this.feedbackEditValue[feedback.id!] = '';
  }

  // Discussion logic
  addDiscussion(feedback: FeedbackPoint) {
    const note = this.discussionEntry[feedback.id!]?.trim();
    if (!note) {
      console.error('Cannot add discussion - missing note');
      return;
    }
    
    // Try to get logged-in user ID, fallback to retro creator ID
    const userId = this.auth.user?.id || this.retro?.userId;
    if (!userId) {
      console.error('Cannot add discussion - user ID not found and no retro user ID available');
      return;
    }
    
    const discussion: Discussion = {
      note,
      feedbackPointId: feedback.id!,
      userId: userId
    };
    this.feedbackService.createDiscussion(discussion).subscribe({
      next: () => {
        console.log('Discussion added successfully', { userId: userId });
        this.discussionEntry[feedback.id!] = '';
        if (this.retro?.id) {
          this.fetchRetroDetails(this.retro.id);
        }
      },
      error: (err) => {
        console.error('Error adding discussion:', err);
      }
    });
  }

  startEditDiscussion(disc: Discussion) {
    this.discussionEdit[disc.id!] = true;
    this.discussionEditValue[disc.id!] = disc.note;
  }

  saveEditDiscussion(disc: Discussion) {
    const newNote = this.discussionEditValue[disc.id!].trim();
    if (!newNote) {
      console.error('Cannot save discussion - missing note');
      return;
    }
    
    // Try to get logged-in user ID, fallback to retro creator ID or original discussion user ID
    const userId = this.auth.user?.id || this.retro?.userId || disc.userId;
    if (!userId) {
      console.error('Cannot save discussion - user ID not found');
      return;
    }
    
    const updated: Discussion = {
      ...disc,
      note: newNote,
      userId: userId
    };
    this.feedbackService.updateDiscussion(disc.id!, updated).subscribe({
      next: () => {
        console.log('Discussion updated successfully', { userId: userId });
        this.discussionEdit[disc.id!] = false;
        if (this.retro?.id) {
          this.fetchRetroDetails(this.retro.id);
        }
      },
      error: (err) => {
        console.error('Error updating discussion:', err);
      }
    });
  }

  cancelEditDiscussion(disc: Discussion) {
    this.discussionEdit[disc.id!] = false;
    this.discussionEditValue[disc.id!] = '';
  }

  loadDiscussions() {
    this.feedbackService.getDiscussions().subscribe({
      next: (discs) => {
        this.discussions = discs;
      }
    });
  }

    deleteFeedback(feedback: FeedbackPoint) {
    if (!feedback.id) return;
    if (!confirm('Are you sure you want to delete this feedback point?')) return;
    this.feedbackService.deleteFeedbackPoint(feedback.id).subscribe({
      next: () => {
        this.loadFeedbackPoints();
      }
    });
  }

  deleteDiscussion(disc: Discussion) {
    if (!disc.id) return;
    if (!confirm('Are you sure you want to delete this discussion?')) return;
    this.feedbackService.deleteDiscussion(disc.id).subscribe({
      next: () => {
        console.log('Discussion deleted successfully');
        if (this.retro?.id) {
          this.fetchRetroDetails(this.retro.id);
        }
      },
      error: (err) => {
        console.error('Error deleting discussion:', err);
      }
    });
  }

    deleteActionItem(item: any): void {
    if (!item.id) return;
    if (!confirm('Are you sure you want to delete this action item?')) return;
    this.retroService.deleteActionItem(item.id).subscribe({
      next: () => {
        this.loadActionItems();
      }
    });
  }

  // Past action items management
  startEditPastAction(item: any): void {
    this.pastActionEdit[item.id] = true;
    this.pastActionEditValue[item.id] = { ...item };
  }

  saveEditPastAction(item: any): void {
    const updated = this.pastActionEditValue[item.id];
    this.retroService.updateActionItem(item.id, updated).subscribe({
      next: () => {
        this.pastActionEdit[item.id] = false;
        this.loadActionItems();
      }
    });
  }

  cancelEditPastAction(item: any): void {
    this.pastActionEdit[item.id] = false;
    this.pastActionEditValue[item.id] = {};
  }

  deletePastActionItem(item: any): void {
    if (!item.id) return;
    if (!confirm('Are you sure you want to delete this action item?')) return;
    this.retroService.deleteActionItem(item.id).subscribe({
      next: () => {
        this.loadActionItems();
      }
    });
  }

  // Helper method to check if a date is overdue
  isOverdue(dueDate: string): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  // Export retro to PDF
  exportToPDF() {
    console.log('exportToPDF called');
    try {
      console.log('Getting pdfMake from imports');
      const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
      console.log('pdfMake object:', pdfMake);
      
      // Set VFS - vfs_fonts exports the vfs object directly or as default
      const vfs = (pdfFontsModule as any).default || pdfFontsModule;
      (pdfMake as any).vfs = vfs;
      console.log('VFS set, vfs type:', typeof vfs);

      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [50, 60, 50, 60],
        content: [
          // Premium Header
          this.generatePDFHeader(),
          
          // Executive Summary
          this.generateExecutiveSummary(),

          // Main Retrospective Feedback - 4 Column Table
          {
            text: 'RETROSPECTIVE FEEDBACK SUMMARY',
            style: 'mainSectionTitle',
            margin: [0, 0, 0, 15]
          },
          this.generateFeedbackCategoryTable(),

          // Current Action Items Section
          {
            text: 'ACTION ITEMS - CURRENT RETROSPECTIVE',
            style: 'mainSectionTitle',
            margin: [0, 0, 0, 15]
          },
          this.generateCurrentActionItemsSection(),

          // Past Action Items (if any)
          ...(this.pastActionItems.length > 0 ? [
            {
              text: 'ACTION ITEMS - FROM PAST RETROSPECTIVES',
              style: 'mainSectionTitle',
              margin: [0, 0, 0, 15]
            },
            this.generatePastActionItemsSection()
          ] : [])
        ],
        styles: {
          mainSectionTitle: {
            fontSize: 18,
            bold: true,
            color: '#1e293b',
            margin: [0, 20, 0, 15],
            border: [false, false, false, true],
            borderColor: '#e2e8f0',
            borderWidth: [0, 0, 0, 3]
          },
          header: {
            fontSize: 32,
            bold: true,
            color: '#0f172a',
            margin: [0, 0, 0, 5]
          },
          subheader: {
            fontSize: 13,
            color: '#475569',
            margin: [0, 0, 0, 3]
          },
          metadata: {
            fontSize: 10,
            color: '#64748b',
            italics: true
          },
          summaryLabel: {
            fontSize: 11,
            bold: true,
            color: '#1e293b'
          },
          summaryValue: {
            fontSize: 11,
            color: '#475569'
          },
          tableHeader: {
            bold: true,
            fontSize: 11,
            color: 'white',
            alignment: 'left',
            valign: 'middle'
          },
          tableContent: {
            fontSize: 9.5,
            color: '#1e293b'
          },
          categoryHeader: {
            fontSize: 10,
            bold: true,
            color: 'white',
            valign: 'middle',
            alignment: 'center'
          },
          categoryContent: {
            fontSize: 9,
            color: '#1e293b',
            valign: 'top'
          },
          actionDescription: {
            fontSize: 9.5,
            color: '#1e293b'
          },
          actionStatus: {
            fontSize: 9,
            bold: true,
            color: 'white',
            alignment: 'center'
          }
        },
        defaultStyle: {
          fontSize: 10,
          color: '#1e293b'
        }
      };

      pdfMake.createPdf(docDefinition).download(`${this.sanitizeFilename(this.retro.title)}_retrospective.pdf`);
      console.log('PDF generated successfully');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      alert(`Unable to generate PDF:\n${error?.message || error}\n\nPlease make sure pdfmake is installed: npm install pdfmake`);
    }
  }

  private generatePDFHeader(): any {
    return {
      stack: [
        {
          text: this.retro.title || 'Retrospective Report',
          style: 'header',
          color: '#0f172a'
        },
        {
          text: this.retro.description || 'Team Retrospective Analysis',
          style: 'subheader'
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 465,
              y2: 0,
              lineWidth: 3,
              lineColor: '#3b82f6'
            }
          ]
        },
        {
          text: `Report Generated: ${this.formatDate(new Date().toString())} | Retrospective Created: ${this.formatDate(this.retro.createdAt)}`,
          style: 'metadata',
          margin: [0, 8, 0, 0]
        }
      ],
      margin: [0, 0, 0, 30]
    };
  }

  private generateExecutiveSummary(): any {
    const likedCount = this.likedFeedbacks.length;
    const learnedCount = this.learnedFeedbacks.length;
    const lackedCount = this.lackedFeedbacks.length;
    const longedCount = this.longedFeedbacks.length;
    const totalFeedback = likedCount + learnedCount + lackedCount + longedCount;
    const totalDiscussions = this.discussions.length;
    const totalActionItems = this.actionItems.length + this.pastActionItems.length;

    return {
      stack: [
        {
          text: 'EXECUTIVE SUMMARY',
          style: 'mainSectionTitle',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              width: '25%',
              stack: [
                { text: 'Total Feedback Points', style: 'summaryLabel' },
                { text: totalFeedback.toString(), fontSize: 24, bold: true, color: '#3b82f6', margin: [0, 5, 0, 0] }
              ]
            },
            {
              width: '25%',
              stack: [
                { text: 'Team Discussions', style: 'summaryLabel' },
                { text: totalDiscussions.toString(), fontSize: 24, bold: true, color: '#10b981', margin: [0, 5, 0, 0] }
              ]
            },
            {
              width: '25%',
              stack: [
                { text: 'Action Items', style: 'summaryLabel' },
                { text: totalActionItems.toString(), fontSize: 24, bold: true, color: '#f59e0b', margin: [0, 5, 0, 0] }
              ]
            },
            {
              width: '25%',
              stack: [
                { text: 'Feedback Categories', style: 'summaryLabel' },
                { 
                  text: `${likedCount} Liked | ${learnedCount} Learned | ${lackedCount} Lacked | ${longedCount} Longed`,
                  fontSize: 10,
                  bold: true,
                  margin: [0, 5, 0, 0]
                }
              ]
            }
          ],
          columnGap: 15,
          margin: [0, 0, 0, 30]
        }
      ]
    };
  }

  private generateFeedbackCategoryTable(): any {
    const likedItems = this.likedFeedbacks;
    const learnedItems = this.learnedFeedbacks;
    const lackedItems = this.lackedFeedbacks;
    const longedItems = this.longedFeedbacks;

    // Calculate max rows to determine table height
    const maxRows = Math.max(
      likedItems.length || 1,
      learnedItems.length || 1,
      lackedItems.length || 1,
      longedItems.length || 1
    );

    // Create table body with merged cells
    const tableBody: any[] = [];

    // Headers with color coding
    tableBody.push([
      { text: 'LIKED', style: 'categoryHeader', fillColor: '#10b981', border: [1, 1, 1, 1], borderColor: '#0d9488' },
      { text: 'LEARNED', style: 'categoryHeader', fillColor: '#3b82f6', border: [1, 1, 1, 1], borderColor: '#2563eb' },
      { text: 'LACKED', style: 'categoryHeader', fillColor: '#f59e0b', border: [1, 1, 1, 1], borderColor: '#d97706' },
      { text: 'LONGED FOR', style: 'categoryHeader', fillColor: '#a78bfa', border: [1, 1, 1, 1], borderColor: '#9333ea' }
    ]);

    // Data rows
    for (let i = 0; i < maxRows; i++) {
      const row: any[] = [];

      // LIKED column
      if (i < likedItems.length) {
        const fb = likedItems[i];
        const discussions = this.getDiscussionsFor(fb.id);
        row.push({
          stack: [
            { text: fb.description, style: 'categoryContent', bold: true, margin: [0, 0, 0, 5] },
            discussions.length > 0 ? {
              text: discussions.map(d => `• ${d.note}`).join('\n'),
              style: 'categoryContent',
              color: '#047857',
              fontSize: 8,
              margin: [0, 5, 0, 0]
            } : { text: '(No discussion)', fontSize: 8, color: '#9ca3af', italics: true }
          ],
          border: [1, 1, 1, 1],
          borderColor: '#d1fae5',
          padding: [8, 8, 8, 8],
          fillColor: '#f0fdf4'
        });
      } else {
        row.push({ text: '', border: [1, 1, 1, 1], borderColor: '#d1fae5', padding: [8, 8, 8, 8] });
      }

      // LEARNED column
      if (i < learnedItems.length) {
        const fb = learnedItems[i];
        const discussions = this.getDiscussionsFor(fb.id);
        row.push({
          stack: [
            { text: fb.description, style: 'categoryContent', bold: true, margin: [0, 0, 0, 5] },
            discussions.length > 0 ? {
              text: discussions.map(d => `• ${d.note}`).join('\n'),
              style: 'categoryContent',
              color: '#1e40af',
              fontSize: 8,
              margin: [0, 5, 0, 0]
            } : { text: '(No discussion)', fontSize: 8, color: '#9ca3af', italics: true }
          ],
          border: [1, 1, 1, 1],
          borderColor: '#dbeafe',
          padding: [8, 8, 8, 8],
          fillColor: '#f0f9ff'
        });
      } else {
        row.push({ text: '', border: [1, 1, 1, 1], borderColor: '#dbeafe', padding: [8, 8, 8, 8] });
      }

      // LACKED column
      if (i < lackedItems.length) {
        const fb = lackedItems[i];
        const discussions = this.getDiscussionsFor(fb.id);
        row.push({
          stack: [
            { text: fb.description, style: 'categoryContent', bold: true, margin: [0, 0, 0, 5] },
            discussions.length > 0 ? {
              text: discussions.map(d => `• ${d.note}`).join('\n'),
              style: 'categoryContent',
              color: '#b45309',
              fontSize: 8,
              margin: [0, 5, 0, 0]
            } : { text: '(No discussion)', fontSize: 8, color: '#9ca3af', italics: true }
          ],
          border: [1, 1, 1, 1],
          borderColor: '#fed7aa',
          padding: [8, 8, 8, 8],
          fillColor: '#fffbeb'
        });
      } else {
        row.push({ text: '', border: [1, 1, 1, 1], borderColor: '#fed7aa', padding: [8, 8, 8, 8] });
      }

      // LONGED FOR column
      if (i < longedItems.length) {
        const fb = longedItems[i];
        const discussions = this.getDiscussionsFor(fb.id);
        row.push({
          stack: [
            { text: fb.description, style: 'categoryContent', bold: true, margin: [0, 0, 0, 5] },
            discussions.length > 0 ? {
              text: discussions.map(d => `• ${d.note}`).join('\n'),
              style: 'categoryContent',
              color: '#6b21a8',
              fontSize: 8,
              margin: [0, 5, 0, 0]
            } : { text: '(No discussion)', fontSize: 8, color: '#9ca3af', italics: true }
          ],
          border: [1, 1, 1, 1],
          borderColor: '#e9d5ff',
          padding: [8, 8, 8, 8],
          fillColor: '#faf5ff'
        });
      } else {
        row.push({ text: '', border: [1, 1, 1, 1], borderColor: '#e9d5ff', padding: [8, 8, 8, 8] });
      }

      tableBody.push(row);
    }

    return {
      table: {
        headerRows: 1,
        widths: ['25%', '25%', '25%', '25%'],
        body: tableBody
      },
      layout: {},
      margin: [0, 0, 0, 20]
    };
  }

  private generateCurrentActionItemsSection(): any {
    if (this.actionItems.length === 0) {
      return {
        text: 'No action items for current retrospective.',
        color: '#9ca3af',
        italics: true,
        margin: [0, 0, 0, 20]
      };
    }

    const statusColors: any = {
      'OPEN': '#ef4444',
      'IN_PROGRESS': '#f59e0b',
      'COMPLETED': '#10b981',
      'CANCELLED': '#94a3b8'
    };

    const tableBody = [
      [
        { text: '#', style: 'tableHeader', fillColor: '#1e293b', width: '5%' },
        { text: 'DESCRIPTION', style: 'tableHeader', fillColor: '#1e293b', width: '45%' },
        { text: 'DUE DATE', style: 'tableHeader', fillColor: '#1e293b', width: '15%' },
        { text: 'OWNER', style: 'tableHeader', fillColor: '#1e293b', width: '20%' },
        { text: 'STATUS', style: 'tableHeader', fillColor: '#1e293b', width: '15%' }
      ],
      ...this.actionItems.map((item, idx) => {
        const statusColor = statusColors[item.status] || '#6b7280';
        return [
          {
            text: (idx + 1).toString(),
            style: 'tableContent',
            alignment: 'center',
            color: '#475569'
          },
          {
            text: item.description || '',
            style: 'actionDescription'
          },
          {
            text: this.formatDate(item.dueDate),
            style: 'tableContent',
            color: this.isOverdue(item.dueDate) ? '#dc2626' : '#475569'
          },
          {
            text: item.assignedUserName ? `@${item.assignedUserName}` : 'Unassigned',
            style: 'tableContent'
          },
          {
            text: item.status || 'OPEN',
            style: 'actionStatus',
            fillColor: statusColor,
            padding: [4, 8, 4, 8]
          }
        ];
      })
    ];

    return {
      table: {
        headerRows: 1,
        widths: ['5%', '45%', '15%', '20%', '15%'],
        body: tableBody
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === tableBody.length ? 2 : 0.5,
        hLineColor: () => '#e2e8f0',
        vLineWidth: () => 0.5,
        vLineColor: () => '#e2e8f0'
      },
      margin: [0, 0, 0, 20]
    };
  }

  private generatePastActionItemsSection(): any {
    const statusColors: any = {
      'OPEN': '#ef4444',
      'IN_PROGRESS': '#f59e0b',
      'COMPLETED': '#10b981',
      'CANCELLED': '#94a3b8'
    };

    const tableBody = [
      [
        { text: 'RETRO', style: 'tableHeader', fillColor: '#1e293b', width: '8%' },
        { text: 'DESCRIPTION', style: 'tableHeader', fillColor: '#1e293b', width: '40%' },
        { text: 'DUE DATE', style: 'tableHeader', fillColor: '#1e293b', width: '15%' },
        { text: 'OWNER', style: 'tableHeader', fillColor: '#1e293b', width: '18%' },
        { text: 'STATUS', style: 'tableHeader', fillColor: '#1e293b', width: '12%' }
      ],
      ...this.pastActionItems.map(item => {
        const statusColor = statusColors[item.status] || '#6b7280';
        return [
          {
            text: `#${item.retroId}`,
            style: 'tableContent',
            bold: true,
            color: '#f59e0b'
          },
          {
            text: item.description || '',
            style: 'tableContent'
          },
          {
            text: this.formatDate(item.dueDate),
            style: 'tableContent',
            color: this.isOverdue(item.dueDate) ? '#dc2626' : '#475569',
            bold: this.isOverdue(item.dueDate) ? true : false
          },
          {
            text: item.assignedUserName ? `@${item.assignedUserName}` : 'Unassigned',
            style: 'tableContent'
          },
          {
            text: item.status || 'OPEN',
            style: 'actionStatus',
            fillColor: statusColor,
            padding: [4, 8, 4, 8]
          }
        ];
      })
    ];

    return {
      table: {
        headerRows: 1,
        widths: ['8%', '40%', '15%', '18%', '12%'],
        body: tableBody
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === tableBody.length ? 2 : 0.5,
        hLineColor: () => '#e2e8f0',
        vLineWidth: () => 0.5,
        vLineColor: () => '#e2e8f0'
      },
      margin: [0, 0, 0, 20]
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
}
