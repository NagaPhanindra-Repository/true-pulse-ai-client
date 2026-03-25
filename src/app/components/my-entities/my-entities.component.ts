import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';
import { EntityService } from '../../services/entity.service';
import {
  BusinessLeaderProfile,
  BusinessProfile,
  CelebrityProfile,
  CreateEntityResponse,
  EntityType,
  GenerateBusinessImageRequest,
  GenerateBusinessImageResponse,
  OverlaySpec,
  PoliticianProfile
} from '../../models/entity.model';
import { BusinessDocumentService } from '../../services/business-document.service';

interface DetailRow {
  label: string;
  value: string;
}

interface PosterTextStyle {
  fontFamily: string;
  fontWeight: number;
  fillStyle: string;
  fillStyleSecondary: string;
  strokeStyle: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  letterSpacing: number;
  uppercase: boolean;
  maxLines: number;
}

interface SampledPalette {
  r: number;
  g: number;
  b: number;
  luminance: number;
  saturation: number;
  hue: number;
}

interface OverlayRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface OverlayAnchorBounds extends OverlayRect {
  key: string;
  role: string;
  text: string;
}

@Component({
  selector: 'app-my-entities',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './my-entities.component.html',
  styleUrls: ['./my-entities.component.scss']
})
export class MyEntitiesComponent implements OnInit {
  @ViewChild('posterCanvas') posterCanvas?: ElementRef<HTMLCanvasElement>;

  entities: CreateEntityResponse[] = [];
  selectedEntity: CreateEntityResponse | null = null;
  loading = true;
  error = '';
  searchTerm = '';
  uploadStatus = '';
  isUploading = false;
  isEditing = false;
  isSaving = false;
  isDeleting = false;
  profileLoading = false;
  saveStatus = '';
  deleteStatus = '';
  editForm: any = {};
  imagePrompt = '';
  selectedImageSize = '1024x1024';
  readonly imageSizeOptions = ['1024x1024', '1024x1536', '1536x1024'];
  isGeneratingImage = false;
  imageGenerationStatus = '';
  imageGenerationError = '';
  generatedImage: GenerateBusinessImageResponse | null = null;
  generatedImageUrl = '';
  composedPosterUrl = '';
  posterRenderError = '';
  isPosterRendering = false;
  lastGenerationRequest: GenerateBusinessImageRequest | null = null;
  selectedOverlayFontStyle = 'auto';
  selectedOverlayColorStyle = 'auto';
  customOverlayFontFamily = `Montserrat, 'Avenir Next', 'Segoe UI', Arial, sans-serif`;
  customOverlayPrimaryColor = '#ffeeb9';
  customOverlayHighlightColor = '#fff8df';
  customOverlayStrokeColor = '#2a1422';
  readonly overlayFontStyleOptions = [
    { value: 'auto', label: 'Auto (Image Inspired)' },
    { value: 'classic', label: 'Classic Serif' },
    { value: 'modern', label: 'Modern Sans' },
    { value: 'poster', label: 'Poster Bold' },
    { value: 'elegant', label: 'Elegant Editorial' },
    { value: 'condensed', label: 'Condensed Ad' },
    { value: 'custom', label: 'Custom Font Family' }
  ];
  readonly overlayColorStyleOptions = [
    { value: 'auto', label: 'Auto (Image Inspired)' },
    { value: 'warm', label: 'Warm Festival' },
    { value: 'cool', label: 'Cool Vibrant' },
    { value: 'mono', label: 'Neutral Monotone' },
    { value: 'custom', label: 'Custom Colors' }
  ];
  overlayManualOffsets: Record<string, { x: number; y: number }> = {};
  overlayAnchorBounds: OverlayAnchorBounds[] = [];
  overlayTextEdits: Record<string, string> = {};
  overlayFontSizeScale: Record<string, number> = {};
  customAddedOverlays: OverlaySpec[] = [];
  removedOverlayKeys: Set<string> = new Set();
  selectedAnchorKey: string | null = null;
  showAddOverlayForm = false;
  newOverlayDraft = { text: '', zone: 'upper-middle', role: 'custom', size: 'medium' };
  isPosterDragging = false;
  posterCanvasCursor: 'default' | 'grab' | 'grabbing' = 'default';
  private dragState: { key: string; startX: number; startY: number; originX: number; originY: number; hasDragged: boolean } | null = null;
  private interactiveRenderQueued = false;

  constructor(
    private entityService: EntityService,
    private docService: BusinessDocumentService
  ) {}

  ngOnInit(): void {
    this.loadEntities();
  }

  loadEntities(): void {
    this.loading = true;
    this.error = '';
    this.entityService.getMyEntities().subscribe({
      next: entities => {
        this.entities = entities || [];
        this.selectedEntity = this.entities[0] || null;
        if (this.selectedEntity) {
          this.loadProfile(this.selectedEntity);
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load your entities.';
        this.loading = false;
      }
    });
  }

  selectEntity(entity: CreateEntityResponse): void {
    this.selectedEntity = entity;
    this.uploadStatus = '';
    this.saveStatus = '';
    this.deleteStatus = '';
    this.isEditing = false;
    this.resetImageGenerationState();
    this.loadProfile(entity);
  }

  loadProfile(entity: CreateEntityResponse): void {
    this.profileLoading = true;
    const onDone = () => {
      this.profileLoading = false;
      this.syncEntity(entity);
    };

    if (entity.type === 'BUSINESS') {
      this.entityService.getBusinessProfile(entity.id).subscribe({
        next: profile => {
          entity.businessProfile = profile;
          onDone();
        },
        error: () => onDone()
      });
      return;
    }

    if (entity.type === 'BUSINESS_LEADER') {
      this.entityService.getBusinessLeaderProfile(entity.id).subscribe({
        next: profile => {
          entity.businessLeaderProfile = profile;
          onDone();
        },
        error: () => onDone()
      });
      return;
    }

    if (entity.type === 'POLITICIAN') {
      this.entityService.getPoliticianProfile(entity.id).subscribe({
        next: profile => {
          entity.politicianProfile = profile;
          onDone();
        },
        error: () => onDone()
      });
      return;
    }

    this.entityService.getCelebrityProfile(entity.id).subscribe({
      next: profile => {
        entity.celebrityProfile = profile;
        onDone();
      },
      error: () => onDone()
    });
  }

  syncEntity(entity: CreateEntityResponse): void {
    const index = this.entities.findIndex(e => e.id === entity.id);
    if (index >= 0) {
      this.entities = this.entities.map((item, i) => (i === index ? { ...item, ...entity } : item));
    }
    if (this.selectedEntity?.id === entity.id) {
      this.selectedEntity = { ...this.selectedEntity, ...entity };
    }
  }

  startEdit(): void {
    if (!this.selectedEntity) return;
    this.isEditing = true;
    this.saveStatus = '';
    this.editForm = this.buildEditForm(this.selectedEntity);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.saveStatus = '';
    this.editForm = {};
  }

  saveEdit(): void {
    if (!this.selectedEntity) return;
    this.isSaving = true;
    this.saveStatus = 'Saving changes...';
    const entity = this.selectedEntity;

    const onSuccess = (profile: any) => {
      if (entity.type === 'BUSINESS') entity.businessProfile = profile;
      if (entity.type === 'BUSINESS_LEADER') entity.businessLeaderProfile = profile;
      if (entity.type === 'POLITICIAN') entity.politicianProfile = profile;
      if (entity.type === 'CELEBRITY') entity.celebrityProfile = profile;
      this.syncEntity(entity);
      this.isSaving = false;
      this.isEditing = false;
      this.saveStatus = 'Profile updated successfully.';
    };

    const onError = () => {
      this.isSaving = false;
      this.saveStatus = 'Update failed. Please try again.';
    };

    if (entity.type === 'BUSINESS') {
      const payload: BusinessProfile = {
        fullName: this.editForm.fullName,
        address: this.editForm.address,
        description: this.editForm.description,
        businessType: this.editForm.businessType,
        mobileNumber: this.editForm.mobileNumber,
        countryCode: this.editForm.countryCode,
        email: this.editForm.email,
        contactHours: this.editForm.contactHours
      };
      this.entityService.upsertBusinessProfile(entity.id, payload).subscribe({ next: onSuccess, error: onError });
      return;
    }

    if (entity.type === 'BUSINESS_LEADER') {
      const payload: BusinessLeaderProfile = {
        fullName: this.editForm.fullName,
        company: this.editForm.company,
        projectName: this.editForm.projectName,
        projectDescription: this.editForm.projectDescription,
        mobileNumber: this.editForm.mobileNumber,
        countryCode: this.editForm.countryCode,
        email: this.editForm.email,
        contactHours: this.editForm.contactHours
      };
      this.entityService.upsertBusinessLeaderProfile(entity.id, payload).subscribe({ next: onSuccess, error: onError });
      return;
    }

    if (entity.type === 'POLITICIAN') {
      const payload: PoliticianProfile = {
        fullName: this.editForm.fullName,
        partyName: this.editForm.partyName,
        segmentAddress: this.editForm.segmentAddress,
        contestingTo: this.editForm.contestingTo,
        description: this.editForm.description,
        mobileNumber: this.editForm.mobileNumber,
        countryCode: this.editForm.countryCode,
        email: this.editForm.email,
        contactHours: this.editForm.contactHours
      };
      this.entityService.upsertPoliticianProfile(entity.id, payload).subscribe({ next: onSuccess, error: onError });
      return;
    }

    const payload: CelebrityProfile = {
      realName: this.editForm.realName,
      artistName: this.editForm.artistName,
      artistType: this.editForm.artistType,
      description: this.editForm.description,
      mobileNumber: this.editForm.mobileNumber,
      countryCode: this.editForm.countryCode,
      email: this.editForm.email,
      contactHours: this.editForm.contactHours
    };
    this.entityService.upsertCelebrityProfile(entity.id, payload).subscribe({ next: onSuccess, error: onError });
  }

  deleteEntity(): void {
    if (!this.selectedEntity || this.isDeleting) return;
    const entity = this.selectedEntity;
    if (!confirm(`Delete ${entity.displayName}? This will remove the profile details.`)) return;
    this.isDeleting = true;
    this.deleteStatus = 'Deleting profile...';

    const onSuccess = () => {
      this.isDeleting = false;
      this.deleteStatus = 'Profile deleted.';
      this.isEditing = false;
      this.loadEntities();
    };

    const onError = () => {
      this.isDeleting = false;
      this.deleteStatus = 'Delete failed. Please try again.';
    };

    if (entity.type === 'BUSINESS') {
      this.entityService.deleteBusinessProfile(entity.id).subscribe({ next: onSuccess, error: onError });
      return;
    }

    if (entity.type === 'BUSINESS_LEADER') {
      this.entityService.deleteBusinessLeaderProfile(entity.id).subscribe({ next: onSuccess, error: onError });
      return;
    }

    if (entity.type === 'POLITICIAN') {
      this.entityService.deletePoliticianProfile(entity.id).subscribe({ next: onSuccess, error: onError });
      return;
    }

    this.entityService.deleteCelebrityProfile(entity.id).subscribe({ next: onSuccess, error: onError });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedEntity) return;
    
    this.isUploading = true;
    this.uploadStatus = 'Uploading...';
    
    this.docService.uploadDocumentWithEntity(
      file,
      this.selectedEntity.id.toString(),
      this.selectedEntity.displayName
    ).subscribe({
      next: (res) => {
        this.uploadStatus = res.message || 'Document uploaded successfully!';
        this.isUploading = false;
      },
      error: () => {
        this.uploadStatus = 'Upload failed. Please try again.';
        this.isUploading = false;
      }
    });
  }

  generateBusinessImage(): void {
    if (!this.selectedEntity || this.isGeneratingImage) return;

    const prompt = this.imagePrompt.trim();
    if (!prompt) {
      this.imageGenerationError = 'Please enter a prompt before generating an image.';
      this.imageGenerationStatus = '';
      return;
    }

    const request: GenerateBusinessImageRequest = {
      prompt,
      entityId: this.selectedEntity.id,
      displayName: this.selectedEntity.displayName,
      businessId: this.buildBusinessId(this.selectedEntity.displayName),
      size: this.selectedImageSize,
      renderingMode: 'TEXT_OVERLAYS'
    };

    this.lastGenerationRequest = request;
    this.isGeneratingImage = true;
    this.imageGenerationStatus = `Creating image for ${request.displayName}...`;
    this.imageGenerationError = '';
    this.generatedImage = null;
    this.generatedImageUrl = '';
    this.composedPosterUrl = '';
    this.posterRenderError = '';
    this.overlayManualOffsets = {};
    this.overlayAnchorBounds = [];
    this.overlayTextEdits = {};
    this.overlayFontSizeScale = {};
    this.customAddedOverlays = [];
    this.selectedAnchorKey = null;
    this.showAddOverlayForm = false;
    this.posterCanvasCursor = 'default';
    this.dragState = null;
    this.isPosterDragging = false;
    this.removedOverlayKeys = new Set();

    this.entityService.generateBusinessImage(request).subscribe({
      next: response => {
        this.isGeneratingImage = false;
        this.generatedImage = response;

        if (response.success && response.imageBase64 && response.mimeType) {
          const overlayCount = (response.overlays || [])
            .map(overlay => this.sanitizeOverlayText(overlay.text, overlay.role))
            .filter(text => !!text)
            .length;

          this.generatedImageUrl = `data:${response.mimeType};base64,${response.imageBase64}`;
          this.imageGenerationStatus = overlayCount
            ? 'Poster generated successfully. Overlay text has been applied for a cleaner final result.'
            : 'Image generated successfully. No structured overlay layers were returned, so embedded text cannot be corrected in the browser.';
          this.imageGenerationError = '';
          this.schedulePosterRender();
          return;
        }

        this.imageGenerationStatus = '';
        this.imageGenerationError = response.error || 'Image generation failed. Please try again.';
      },
      error: (error: HttpErrorResponse) => {
        this.isGeneratingImage = false;
        this.imageGenerationStatus = '';
        this.imageGenerationError = this.extractApiError(error);
      }
    });
  }

  retryImageGeneration(): void {
    if (this.isGeneratingImage) return;
    if (this.lastGenerationRequest) {
      this.imagePrompt = this.lastGenerationRequest.prompt;
      this.selectedImageSize = this.lastGenerationRequest.size;
    }
    this.generateBusinessImage();
  }

  downloadGeneratedImage(): void {
    if (!this.composedPosterUrl) {
      this.posterRenderError = 'Poster preview is still preparing. Please try download again in a moment.';
      return;
    }

    const link = document.createElement('a');
    const extension = this.getFileExtensionFromMimeType(this.generatedImage?.mimeType || 'image/png');
    const baseName = (this.selectedEntity?.displayName || 'business-image')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'business-image';

    link.href = this.composedPosterUrl;
    link.download = `${baseName}-poster-${Date.now()}.${extension}`;
    link.click();
  }

  get generatedOverlays(): OverlaySpec[] {
    const fromImage = [...(this.generatedImage?.overlays || [])]
      .map(overlay => {
        const processed = {
          ...overlay,
          zone: this.normalizeZone(overlay.zone),
          text: this.sanitizeOverlayText(overlay.text, overlay.role)
        };
        const key = this.getOverlayKey(processed);
        const edited = this.overlayTextEdits[key];
        return edited !== undefined ? { ...processed, text: edited } : processed;
      })
      .filter(overlay => !!overlay.text && !this.removedOverlayKeys.has(this.getOverlayKey(overlay)))
      .sort((left, right) => left.slot - right.slot);

    const fromCustom = this.customAddedOverlays.map(overlay => {
      const key = this.getOverlayKey(overlay);
      const edited = this.overlayTextEdits[key];
      return edited !== undefined ? { ...overlay, text: edited } : { ...overlay };
    });

    return [...fromImage, ...fromCustom];
  }

  get overlayConstraintNotice(): string {
    if (!this.generatedImageUrl || this.isPosterRendering || this.generatedOverlays.length) {
      return '';
    }

    return 'This response only included a flat image. The browser can redraw clean text only when the backend also returns structured overlay layers.';
  }

  get canGenerateImage(): boolean {
    return !!this.selectedEntity && !!this.imagePrompt.trim() && !this.isGeneratingImage;
  }

  get isCustomOverlayPalette(): boolean {
    return this.selectedOverlayColorStyle === 'custom';
  }

  get isCustomOverlayFontStyle(): boolean {
    return this.selectedOverlayFontStyle === 'custom';
  }

  onOverlayStyleControlChange(): void {
    if (this.isCustomOverlayFontStyle && !this.customOverlayFontFamily.trim()) {
      this.customOverlayFontFamily = `Montserrat, 'Avenir Next', 'Segoe UI', Arial, sans-serif`;
    }

    if (!this.generatedImageUrl || this.isPosterRendering) {
      return;
    }

    this.schedulePosterRender();
  }

  resetOverlayTextPositions(): void {
    this.overlayManualOffsets = {};
    this.selectedAnchorKey = null;
    this.posterCanvasCursor = this.generatedOverlays.length ? 'grab' : 'default';
    this.schedulePosterRender();
  }

  setOverlayText(overlay: OverlaySpec, text: string): void {
    const key = this.getOverlayKey(overlay);
    this.overlayTextEdits = { ...this.overlayTextEdits, [key]: text };
    this.schedulePosterRender();
  }

  getOverlayFontSizeScale(overlay: OverlaySpec): number {
    return this.overlayFontSizeScale[this.getOverlayKey(overlay)] ?? 1.0;
  }

  setOverlayFontSizeScale(overlay: OverlaySpec, value: number): void {
    const key = this.getOverlayKey(overlay);
    this.overlayFontSizeScale = { ...this.overlayFontSizeScale, [key]: Number(value) };
    this.schedulePosterRender();
  }

  addCustomOverlay(): void {
    const text = this.newOverlayDraft.text.trim();
    if (!text) return;
    const newOverlay: OverlaySpec = {
      slot: 1000 + this.customAddedOverlays.length,
      zone: this.newOverlayDraft.zone,
      role: this.newOverlayDraft.role,
      text,
      size: this.newOverlayDraft.size
    };
    this.customAddedOverlays = [...this.customAddedOverlays, newOverlay];
    this.newOverlayDraft = { text: '', zone: 'upper-middle', role: 'custom', size: 'medium' };
    this.showAddOverlayForm = false;
    this.schedulePosterRender();
  }

  removeOverlay(overlay: OverlaySpec): void {
    if (this.isCustomOverlay(overlay)) {
      const idx = this.customAddedOverlays.findIndex(o => o.slot === overlay.slot);
      if (idx !== -1) {
        this.customAddedOverlays = this.customAddedOverlays.filter((_, i) => i !== idx);
      }
    } else {
      const key = this.getOverlayKey(overlay);
      this.removedOverlayKeys = new Set([...this.removedOverlayKeys, key]);
    }
    this.schedulePosterRender();
  }

  isCustomOverlay(overlay: OverlaySpec): boolean {
    return overlay.slot >= 1000;
  }

  onCanvasKeyDown(event: KeyboardEvent): void {
    if (!this.selectedAnchorKey) return;
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!arrowKeys.includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 2;
    const current = this.overlayManualOffsets[this.selectedAnchorKey] || { x: 0, y: 0 };
    const deltas: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step }
    };
    const delta = deltas[event.key] || { x: 0, y: 0 };
    this.overlayManualOffsets = {
      ...this.overlayManualOffsets,
      [this.selectedAnchorKey]: { x: current.x + delta.x, y: current.y + delta.y }
    };
    this.queueInteractivePosterRender();
  }

  onPosterPointerDown(event: MouseEvent | TouchEvent): void {
    if (!this.generatedOverlays.length || !this.overlayAnchorBounds.length) {
      return;
    }

    const point = this.getCanvasPoint(event);
    if (!point) {
      return;
    }

    const hit = this.findAnchorAtPoint(point.x, point.y);
    if (!hit) {
      this.posterCanvasCursor = 'grab';
      return;
    }

    const existingOffset = this.overlayManualOffsets[hit.key] || { x: 0, y: 0 };
    this.dragState = {
      key: hit.key,
      startX: point.x,
      startY: point.y,
      originX: existingOffset.x,
      originY: existingOffset.y,
      hasDragged: false
    };
    this.isPosterDragging = true;
    this.posterCanvasCursor = 'grabbing';
    event.preventDefault();
  }

  onPosterPointerMove(event: MouseEvent | TouchEvent): void {
    const point = this.getCanvasPoint(event);
    if (!point) {
      return;
    }

    if (!this.dragState) {
      this.posterCanvasCursor = this.findAnchorAtPoint(point.x, point.y) ? 'grab' : 'default';
      return;
    }

    const deltaX = point.x - this.dragState.startX;
    const deltaY = point.y - this.dragState.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      this.dragState.hasDragged = true;
    }
    this.overlayManualOffsets = {
      ...this.overlayManualOffsets,
      [this.dragState.key]: {
        x: this.dragState.originX + deltaX,
        y: this.dragState.originY + deltaY
      }
    };

    this.queueInteractivePosterRender();
    event.preventDefault();
  }

  onPosterPointerUp(): void {
    if (this.dragState && !this.dragState.hasDragged) {
      // It was a click, not a drag — toggle selection for arrow-key nudging
      const clicked = this.dragState.key;
      this.selectedAnchorKey = this.selectedAnchorKey === clicked ? null : clicked;
      this.queueInteractivePosterRender();
    }
    this.dragState = null;
    this.isPosterDragging = false;
    this.posterCanvasCursor = this.generatedOverlays.length ? 'grab' : 'default';
  }

  private resetImageGenerationState(): void {
    this.imagePrompt = '';
    this.selectedImageSize = '1024x1024';
    this.imageGenerationStatus = '';
    this.imageGenerationError = '';
    this.generatedImage = null;
    this.generatedImageUrl = '';
    this.composedPosterUrl = '';
    this.posterRenderError = '';
    this.lastGenerationRequest = null;
    this.isGeneratingImage = false;
    this.isPosterRendering = false;
    this.overlayManualOffsets = {};
    this.overlayAnchorBounds = [];
    this.overlayTextEdits = {};
    this.overlayFontSizeScale = {};
    this.customAddedOverlays = [];
    this.removedOverlayKeys = new Set();
    this.selectedAnchorKey = null;
    this.showAddOverlayForm = false;
    this.newOverlayDraft = { text: '', zone: 'upper-middle', role: 'custom', size: 'medium' };
    this.posterCanvasCursor = 'default';
    this.dragState = null;
    this.isPosterDragging = false;
  }

  private extractApiError(error: HttpErrorResponse): string {
    const apiError = error?.error?.error || error?.error?.message;
    return apiError || 'Unable to generate the image right now. Please retry in a moment.';
  }

  private getFileExtensionFromMimeType(mimeType: string): string {
    const normalized = mimeType.toLowerCase();
    if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
    if (normalized.includes('webp')) return 'webp';
    if (normalized.includes('gif')) return 'gif';
    return 'png';
  }

  private schedulePosterRender(): void {
    this.isPosterRendering = true;
    this.posterRenderError = '';
    setTimeout(() => {
      void this.renderPosterCanvas();
    }, 0);
  }

  private async renderPosterCanvas(): Promise<void> {
    if (!this.generatedImageUrl) {
      this.isPosterRendering = false;
      return;
    }

    if (!this.posterCanvas?.nativeElement) {
      setTimeout(() => {
        void this.renderPosterCanvas();
      }, 50);
      return;
    }

    try {
      const backgroundImage = await this.loadImage(this.generatedImageUrl);
      const canvas = this.posterCanvas.nativeElement;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Poster canvas is not available.');
      }

      const { width, height } = this.getPosterDimensions(backgroundImage);
      canvas.width = width;
      canvas.height = height;

      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(backgroundImage, 0, 0, width, height);

      const overlays = this.generatedOverlays;
      const occupiedTextRects: OverlayRect[] = [];
      this.overlayAnchorBounds = [];
      this.posterCanvasCursor = overlays.length ? (this.isPosterDragging ? 'grabbing' : 'grab') : 'default';

      const zoneOffsets = new Map<string, number>();
      for (const overlay of overlays) {
        const offsetIndex = zoneOffsets.get(overlay.zone) || 0;
        const anchorBounds = this.drawOverlay(context, overlay, width, height, offsetIndex, occupiedTextRects);
        this.overlayAnchorBounds.push(anchorBounds);
        zoneOffsets.set(overlay.zone, offsetIndex + 1);
      }

      this.composedPosterUrl = canvas.toDataURL(this.generatedImage?.mimeType || 'image/png');
      this.isPosterRendering = false;
      this.posterRenderError = '';
    } catch {
      this.isPosterRendering = false;
      this.posterRenderError = 'Poster overlay rendering failed. The raw image is available, but combined poster export is not ready.';
    }
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image loading failed'));
      image.src = source;
    });
  }

  private getPosterDimensions(image: HTMLImageElement): { width: number; height: number } {
    const [width, height] = this.selectedImageSize.split('x').map(value => Number.parseInt(value, 10));

    if (Number.isFinite(width) && Number.isFinite(height)) {
      return { width, height };
    }

    return {
      width: image.naturalWidth || 1024,
      height: image.naturalHeight || 1024
    };
  }

  private drawOverlay(
    context: CanvasRenderingContext2D,
    overlay: OverlaySpec,
    width: number,
    height: number,
    stackIndex: number,
    occupiedRects: OverlayRect[]
  ): OverlayAnchorBounds {
    const normalizedZone = this.normalizeZone(overlay.zone);
    const zoneSample = this.getZoneSampleRect(normalizedZone, width, height);
    const palette = this.samplePalette(context, zoneSample.left, zoneSample.top, zoneSample.width, zoneSample.height);
    const baseStyle = this.getOverlayTextStyle(overlay, palette);
    const fontSize = this.getOverlayFontSize(overlay, width);
    const maxTextWidth = this.getOverlayMaxWidth(overlay.zone, width);
    const lineHeight = Math.round(fontSize * 1.2);

    context.save();
    context.font = `${baseStyle.fontWeight} ${fontSize}px ${baseStyle.fontFamily}`;
    context.textBaseline = 'top';
    context.lineJoin = 'round';

    const style = this.getAdaptiveOverlayTextStyle(baseStyle, palette, overlay.role);

    context.lineWidth = style.strokeWidth;
    context.strokeStyle = style.strokeStyle;
    context.shadowColor = style.shadowColor;
    context.shadowBlur = style.shadowBlur;

    const text = style.uppercase ? overlay.text.toUpperCase() : overlay.text;
    const lines = this.wrapCanvasText(context, text, maxTextWidth, style.maxLines);
    const measuredWidth = Math.max(...lines.map(line => this.measureCanvasTextLine(context, line, style.letterSpacing)), 80);
    const textHeight = lines.length * lineHeight;
    const layout = this.getOverlayLayout(overlay.zone, width, height, measuredWidth, textHeight, stackIndex);
    const resolvedLayout = this.resolveOverlayLayoutCollision(
      layout,
      measuredWidth,
      textHeight,
      width,
      height,
      occupiedRects,
      normalizedZone
    );

    const overlayKey = this.getOverlayKey(overlay);
    const manualOffset = this.overlayManualOffsets[overlayKey] || { x: 0, y: 0 };
    const adjustedLayout = {
      ...resolvedLayout,
      left: this.clamp(resolvedLayout.left + manualOffset.x, 10, width - measuredWidth - 10),
      top: this.clamp(resolvedLayout.top + manualOffset.y, 10, height - textHeight - 10)
    };

    context.textAlign = adjustedLayout.textAlign;

    const textX = adjustedLayout.textAlign === 'center'
      ? adjustedLayout.left + measuredWidth / 2
      : adjustedLayout.textAlign === 'right'
        ? adjustedLayout.left + measuredWidth
        : adjustedLayout.left;

    lines.forEach((line, index) => {
      const lineTop = adjustedLayout.top + index * lineHeight;
      context.fillStyle = this.createTextFillGradient(context, lineTop, lineHeight, style);
      this.drawCanvasTextLine(context, line, textX, lineTop, adjustedLayout.textAlign, style.letterSpacing);
    });

    const overlayRect = this.createOverlayRect(adjustedLayout.left, adjustedLayout.top, measuredWidth, textHeight);
    occupiedRects.push(overlayRect);

    // Draw selection indicator for arrow-key nudging
    if (this.selectedAnchorKey === overlayKey) {
      context.save();
      context.shadowBlur = 0;
      context.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      context.lineWidth = 1.5;
      context.setLineDash([5, 4]);
      context.strokeRect(
        adjustedLayout.left - 6,
        adjustedLayout.top - 6,
        measuredWidth + 12,
        textHeight + 12
      );
      context.restore();
    }

    context.restore();

    return {
      ...overlayRect,
      key: overlayKey,
      role: overlay.role,
      text: overlay.text
    };
  }

  private getOverlayFontSize(overlay: OverlaySpec, width: number): number {
    const scale = Math.max(0.85, width / 1024);
    const role = (overlay.role || '').toLowerCase();
    const zone = this.normalizeZone(overlay.zone);

    let baseSize: number;
    switch ((overlay.size || '').toLowerCase()) {
      case 'large':
        baseSize = 30;
        break;
      case 'medium':
        baseSize = 23;
        break;
      default:
        baseSize = 18;
        break;
    }

    if (role.includes('title') || role.includes('headline') || role.includes('name') || zone === 'upper-middle') {
      baseSize += 16;
    } else if (role.includes('price') || role.includes('offer') || role.includes('cta') || zone === 'bottom-right') {
      baseSize += 14;
    } else if (zone === 'top-banner' || zone === 'top-center') {
      baseSize += 2;
    }

    const sizeScale = this.overlayFontSizeScale[this.getOverlayKey(overlay)] ?? 1.0;
    return Math.round(baseSize * scale * sizeScale);
  }

  private getOverlayMaxWidth(zone: string, width: number): number {
    switch (this.normalizeZone(zone)) {
      case 'bottom-right':
        return Math.round(width * 0.34);
      case 'upper-middle':
        return Math.round(width * 0.6);
      default:
        return Math.round(width * 0.72);
    }
  }

  private getOverlayLayout(
    zone: string,
    width: number,
    height: number,
    textWidth: number,
    textHeight: number,
    stackIndex: number
  ): { left: number; top: number; textAlign: CanvasTextAlign } {
    const zoneName = this.normalizeZone(zone);
    const gap = 14;

    switch (zoneName) {
      case 'top-center':
      case 'top-banner':
        return {
          left: (width - textWidth) / 2,
          top: height * 0.062 + stackIndex * (textHeight + gap),
          textAlign: 'center'
        };
      case 'upper-middle':
        return {
          left: (width - textWidth) / 2,
          top: height * 0.182 + stackIndex * (textHeight + gap),
          textAlign: 'center'
        };
      case 'bottom-bar':
        return {
          left: (width - textWidth) / 2,
          top: height * 0.858 - stackIndex * (textHeight + gap),
          textAlign: 'center'
        };
      case 'bottom-right':
      default:
        return {
          left: width - textWidth - width * 0.072,
          top: height * 0.81 - stackIndex * (textHeight + gap),
          textAlign: 'right'
        };
    }
  }

  private wrapCanvasText(
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines = Number.MAX_SAFE_INTEGER
  ): string[] {
    const words = (text || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [''];

    const lines: string[] = [];
    let currentLine = words[0];

    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${currentLine} ${words[index]}`;
      if (context.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
        continue;
      }
      lines.push(currentLine);
      currentLine = words[index];
    }

    lines.push(currentLine);

    if (lines.length <= maxLines) {
      return lines;
    }

    const limitedLines = lines.slice(0, maxLines);
    let lastLine = limitedLines[maxLines - 1];
    while (context.measureText(`${lastLine}...`).width > maxWidth && lastLine.length > 1) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }
    limitedLines[maxLines - 1] = `${lastLine}...`;
    return limitedLines;
  }

  private sanitizeOverlayText(text: string, role: string): string {
    const normalized = (text || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim();

    if (!normalized) {
      return '';
    }

    const lowerRole = (role || '').toLowerCase();
    if (lowerRole.includes('price')) {
      return normalized.replace(/\$\s+/g, '$');
    }

    return normalized;
  }

  private normalizeZone(zone: string | null | undefined): string {
    return (zone || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-');
  }

  private getZoneSampleRect(
    zone: string,
    width: number,
    height: number
  ): { left: number; top: number; width: number; height: number } {
    switch (zone) {
      case 'top-center':
      case 'top-banner':
        return {
          left: width * 0.12,
          top: height * 0.035,
          width: width * 0.76,
          height: height * 0.12
        };
      case 'upper-middle':
        return {
          left: width * 0.16,
          top: height * 0.155,
          width: width * 0.68,
          height: height * 0.18
        };
      case 'bottom-bar':
        return {
          left: width * 0.17,
          top: height * 0.76,
          width: width * 0.66,
          height: height * 0.16
        };
      case 'bottom-right':
      default:
        return {
          left: width * 0.64,
          top: height * 0.72,
          width: width * 0.3,
          height: height * 0.2
        };
    }
  }

  private samplePalette(
    context: CanvasRenderingContext2D,
    left: number,
    top: number,
    width: number,
    height: number
  ): SampledPalette {
    const clampedLeft = Math.max(0, Math.floor(left));
    const clampedTop = Math.max(0, Math.floor(top));
    const clampedWidth = Math.max(1, Math.floor(width));
    const clampedHeight = Math.max(1, Math.floor(height));

    const { data } = context.getImageData(clampedLeft, clampedTop, clampedWidth, clampedHeight);

    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let saturationTotal = 0;
    let sampleCount = 0;

    const stride = 16;
    for (let index = 0; index < data.length; index += stride) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      redTotal += red;
      greenTotal += green;
      blueTotal += blue;

      const maxChannel = Math.max(red, green, blue);
      const minChannel = Math.min(red, green, blue);
      saturationTotal += maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;
      sampleCount += 1;
    }

    const count = Math.max(sampleCount, 1);
    const r = Math.round(redTotal / count);
    const g = Math.round(greenTotal / count);
    const b = Math.round(blueTotal / count);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const saturation = saturationTotal / count;
    const hue = this.rgbToHsl(r, g, b).h;

    return { r, g, b, luminance, saturation, hue };
  }

  private getAdaptiveOverlayTextStyle(
    base: PosterTextStyle,
    palette: SampledPalette,
    role: string
  ): PosterTextStyle {
    const lowerRole = (role || '').toLowerCase();
    if (this.selectedOverlayColorStyle === 'custom') {
      const customFill = this.hexToRgb(this.customOverlayPrimaryColor) || { r: 255, g: 238, b: 185 };
      const customHighlight = this.hexToRgb(this.customOverlayHighlightColor) || { r: 255, g: 248, b: 223 };
      const customStroke = this.hexToRgb(this.customOverlayStrokeColor) || { r: 42, g: 20, b: 34 };

      return {
        ...base,
        fillStyle: this.rgba(customFill.r, customFill.g, customFill.b, 0.98),
        fillStyleSecondary: this.rgba(customHighlight.r, customHighlight.g, customHighlight.b, 0.99),
        strokeStyle: this.rgba(customStroke.r, customStroke.g, customStroke.b, 0.86),
        shadowColor: this.rgba(customStroke.r, customStroke.g, customStroke.b, 0.34),
        shadowBlur: Math.max(6, base.shadowBlur)
      };
    }

    const roleHueShift = lowerRole.includes('brand')
      ? 28
      : lowerRole.includes('offer') || lowerRole.includes('price')
        ? 196
        : 154;
    const hueShiftMap: Record<string, number> = {
      auto: roleHueShift,
      warm: 26,
      cool: 210,
      mono: 0
    };
    const mode = this.selectedOverlayColorStyle || 'auto';
    const mappedHueShift = hueShiftMap[mode] ?? roleHueShift;
    const roleHue = (palette.hue + mappedHueShift) % 360;
    const warmHue = (palette.hue + (mode === 'cool' ? 188 : 18)) % 360;
    const saturationMultiplier = mode === 'mono' ? 0.28 : 0.55;
    const saturated = this.clamp(0.32 + palette.saturation * saturationMultiplier, 0.12, mode === 'mono' ? 0.46 : 0.92);

    if (palette.luminance < 0.54) {
      const fill = this.hslToRgb(warmHue, this.clamp(saturated, 0.38, 0.9), 0.74);
      const fillHighlight = this.hslToRgb(warmHue, this.clamp(saturated + 0.08, 0.45, 0.95), 0.88);
      const stroke = this.hslToRgb(roleHue, this.clamp(saturated * 0.75, 0.28, 0.76), 0.22);
      const shadow = this.hslToRgb(roleHue, this.clamp(saturated * 0.45, 0.12, 0.48), 0.08);

      return {
        ...base,
        fillStyle: this.rgba(fill.r, fill.g, fill.b, 0.98),
        fillStyleSecondary: this.rgba(fillHighlight.r, fillHighlight.g, fillHighlight.b, 0.99),
        strokeStyle: this.rgba(stroke.r, stroke.g, stroke.b, 0.82),
        shadowColor: this.rgba(shadow.r, shadow.g, shadow.b, 0.42),
        shadowBlur: Math.max(6, base.shadowBlur + (palette.saturation > 0.45 ? 3 : 1))
      };
    }

    const fill = this.hslToRgb(roleHue, this.clamp(saturated * 0.88, 0.25, 0.72), 0.2);
    const fillHighlight = this.hslToRgb(roleHue, this.clamp(saturated * 0.74, 0.22, 0.62), 0.3);
    const stroke = this.hslToRgb((roleHue + 185) % 360, this.clamp(saturated * 0.4, 0.08, 0.35), 0.94);
    const shadow = this.hslToRgb(roleHue, this.clamp(saturated * 0.24, 0.05, 0.2), 0.11);

    return {
      ...base,
      fillStyle: this.rgba(fill.r, fill.g, fill.b, 0.96),
      fillStyleSecondary: this.rgba(fillHighlight.r, fillHighlight.g, fillHighlight.b, 0.98),
      strokeStyle: this.rgba(stroke.r, stroke.g, stroke.b, 0.76),
      shadowColor: this.rgba(shadow.r, shadow.g, shadow.b, 0.26),
      shadowBlur: Math.max(5, base.shadowBlur)
    };
  }

  private createTextFillGradient(
    context: CanvasRenderingContext2D,
    top: number,
    lineHeight: number,
    style: PosterTextStyle
  ): CanvasGradient {
    const gradient = context.createLinearGradient(0, top, 0, top + lineHeight);
    gradient.addColorStop(0, style.fillStyleSecondary || style.fillStyle);
    gradient.addColorStop(0.46, style.fillStyle);
    gradient.addColorStop(1, style.fillStyle);
    return gradient;
  }

  private mixRgb(
    first: { r: number; g: number; b: number },
    second: { r: number; g: number; b: number },
    blend: number
  ): { r: number; g: number; b: number } {
    const factor = Math.min(Math.max(blend, 0), 1);
    const inverse = 1 - factor;

    return {
      r: Math.round(first.r * inverse + second.r * factor),
      g: Math.round(first.g * inverse + second.g * factor),
      b: Math.round(first.b * inverse + second.b * factor)
    };
  }

  private rgba(red: number, green: number, blue: number, alpha: number): string {
    const clampedAlpha = Math.min(Math.max(alpha, 0), 1);
    return `rgba(${red}, ${green}, ${blue}, ${clampedAlpha})`;
  }

  private getOverlayTextStyle(overlay: OverlaySpec, palette: SampledPalette): PosterTextStyle {
    const role = (overlay.role || '').toLowerCase();
    const zone = this.normalizeZone(overlay.zone);
    const fontFamily = this.pickFontFamily(role, zone, palette);

    if (role.includes('title') || role.includes('headline') || role.includes('name') || zone === 'upper-middle') {
      return {
        fontFamily,
        fontWeight: 700,
        fillStyle: '#ffe8a4',
        fillStyleSecondary: '#fff8d8',
        strokeStyle: 'rgba(64, 23, 40, 0.8)',
        strokeWidth: 2.3,
        shadowColor: 'rgba(255, 189, 96, 0.28)',
        shadowBlur: 10,
        letterSpacing: 0.9,
        uppercase: true,
        maxLines: 2
      };
    }

    if (role.includes('price') || role.includes('offer') || role.includes('cta') || zone === 'bottom-right') {
      return {
        fontFamily,
        fontWeight: 800,
        fillStyle: '#ffeeb9',
        fillStyleSecondary: '#fff8df',
        strokeStyle: 'rgba(74, 24, 24, 0.85)',
        strokeWidth: 2.5,
        shadowColor: 'rgba(14, 8, 20, 0.42)',
        shadowBlur: 12,
        letterSpacing: 0.3,
        uppercase: false,
        maxLines: 2
      };
    }

    if (zone === 'top-banner' || zone === 'top-center') {
      return {
        fontFamily,
        fontWeight: 800,
        fillStyle: '#fef3c7',
        fillStyleSecondary: '#fffbe8',
        strokeStyle: 'rgba(42, 20, 34, 0.78)',
        strokeWidth: 1.9,
        shadowColor: 'rgba(14, 10, 21, 0.3)',
        shadowBlur: 8,
        letterSpacing: 0.55,
        uppercase: true,
        maxLines: 2
      };
    }

    return {
      fontFamily,
      fontWeight: 700,
      fillStyle: '#fff8ef',
      fillStyleSecondary: '#ffffff',
      strokeStyle: 'rgba(30, 41, 59, 0.92)',
      strokeWidth: 2,
      shadowColor: 'rgba(15, 23, 42, 0.22)',
      shadowBlur: 6,
      letterSpacing: 0.4,
      uppercase: false,
      maxLines: 3
    };
  }

  private pickFontFamily(role: string, zone: string, palette: SampledPalette): string {
    if (this.selectedOverlayFontStyle === 'custom') {
      return this.customOverlayFontFamily.trim() || `'Avenir Next', 'Segoe UI', Arial, sans-serif`;
    }

    if (this.selectedOverlayFontStyle === 'classic') {
      return `Georgia, 'Palatino Linotype', 'Times New Roman', serif`;
    }

    if (this.selectedOverlayFontStyle === 'modern') {
      return `'Avenir Next', 'Segoe UI', 'Trebuchet MS', Arial, sans-serif`;
    }

    if (this.selectedOverlayFontStyle === 'poster') {
      if (role.includes('offer') || role.includes('price') || role.includes('cta')) {
        return `'Arial Black', 'Franklin Gothic Heavy', 'Trebuchet MS', sans-serif`;
      }
      return `'Impact', 'Arial Black', 'Trebuchet MS', sans-serif`;
    }

    if (this.selectedOverlayFontStyle === 'elegant') {
      return `'Baskerville', 'Palatino Linotype', Georgia, serif`;
    }

    if (this.selectedOverlayFontStyle === 'condensed') {
      return `'Arial Narrow', 'Franklin Gothic Medium', 'Trebuchet MS', sans-serif`;
    }

    if (role.includes('offer') || role.includes('price') || role.includes('cta')) {
      return `'Arial Black', 'Franklin Gothic Heavy', 'Trebuchet MS', 'Segoe UI', sans-serif`;
    }

    if (role.includes('brand') || zone === 'top-banner' || zone === 'top-center') {
      if (palette.saturation > 0.52) {
        return `'Avenir Next', 'Segoe UI', 'Trebuchet MS', Arial, sans-serif`;
      }
      return `'Gill Sans', 'Trebuchet MS', 'Segoe UI', Arial, sans-serif`;
    }

    if (palette.luminance < 0.48) {
      return `Georgia, 'Palatino Linotype', 'Times New Roman', serif`;
    }

    if (palette.hue > 20 && palette.hue < 80) {
      return `Cambria, Georgia, 'Times New Roman', serif`;
    }

    return `'Trebuchet MS', 'Segoe UI', Arial, sans-serif`;
  }

  private rgbToHsl(red: number, green: number, blue: number): { h: number; s: number; l: number } {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = (max + min) / 2;

    if (delta === 0) {
      return { h: 0, s: 0, l: lightness };
    }

    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    let hue = 0;

    if (max === r) {
      hue = (g - b) / delta + (g < b ? 6 : 0);
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }

    return { h: Math.round(hue * 60), s: saturation, l: lightness };
  }

  private hslToRgb(hue: number, saturation: number, lightness: number): { r: number; g: number; b: number } {
    const h = ((hue % 360) + 360) % 360;
    const s = this.clamp(saturation, 0, 1);
    const l = this.clamp(lightness, 0, 1);

    if (s === 0) {
      const grayscale = Math.round(l * 255);
      return { r: grayscale, g: grayscale, b: grayscale };
    }

    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const hPrime = h / 60;
    const x = chroma * (1 - Math.abs((hPrime % 2) - 1));

    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (hPrime >= 0 && hPrime < 1) {
      r1 = chroma;
      g1 = x;
    } else if (hPrime >= 1 && hPrime < 2) {
      r1 = x;
      g1 = chroma;
    } else if (hPrime >= 2 && hPrime < 3) {
      g1 = chroma;
      b1 = x;
    } else if (hPrime >= 3 && hPrime < 4) {
      g1 = x;
      b1 = chroma;
    } else if (hPrime >= 4 && hPrime < 5) {
      r1 = x;
      b1 = chroma;
    } else {
      r1 = chroma;
      b1 = x;
    }

    const match = l - chroma / 2;
    return {
      r: Math.round((r1 + match) * 255),
      g: Math.round((g1 + match) * 255),
      b: Math.round((b1 + match) * 255)
    };
  }

  private clamp(value: number, minValue: number, maxValue: number): number {
    return Math.min(maxValue, Math.max(minValue, value));
  }

  private resolveOverlayLayoutCollision(
    layout: { left: number; top: number; textAlign: CanvasTextAlign },
    textWidth: number,
    textHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    occupiedRects: OverlayRect[],
    zone: string
  ): { left: number; top: number; textAlign: CanvasTextAlign } {
    const moveUpward = zone === 'bottom-bar' || zone === 'bottom-right';
    const direction = moveUpward ? -1 : 1;
    const step = 12;

    let top = this.clamp(layout.top, 10, canvasHeight - textHeight - 10);
    const left = this.clamp(layout.left, 10, canvasWidth - textWidth - 10);

    for (let attempt = 0; attempt < 16; attempt += 1) {
      const candidate = this.createOverlayRect(left, top, textWidth, textHeight);
      if (!occupiedRects.some(rect => this.rectsOverlap(rect, candidate))) {
        return {
          left,
          top,
          textAlign: layout.textAlign
        };
      }

      top = this.clamp(top + direction * step, 10, canvasHeight - textHeight - 10);
    }

    return {
      left,
      top,
      textAlign: layout.textAlign
    };
  }

  private createOverlayRect(left: number, top: number, width: number, height: number): OverlayRect {
    return {
      left: left - 8,
      top: top - 6,
      right: left + width + 8,
      bottom: top + height + 6
    };
  }

  private getOverlayKey(overlay: OverlaySpec): string {
    return `${overlay.slot}-${this.normalizeZone(overlay.zone)}-${(overlay.role || '').toLowerCase()}`;
  }

  private findAnchorAtPoint(x: number, y: number): OverlayAnchorBounds | null {
    for (let index = this.overlayAnchorBounds.length - 1; index >= 0; index -= 1) {
      const anchor = this.overlayAnchorBounds[index];
      if (x >= anchor.left && x <= anchor.right && y >= anchor.top && y <= anchor.bottom) {
        return anchor;
      }
    }

    return null;
  }

  private getCanvasPoint(event: MouseEvent | TouchEvent): { x: number; y: number } | null {
    const canvas = this.posterCanvas?.nativeElement;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const pointer = 'touches' in event
      ? (event.touches[0] || event.changedTouches[0])
      : event;

    if (!pointer || rect.width === 0 || rect.height === 0) {
      return null;
    }

    const x = ((pointer.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((pointer.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  }

  private queueInteractivePosterRender(): void {
    if (this.interactiveRenderQueued) {
      return;
    }

    this.interactiveRenderQueued = true;
    requestAnimationFrame(() => {
      this.interactiveRenderQueued = false;
      void this.renderPosterCanvas();
    });
  }

  private rectsOverlap(first: OverlayRect, second: OverlayRect): boolean {
    return first.left < second.right
      && first.right > second.left
      && first.top < second.bottom
      && first.bottom > second.top;
  }

  private hexToRgb(color: string): { r: number; g: number; b: number } | null {
    const normalized = (color || '').trim();
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    if (!match) {
      return null;
    }

    return {
      r: Number.parseInt(match[1], 16),
      g: Number.parseInt(match[2], 16),
      b: Number.parseInt(match[3], 16)
    };
  }

  private measureCanvasTextLine(
    context: CanvasRenderingContext2D,
    text: string,
    letterSpacing: number
  ): number {
    const measured = context.measureText(text).width;
    if (letterSpacing <= 0 || text.length < 2) {
      return measured;
    }

    // Keep layout a bit roomier without breaking native kerning.
    return measured + Math.max(0, text.length - 1) * letterSpacing * 0.2;
  }

  private drawCanvasTextLine(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    align: CanvasTextAlign,
    letterSpacing: number
  ): void {
    void align;
    void letterSpacing;
    context.strokeText(text, x, y);
    context.fillText(text, x, y);
  }

  private buildBusinessId(displayName: string): string {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  get filteredEntities(): CreateEntityResponse[] {
    if (!this.searchTerm.trim()) return this.entities;
    return this.entities.filter(e => e.displayName.toLowerCase().includes(this.searchTerm.toLowerCase()));
  }

  getTypeMeta(type: EntityType): { label: string; icon: string; color: string; accent: string } {
    switch (type) {
      case 'BUSINESS_LEADER':
        return { label: 'Business Leader', icon: 'work', color: '#a78bfa', accent: '#c4b5fd' };
      case 'POLITICIAN':
        return { label: 'Politician', icon: 'gavel', color: '#3b82f6', accent: '#93c5fd' };
      case 'CELEBRITY':
        return { label: 'Celebrity', icon: 'star', color: '#f59e0b', accent: '#fcd34d' };
      default:
        return { label: 'Business', icon: 'storefront', color: '#6ee7b7', accent: '#a7f3d0' };
    }
  }

  getDetailRows(entity: CreateEntityResponse | null): DetailRow[] {
    if (!entity) return [];
    const rows: DetailRow[] = [
      { label: 'Display Name', value: entity.displayName },
      { label: 'Entity Type', value: this.getTypeMeta(entity.type).label },
      { label: 'Created At', value: entity.createdAt ? new Date(entity.createdAt).toLocaleString() : '-' },
      { label: 'Updated At', value: entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : '-' }
    ];

    const profile: any = entity.businessProfile || entity.businessLeaderProfile || entity.politicianProfile || entity.celebrityProfile;
    if (!profile) return rows;

    const mapEntries = (label: string, value: any) => ({ label, value: value || '-' });

    if (entity.type === 'BUSINESS') {
      rows.push(
        mapEntries('Full Name', profile.fullName),
        mapEntries('Address', profile.address),
        mapEntries('Business Type', profile.businessType),
        mapEntries('Description', profile.description),
        mapEntries('Phone', `${profile.countryCode || ''} ${profile.mobileNumber || ''}`.trim()),
        mapEntries('Email', profile.email),
        mapEntries('Contact Hours', profile.contactHours)
      );
    }

    if (entity.type === 'BUSINESS_LEADER') {
      rows.push(
        mapEntries('Full Name', profile.fullName),
        mapEntries('Company', profile.company),
        mapEntries('Project Name', profile.projectName),
        mapEntries('Project Description', profile.projectDescription),
        mapEntries('Phone', `${profile.countryCode || ''} ${profile.mobileNumber || ''}`.trim()),
        mapEntries('Email', profile.email),
        mapEntries('Contact Hours', profile.contactHours)
      );
    }

    if (entity.type === 'POLITICIAN') {
      rows.push(
        mapEntries('Full Name', profile.fullName),
        mapEntries('Party Name', profile.partyName),
        mapEntries('Segment Address', profile.segmentAddress),
        mapEntries('Contesting To', profile.contestingTo),
        mapEntries('Description', profile.description),
        mapEntries('Phone', `${profile.countryCode || ''} ${profile.mobileNumber || ''}`.trim()),
        mapEntries('Email', profile.email),
        mapEntries('Contact Hours', profile.contactHours)
      );
    }

    if (entity.type === 'CELEBRITY') {
      rows.push(
        mapEntries('Real Name', profile.realName),
        mapEntries('Artist Name', profile.artistName),
        mapEntries('Artist Type', profile.artistType),
        mapEntries('Description', profile.description),
        mapEntries('Phone', `${profile.countryCode || ''} ${profile.mobileNumber || ''}`.trim()),
        mapEntries('Email', profile.email),
        mapEntries('Contact Hours', profile.contactHours)
      );
    }

    return rows;
  }

  buildEditForm(entity: CreateEntityResponse): any {
    const profile: any = entity.businessProfile || entity.businessLeaderProfile || entity.politicianProfile || entity.celebrityProfile || {};

    if (entity.type === 'BUSINESS') {
      return {
        fullName: profile.fullName || entity.displayName || '',
        address: profile.address || '',
        description: profile.description || '',
        businessType: profile.businessType || '',
        mobileNumber: profile.mobileNumber || '',
        countryCode: profile.countryCode || '',
        email: profile.email || '',
        contactHours: profile.contactHours || ''
      };
    }

    if (entity.type === 'BUSINESS_LEADER') {
      return {
        fullName: profile.fullName || entity.displayName || '',
        company: profile.company || '',
        projectName: profile.projectName || '',
        projectDescription: profile.projectDescription || '',
        mobileNumber: profile.mobileNumber || '',
        countryCode: profile.countryCode || '',
        email: profile.email || '',
        contactHours: profile.contactHours || ''
      };
    }

    if (entity.type === 'POLITICIAN') {
      return {
        fullName: profile.fullName || entity.displayName || '',
        partyName: profile.partyName || '',
        segmentAddress: profile.segmentAddress || '',
        contestingTo: profile.contestingTo || '',
        description: profile.description || '',
        mobileNumber: profile.mobileNumber || '',
        countryCode: profile.countryCode || '',
        email: profile.email || '',
        contactHours: profile.contactHours || ''
      };
    }

    return {
      realName: profile.realName || '',
      artistName: profile.artistName || entity.displayName || '',
      artistType: profile.artistType || '',
      description: profile.description || '',
      mobileNumber: profile.mobileNumber || '',
      countryCode: profile.countryCode || '',
      email: profile.email || '',
      contactHours: profile.contactHours || ''
    };
  }
}
