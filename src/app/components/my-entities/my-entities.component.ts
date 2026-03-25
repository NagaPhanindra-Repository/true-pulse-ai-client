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
    return [...(this.generatedImage?.overlays || [])]
      .map(overlay => ({
        ...overlay,
        zone: this.normalizeZone(overlay.zone),
        text: this.sanitizeOverlayText(overlay.text, overlay.role)
      }))
      .filter(overlay => !!overlay.text)
      .sort((left, right) => left.slot - right.slot);
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

      const zoneOffsets = new Map<string, number>();
      for (const overlay of overlays) {
        const offsetIndex = zoneOffsets.get(overlay.zone) || 0;
        this.drawOverlay(context, overlay, width, height, offsetIndex);
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
    stackIndex: number
  ): void {
    const baseStyle = this.getOverlayTextStyle(overlay);
    const fontSize = this.getOverlayFontSize(overlay, width);
    const maxTextWidth = this.getOverlayMaxWidth(overlay.zone, width);
    const lineHeight = Math.round(fontSize * 1.2);

    context.save();
    context.font = `${baseStyle.fontWeight} ${fontSize}px ${baseStyle.fontFamily}`;
    context.textBaseline = 'top';
    context.lineJoin = 'round';

    const normalizedZone = this.normalizeZone(overlay.zone);
    const zoneSample = this.getZoneSampleRect(normalizedZone, width, height);
    const palette = this.samplePalette(context, zoneSample.left, zoneSample.top, zoneSample.width, zoneSample.height);
    const style = this.getAdaptiveOverlayTextStyle(baseStyle, palette, overlay.role);

    context.lineWidth = style.strokeWidth;
    context.strokeStyle = style.strokeStyle;
    context.fillStyle = style.fillStyle;
    context.shadowColor = style.shadowColor;
    context.shadowBlur = style.shadowBlur;

    const text = style.uppercase ? overlay.text.toUpperCase() : overlay.text;
    const lines = this.wrapCanvasText(context, text, maxTextWidth, style.maxLines);
    const measuredWidth = Math.max(...lines.map(line => this.measureCanvasTextLine(context, line, style.letterSpacing)), 80);
    const layout = this.getOverlayLayout(overlay.zone, width, height, measuredWidth, lines.length * lineHeight, stackIndex);

    context.textAlign = layout.textAlign;

    const textX = layout.textAlign === 'center'
      ? layout.left + measuredWidth / 2
      : layout.textAlign === 'right'
        ? layout.left + measuredWidth
        : layout.left;

    lines.forEach((line, index) => {
      this.drawCanvasTextLine(context, line, textX, layout.top + index * lineHeight, layout.textAlign, style.letterSpacing);
    });

    context.restore();
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
      baseSize += 10;
    } else if (zone === 'top-banner' || zone === 'top-center') {
      baseSize += 4;
    }

    return Math.round(baseSize * scale);
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
          top: height * 0.072 + stackIndex * (textHeight + gap),
          textAlign: 'center'
        };
      case 'upper-middle':
        return {
          left: (width - textWidth) / 2,
          top: height * 0.2 + stackIndex * (textHeight + gap),
          textAlign: 'center'
        };
      case 'bottom-bar':
        return {
          left: (width - textWidth) / 2,
          top: height * 0.805 - stackIndex * (textHeight + gap),
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

    return { r, g, b, luminance, saturation };
  }

  private getAdaptiveOverlayTextStyle(
    base: PosterTextStyle,
    palette: SampledPalette,
    role: string
  ): PosterTextStyle {
    const lowerRole = (role || '').toLowerCase();
    const warmTarget = lowerRole.includes('offer') || lowerRole.includes('price')
      ? { r: 255, g: 224, b: 142 }
      : { r: 255, g: 239, b: 189 };
    const deepTarget = lowerRole.includes('offer') || lowerRole.includes('price')
      ? { r: 76, g: 26, b: 28 }
      : { r: 55, g: 24, b: 44 };

    if (palette.luminance < 0.54) {
      const fill = this.mixRgb(palette, warmTarget, 0.82);
      const stroke = this.mixRgb(palette, deepTarget, 0.78);
      const shadow = this.mixRgb(palette, { r: 0, g: 0, b: 0 }, 0.66);

      return {
        ...base,
        fillStyle: this.rgba(fill.r, fill.g, fill.b, 0.98),
        strokeStyle: this.rgba(stroke.r, stroke.g, stroke.b, 0.75),
        shadowColor: this.rgba(shadow.r, shadow.g, shadow.b, 0.24),
        shadowBlur: Math.max(4, base.shadowBlur + (palette.saturation > 0.45 ? 2 : 0))
      };
    }

    const fill = this.mixRgb(palette, deepTarget, 0.74);
    const stroke = this.mixRgb(palette, { r: 255, g: 246, b: 220 }, 0.66);
    const shadow = this.mixRgb(palette, { r: 18, g: 22, b: 31 }, 0.45);

    return {
      ...base,
      fillStyle: this.rgba(fill.r, fill.g, fill.b, 0.96),
      strokeStyle: this.rgba(stroke.r, stroke.g, stroke.b, 0.55),
      shadowColor: this.rgba(shadow.r, shadow.g, shadow.b, 0.18),
      shadowBlur: Math.max(3, base.shadowBlur - 1)
    };
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

  private getOverlayTextStyle(overlay: OverlaySpec): PosterTextStyle {
    const role = (overlay.role || '').toLowerCase();
    const zone = this.normalizeZone(overlay.zone);

    if (role.includes('title') || role.includes('headline') || role.includes('name') || zone === 'upper-middle') {
      return {
        fontFamily: `'Trebuchet MS', 'Segoe UI', Arial, sans-serif`,
        fontWeight: 800,
        fillStyle: '#ffe9a8',
        strokeStyle: 'rgba(74, 24, 48, 0.72)',
        strokeWidth: 2,
        shadowColor: 'rgba(255, 200, 114, 0.22)',
        shadowBlur: 8,
        letterSpacing: 1.1,
        uppercase: true,
        maxLines: 2
      };
    }

    if (role.includes('price') || role.includes('offer') || role.includes('cta') || zone === 'bottom-right') {
      return {
        fontFamily: `'Trebuchet MS', 'Segoe UI', Arial, sans-serif`,
        fontWeight: 800,
        fillStyle: '#fff2c7',
        strokeStyle: 'rgba(94, 29, 33, 0.68)',
        strokeWidth: 2,
        shadowColor: 'rgba(248, 113, 113, 0.18)',
        shadowBlur: 6,
        letterSpacing: 0.5,
        uppercase: false,
        maxLines: 3
      };
    }

    if (zone === 'top-banner' || zone === 'top-center') {
      return {
        fontFamily: `'Segoe UI', 'Trebuchet MS', Arial, sans-serif`,
        fontWeight: 700,
        fillStyle: '#fef3c7',
        strokeStyle: 'rgba(58, 18, 38, 0.62)',
        strokeWidth: 1.8,
        shadowColor: 'rgba(245, 158, 11, 0.18)',
        shadowBlur: 5,
        letterSpacing: 0.9,
        uppercase: true,
        maxLines: 2
      };
    }

    return {
      fontFamily: `'Segoe UI', 'Trebuchet MS', Arial, sans-serif`,
      fontWeight: 700,
      fillStyle: '#fff8ef',
      strokeStyle: 'rgba(30, 41, 59, 0.92)',
      strokeWidth: 2,
      shadowColor: 'rgba(15, 23, 42, 0.22)',
      shadowBlur: 6,
      letterSpacing: 0.4,
      uppercase: false,
      maxLines: 3
    };
  }

  private measureCanvasTextLine(
    context: CanvasRenderingContext2D,
    text: string,
    letterSpacing: number
  ): number {
    if (letterSpacing <= 0 || text.length < 2) {
      return context.measureText(text).width;
    }

    return [...text].reduce((totalWidth, character, index) => {
      const extraSpacing = index === 0 ? 0 : letterSpacing;
      return totalWidth + context.measureText(character).width + extraSpacing;
    }, 0);
  }

  private drawCanvasTextLine(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    align: CanvasTextAlign,
    letterSpacing: number
  ): void {
    if (letterSpacing <= 0 || text.length < 2) {
      context.strokeText(text, x, y);
      context.fillText(text, x, y);
      return;
    }

    const totalWidth = this.measureCanvasTextLine(context, text, letterSpacing);
    let cursorX = align === 'center'
      ? x - totalWidth / 2
      : align === 'right'
        ? x - totalWidth
        : x;

    [...text].forEach((character, index) => {
      if (index > 0) {
        cursorX += letterSpacing;
      }

      context.strokeText(character, cursorX, y);
      context.fillText(character, cursorX, y);
      cursorX += context.measureText(character).width;
    });
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
