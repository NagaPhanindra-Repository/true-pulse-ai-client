// All overlay helpers must be inside the ImageStudioComponent class, not at the top level.
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityService } from '../../services/entity.service';
import { GenerateBusinessImageRequest, GenerateBusinessImageResponse, OverlaySpec, CreateEntityResponse } from '../../models/entity.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';


@Component({
  selector: 'app-image-studio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressBarModule
  ],
  templateUrl: './image-studio.component.html',
  styleUrls: ['./image-studio.component.scss']
})
export class ImageStudioComponent implements OnInit {
  // --- Logo/Barcode Overlays (multiple) ---
  logoOverlays: Array<{
    url: string;
    img: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
    dragging: boolean;
    resizing: boolean;
    offsetX: number;
    offsetY: number;
    id: string;
  }> = [];
  // For drag/resize tracking
  private activeLogoOverlayId: string | null = null;

  // For drag-and-drop UI
  logoDragActive: boolean = false;
  // Drag-and-drop handler for logo upload (multiple)
  onLogoDrop(event: DragEvent) {
    event.preventDefault();
    this.logoDragActive = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.onLogoFileSelected({ target: { files: event.dataTransfer.files } } as any);
    }
  }

  // Remove a logo overlay by id
  removeLogoOverlay(id: string) {
    this.logoOverlays = this.logoOverlays.filter(o => o.id !== id);
    this.schedulePosterRender();
  }

  // For drag/resize
  private logoDragMode: 'none' | 'move' | 'resize' = 'none';
  private logoDragStart = { x: 0, y: 0, overlayX: 0, overlayY: 0, overlayW: 0, overlayH: 0 };

  // --- Logo overlay pointer handlers (multi) ---
  onLogoPointerDown(event: MouseEvent | TouchEvent): boolean {
    if (!this.posterCanvas) return false;
    const canvas = this.posterCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const clientX = (event instanceof MouseEvent) ? event.clientX : event.touches[0].clientX;
    const clientY = (event instanceof MouseEvent) ? event.clientY : event.touches[0].clientY;
    const x = ((clientX - rect.left) * (canvas.width / rect.width));
    const y = ((clientY - rect.top) * (canvas.height / rect.height));
    // Iterate in reverse to prioritize topmost overlay
    for (let i = this.logoOverlays.length - 1; i >= 0; i--) {
      const overlay = this.logoOverlays[i];
      const resizeHandleSize = Math.max(18, overlay.width * 0.18);
      // Check for resize handle
      if (
        x >= overlay.x + overlay.width - resizeHandleSize &&
        x <= overlay.x + overlay.width &&
        y >= overlay.y + overlay.height - resizeHandleSize &&
        y <= overlay.y + overlay.height
      ) {
        this.logoDragMode = 'resize';
        this.logoDragStart = { x, y, overlayX: overlay.x, overlayY: overlay.y, overlayW: overlay.width, overlayH: overlay.height };
        this.activeLogoOverlayId = overlay.id;
        event.preventDefault();
        return true;
      }
      // Check for drag inside image
      if (
        x >= overlay.x &&
        x <= overlay.x + overlay.width &&
        y >= overlay.y &&
        y <= overlay.y + overlay.height
      ) {
        this.logoDragMode = 'move';
        this.logoDragStart = { x, y, overlayX: overlay.x, overlayY: overlay.y, overlayW: overlay.width, overlayH: overlay.height };
        this.activeLogoOverlayId = overlay.id;
        event.preventDefault();
        return true;
      }
    }
    this.activeLogoOverlayId = null;
    return false;
  }

  onLogoPointerMove(event: MouseEvent | TouchEvent): boolean {
    if (this.activeLogoOverlayId && this.logoDragMode !== 'none' && this.posterCanvas) {
      const overlay = this.logoOverlays.find(o => o.id === this.activeLogoOverlayId);
      if (!overlay) return false;
      const canvas = this.posterCanvas.nativeElement;
      const rect = canvas.getBoundingClientRect();
      const clientX = (event instanceof MouseEvent) ? event.clientX : event.touches[0].clientX;
      const clientY = (event instanceof MouseEvent) ? event.clientY : event.touches[0].clientY;
      const x = ((clientX - rect.left) * (canvas.width / rect.width));
      const y = ((clientY - rect.top) * (canvas.height / rect.height));
      if (this.logoDragMode === 'move') {
        overlay.x = this.logoDragStart.overlayX + (x - this.logoDragStart.x);
        overlay.y = this.logoDragStart.overlayY + (y - this.logoDragStart.y);
        this.schedulePosterRender();
      } else if (this.logoDragMode === 'resize') {
        let newW = Math.max(24, this.logoDragStart.overlayW + (x - this.logoDragStart.x));
        let aspect = this.logoDragStart.overlayH / this.logoDragStart.overlayW;
        let newH = Math.max(24, newW * aspect);
        overlay.width = newW;
        overlay.height = newH;
        this.schedulePosterRender();
      }
      event.preventDefault();
      return true;
    }
    return false;
  }

  onLogoPointerUp(event?: MouseEvent | TouchEvent): void {
    this.logoDragMode = 'none';
    this.activeLogoOverlayId = null;
  }

  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const url = e.target.result;
          const img = new window.Image();
          img.onload = () => {
            // Default position: bottom right, 20% of canvas width, staggered
            const canvas = this.posterCanvas?.nativeElement;
            if (canvas && img) {
              const w = canvas.width * 0.22;
              const imgWidth = img.width || 1;
              const imgHeight = img.height || 1;
              const h = imgHeight * (w / imgWidth);
              // Stagger overlays so they don't overlap exactly
              const offset = this.logoOverlays.length * 32;
              this.logoOverlays.push({
                url,
                img,
                x: canvas.width - w - 24 - offset,
                y: canvas.height - h - 24 - offset,
                width: w,
                height: h,
                dragging: false,
                resizing: false,
                offsetX: 0,
                offsetY: 0,
                id: Math.random().toString(36).slice(2) + Date.now().toString()
              });
              this.schedulePosterRender();
            }
          };
          img.src = url;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // // --- Logo Overlay Drag/Resize Handlers ---
  // // Unified pointer down handler for both logo and text overlays
  // onPosterPointerDown(event: MouseEvent | TouchEvent): void {
  //   // Try logo overlay first
  //   if (this.onLogoPointerDown(event)) return;
  //   // Fallback to text overlay logic
  //   const overlays = this.getAllOverlays();
  //   if (!overlays.length || !this.overlayAnchorBounds.length) return;
  //   const point = this.getCanvasPoint(event);
  //   if (!point) return;
  //   const hit = this.findAnchorAtPoint(point.x, point.y);
  //   if (!hit) {
  //     this.posterCanvasCursor = 'grab';
  //     return;
  //   }
  //   const existingOffset = this.overlayManualOffsets[hit.key] || { x: 0, y: 0 };
  //   this.dragState = {
  //     key: hit.key,
  //     startX: point.x,
  //     startY: point.y,
  //     originX: existingOffset.x,
  //     originY: existingOffset.y,
  //     hasDragged: false
  //   };
  //   this.selectedAnchorKey = hit.key;
  //   this.posterCanvasCursor = 'grabbing';
  //   event.preventDefault?.();
  // }

  // onPosterPointerMove(event: MouseEvent | TouchEvent): void {
  //   // Try logo overlay first
  //   if (this.onLogoPointerMove(event)) return;
  //   // Fallback to text overlay logic
  //   const point = this.getCanvasPoint(event);
  //   if (!point) return;
  //   if (!this.dragState) {
  //     this.posterCanvasCursor = this.findAnchorAtPoint(point.x, point.y) ? 'grab' : 'default';
  //     return;
  //   }
  //   const deltaX = point.x - this.dragState.startX;
  //   const deltaY = point.y - this.dragState.startY;
  //   if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
  //     this.dragState.hasDragged = true;
  //   }
  //   this.overlayManualOffsets = {
  //     ...this.overlayManualOffsets,
  //     [this.dragState.key]: {
  //       x: this.dragState.originX + deltaX,
  //       y: this.dragState.originY + deltaY
  //     }
  //   };
  //   this.schedulePosterRender();
  //   event.preventDefault?.();
  // }

  // onPosterPointerUp(event?: MouseEvent | TouchEvent): void {
  //   // Always end logo drag mode
  //   this.onLogoPointerUp(event);
  //   // Text overlay logic
  //   if (this.dragState && !this.dragState.hasDragged) {
  //     // It was a click, not a drag — toggle selection for arrow-key nudging
  //     const clicked = this.dragState.key;
  //     this.selectedAnchorKey = this.selectedAnchorKey === clicked ? null : clicked;
  //     this.schedulePosterRender();
  //   }
  //   this.dragState = null;
  //   const overlays = this.getAllOverlays();
  //   this.posterCanvasCursor = overlays.length ? 'grab' : 'default';
  // }
  getZoneSampleRect(zone: string, width: number, height: number) {
    switch (zone) {
      case 'top-center':
      case 'top-banner':
        return { left: width * 0.12, top: height * 0.035, width: width * 0.76, height: height * 0.12 };
      case 'upper-middle':
        return { left: width * 0.16, top: height * 0.155, width: width * 0.68, height: height * 0.18 };
      case 'bottom-bar':
        return { left: width * 0.17, top: height * 0.76, width: width * 0.66, height: height * 0.16 };
      case 'bottom-right':
      default:
        return { left: width * 0.64, top: height * 0.72, width: width * 0.3, height: height * 0.2 };
    }
  }

  samplePalette(context: CanvasRenderingContext2D, left: number, top: number, width: number, height: number) {
    const clampedLeft = Math.max(0, Math.floor(left));
    const clampedTop = Math.max(0, Math.floor(top));
    const clampedWidth = Math.max(1, Math.floor(width));
    const clampedHeight = Math.max(1, Math.floor(height));
    const { data } = context.getImageData(clampedLeft, clampedTop, clampedWidth, clampedHeight);
    let redTotal = 0, greenTotal = 0, blueTotal = 0, saturationTotal = 0, sampleCount = 0;
    const stride = 16;
    for (let i = 0; i < data.length; i += stride) {
      const red = data[i], green = data[i + 1], blue = data[i + 2];
      redTotal += red; greenTotal += green; blueTotal += blue;
      const maxChannel = Math.max(red, green, blue);
      const minChannel = Math.min(red, green, blue);
      saturationTotal += maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;
      sampleCount += 1;
    }
    const count = Math.max(sampleCount, 1);
    const r = Math.round(redTotal / count), g = Math.round(greenTotal / count), b = Math.round(blueTotal / count);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const saturation = saturationTotal / count;
    const hue = this.rgbToHsl(r, g, b).h;
    return { r, g, b, luminance, saturation, hue };
  }

  getOverlayTextStyle(overlay: any, palette: any) {
    // Use overlay's own fontStyle and fontColor if set
    const role = (overlay.role || '').toLowerCase();
    const zone = this.normalizeZone(overlay.zone);
    let fontFamily = this.pickFontFamily(role, zone, palette);
    if (overlay.fontStyle) {
      // Map style keys to font families or use as custom
      switch (overlay.fontStyle) {
        case 'classic': fontFamily = `Georgia, 'Palatino Linotype', 'Times New Roman', serif`; break;
        case 'modern': fontFamily = `'Avenir Next', 'Segoe UI', 'Trebuchet MS', Arial, sans-serif`; break;
        case 'poster': fontFamily = `'Impact', 'Arial Black', 'Trebuchet MS', sans-serif`; break;
        case 'elegant': fontFamily = `'Baskerville', 'Palatino Linotype', Georgia, serif`; break;
        case 'condensed': fontFamily = `'Arial Narrow', 'Franklin Gothic Medium', 'Trebuchet MS', sans-serif`; break;
        default: fontFamily = overlay.fontStyle;
      }
    }
    // Always use overlay.fontColor if set, for per-overlay color picker; otherwise, let adaptive logic pick color
    let fillStyle = overlay.fontColor && overlay.fontColor !== '' ? overlay.fontColor : undefined;
    // Use default style logic for other properties
    if (role.includes('title') || role.includes('headline') || role.includes('name') || zone === 'upper-middle') {
      return { fontFamily, fontWeight: 700, fillStyle, fillStyleSecondary: fillStyle, strokeStyle: 'rgba(64, 23, 40, 0.8)', strokeWidth: 2.3, shadowColor: 'rgba(255, 189, 96, 0.28)', shadowBlur: 10, letterSpacing: 0.9, uppercase: true, maxLines: 2 };
    }
    if (role.includes('price') || role.includes('offer') || role.includes('cta') || zone === 'bottom-right') {
      return { fontFamily, fontWeight: 800, fillStyle, fillStyleSecondary: fillStyle, strokeStyle: 'rgba(74, 24, 24, 0.85)', strokeWidth: 2.5, shadowColor: 'rgba(14, 8, 20, 0.42)', shadowBlur: 12, letterSpacing: 0.3, uppercase: false, maxLines: 2 };
    }
    if (zone === 'top-banner' || zone === 'top-center') {
      return { fontFamily, fontWeight: 800, fillStyle, fillStyleSecondary: fillStyle, strokeStyle: 'rgba(42, 20, 34, 0.78)', strokeWidth: 1.9, shadowColor: 'rgba(14, 10, 21, 0.3)', shadowBlur: 8, letterSpacing: 0.55, uppercase: true, maxLines: 2 };
    }
    return { fontFamily, fontWeight: 700, fillStyle, fillStyleSecondary: fillStyle, strokeStyle: 'rgba(30, 41, 59, 0.92)', strokeWidth: 2, shadowColor: 'rgba(15, 23, 42, 0.22)', shadowBlur: 6, letterSpacing: 0.4, uppercase: false, maxLines: 3 };
  }

  pickFontFamily(role: string, zone: string, palette: any): string {
    if (this.selectedOverlayFontStyle === 'custom') return this.customOverlayFontFamily.trim() || `'Avenir Next', 'Segoe UI', Arial, sans-serif`;
    if (this.selectedOverlayFontStyle === 'classic') return `Georgia, 'Palatino Linotype', 'Times New Roman', serif`;
    if (this.selectedOverlayFontStyle === 'modern') return `'Avenir Next', 'Segoe UI', 'Trebuchet MS', Arial, sans-serif`;
    if (this.selectedOverlayFontStyle === 'poster') {
      if (role.includes('offer') || role.includes('price') || role.includes('cta')) return `'Arial Black', 'Franklin Gothic Heavy', 'Trebuchet MS', sans-serif`;
      return `'Impact', 'Arial Black', 'Trebuchet MS', sans-serif`;
    }
    if (this.selectedOverlayFontStyle === 'elegant') return `'Baskerville', 'Palatino Linotype', Georgia, serif`;
    if (this.selectedOverlayFontStyle === 'condensed') return `'Arial Narrow', 'Franklin Gothic Medium', 'Trebuchet MS', sans-serif`;
    if (role.includes('offer') || role.includes('price') || role.includes('cta')) return `'Arial Black', 'Franklin Gothic Heavy', 'Trebuchet MS', 'Segoe UI', sans-serif`;
    if (role.includes('brand') || zone === 'top-banner' || zone === 'top-center') {
      if (palette.saturation > 0.52) return `'Avenir Next', 'Segoe UI', 'Trebuchet MS', Arial, sans-serif`;
      return `'Gill Sans', 'Trebuchet MS', 'Segoe UI', Arial, sans-serif`;
    }
    if (palette.luminance < 0.48) return `Georgia, 'Palatino Linotype', 'Times New Roman', serif`;
    if (palette.hue > 20 && palette.hue < 80) return `Cambria, Georgia, 'Times New Roman', serif`;
    return `'Trebuchet MS', 'Segoe UI', Arial, sans-serif`;
  }

  getOverlayFontSize(overlay: any, width: number): number {
    const scale = Math.max(0.85, width / 1024);
    const role = (overlay.role || '').toLowerCase();
    const zone = this.normalizeZone(overlay.zone);
    let baseSize: number;
    switch ((overlay.size || '').toLowerCase()) {
      case 'large': baseSize = 30; break;
      case 'medium': baseSize = 23; break;
      default: baseSize = 18; break;
    }
    if (role.includes('title') || role.includes('headline') || role.includes('name') || zone === 'upper-middle') baseSize += 16;
    else if (role.includes('price') || role.includes('offer') || role.includes('cta') || zone === 'bottom-right') baseSize += 14;
    else if (zone === 'top-banner' || zone === 'top-center') baseSize += 2;
    const sizeScale = this.overlayFontSizeScale[this.getOverlayKey(overlay)] ?? 1.0;
    return Math.round(baseSize * scale * sizeScale);
  }

  getOverlayMaxWidth(zone: string, width: number): number {
    switch (this.normalizeZone(zone)) {
      case 'bottom-right': return Math.round(width * 0.34);
      case 'upper-middle': return Math.round(width * 0.6);
      default: return Math.round(width * 0.72);
    }
  }

  getOverlayLayout(zone: string, width: number, height: number, textWidth: number, textHeight: number, stackIndex: number) {
    const zoneName = this.normalizeZone(zone);
    const gap = 14;
    switch (zoneName) {
      case 'top-center':
      case 'top-banner':
        return { left: (width - textWidth) / 2, top: height * 0.062 + stackIndex * (textHeight + gap), textAlign: 'center' };
      case 'upper-middle':
        return { left: (width - textWidth) / 2, top: height * 0.182 + stackIndex * (textHeight + gap), textAlign: 'center' };
      case 'bottom-bar':
        return { left: (width - textWidth) / 2, top: height * 0.858 - stackIndex * (textHeight + gap), textAlign: 'center' };
      case 'bottom-right':
      default:
        return { left: width - textWidth - width * 0.072, top: height * 0.81 - stackIndex * (textHeight + gap), textAlign: 'right' };
    }
  }

    drawOverlay(
    context: CanvasRenderingContext2D,
    overlay: any,
    width: number,
    height: number,
    stackIndex: number,
    occupiedRects: any[]
  ) {
    // Palette and style logic
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

    // Draw selection indicator
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
    return { ...overlayRect, key: overlayKey, role: overlay.role, text: overlay.text };
  }

  resolveOverlayLayoutCollision(layout: any, textWidth: number, textHeight: number, canvasWidth: number, canvasHeight: number, occupiedRects: any[], zone: string) {
    const moveUpward = zone === 'bottom-bar' || zone === 'bottom-right';
    const direction = moveUpward ? -1 : 1;
    const step = 12;
    let top = this.clamp(layout.top, 10, canvasHeight - textHeight - 10);
    const left = this.clamp(layout.left, 10, canvasWidth - textWidth - 10);
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const candidate = this.createOverlayRect(left, top, textWidth, textHeight);
      if (!occupiedRects.some(rect => this.rectsOverlap(rect, candidate))) {
        return { left, top, textAlign: layout.textAlign };
      }
      top = this.clamp(top + direction * step, 10, canvasHeight - textHeight - 10);
    }
    return { left, top, textAlign: layout.textAlign };
  }

  createOverlayRect(left: number, top: number, width: number, height: number) {
    return { left: left - 8, top: top - 6, right: left + width + 8, bottom: top + height + 6 };
  }

  clamp(value: number, minValue: number, maxValue: number): number {
    return Math.min(maxValue, Math.max(minValue, value));
  }

  wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = Number.MAX_SAFE_INTEGER) {
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
    if (lines.length <= maxLines) return lines;
    const limitedLines = lines.slice(0, maxLines);
    let lastLine = limitedLines[maxLines - 1];
    while (context.measureText(`${lastLine}...`).width > maxWidth && lastLine.length > 1) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }
    limitedLines[maxLines - 1] = `${lastLine}...`;
    return limitedLines;
  }

  measureCanvasTextLine(context: CanvasRenderingContext2D, text: string, letterSpacing: number) {
    const measured = context.measureText(text).width;
    if (letterSpacing <= 0 || text.length < 2) return measured;
    return measured + Math.max(0, text.length - 1) * letterSpacing * 0.2;
  }

  drawCanvasTextLine(context: CanvasRenderingContext2D, text: string, x: number, y: number, align: CanvasTextAlign, letterSpacing: number) {
    void align;
    void letterSpacing;
    context.strokeText(text, x, y);
    context.fillText(text, x, y);
  }

  createTextFillGradient(context: CanvasRenderingContext2D, top: number, lineHeight: number, style: any) {
    const gradient = context.createLinearGradient(0, top, 0, top + lineHeight);
    gradient.addColorStop(0, style.fillStyleSecondary || style.fillStyle);
    gradient.addColorStop(0.46, style.fillStyle);
    gradient.addColorStop(1, style.fillStyle);
    return gradient;
  }

  getAdaptiveOverlayTextStyle(base: any, palette: any, role: string) {
    // If overlay.fontColor is set, always use it for fillStyle and fillStyleSecondary
    if (base && base.fillStyle && /^#([A-Fa-f0-9]{6})$/.test(base.fillStyle)) {
      return { ...base, fillStyle: base.fillStyle, fillStyleSecondary: base.fillStyle };
    }
    const lowerRole = (role || '').toLowerCase();
    if (this.selectedOverlayColorStyle === 'custom') {
      const customFill = this.hexToRgb(this.customOverlayPrimaryColor) || { r: 255, g: 238, b: 185 };
      const customHighlight = this.hexToRgb(this.customOverlayHighlightColor) || { r: 255, g: 248, b: 223 };
      const customStroke = this.hexToRgb(this.customOverlayStrokeColor) || { r: 42, g: 20, b: 34 };
      return { ...base, fillStyle: this.rgba(customFill.r, customFill.g, customFill.b, 0.98), fillStyleSecondary: this.rgba(customHighlight.r, customHighlight.g, customHighlight.b, 0.99), strokeStyle: this.rgba(customStroke.r, customStroke.g, customStroke.b, 0.86), shadowColor: this.rgba(customStroke.r, customStroke.g, customStroke.b, 0.34), shadowBlur: Math.max(6, base.shadowBlur) };
    }
    const roleHueShift = lowerRole.includes('brand') ? 28 : lowerRole.includes('offer') || lowerRole.includes('price') ? 196 : 154;
    const hueShiftMap: Record<string, number> = { auto: roleHueShift, warm: 26, cool: 210, mono: 0 };
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
      return { ...base, fillStyle: this.rgba(fill.r, fill.g, fill.b, 0.98), fillStyleSecondary: this.rgba(fillHighlight.r, fillHighlight.g, fillHighlight.b, 0.99), strokeStyle: this.rgba(stroke.r, stroke.g, stroke.b, 0.82), shadowColor: this.rgba(shadow.r, shadow.g, shadow.b, 0.42), shadowBlur: Math.max(6, base.shadowBlur + (palette.saturation > 0.45 ? 3 : 1)) };
    }
    const fill = this.hslToRgb(roleHue, this.clamp(saturated * 0.88, 0.25, 0.72), 0.2);
    const fillHighlight = this.hslToRgb(roleHue, this.clamp(saturated * 0.74, 0.22, 0.62), 0.3);
    const stroke = this.hslToRgb((roleHue + 185) % 360, this.clamp(saturated * 0.4, 0.08, 0.35), 0.94);
    const shadow = this.hslToRgb(roleHue, this.clamp(saturated * 0.24, 0.05, 0.2), 0.11);
    return { ...base, fillStyle: this.rgba(fill.r, fill.g, fill.b, 0.96), fillStyleSecondary: this.rgba(fillHighlight.r, fillHighlight.g, fillHighlight.b, 0.98), strokeStyle: this.rgba(stroke.r, stroke.g, stroke.b, 0.76), shadowColor: this.rgba(shadow.r, shadow.g, shadow.b, 0.26), shadowBlur: Math.max(5, base.shadowBlur) };
  }

  hexToRgb(color: string) {
    const normalized = (color || '').trim();
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    if (!match) return null;
    return { r: Number.parseInt(match[1], 16), g: Number.parseInt(match[2], 16), b: Number.parseInt(match[3], 16) };
  }

  rgba(red: number, green: number, blue: number, alpha: number): string {
    const clampedAlpha = Math.min(Math.max(alpha, 0), 1);
    return `rgba(${red}, ${green}, ${blue}, ${clampedAlpha})`;
  }

  rgbToHsl(red: number, green: number, blue: number) {
    const r = red / 255, g = green / 255, b = blue / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    const lightness = (max + min) / 2;
    if (delta === 0) return { h: 0, s: 0, l: lightness };
    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    let hue = 0;
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    return { h: Math.round(hue * 60), s: saturation, l: lightness };
  }

  hslToRgb(hue: number, saturation: number, lightness: number) {
    const h = ((hue % 360) + 360) % 360;
    const s = this.clamp(saturation, 0, 1);
    const l = this.clamp(lightness, 0, 1);
    if (s === 0) { const grayscale = Math.round(l * 255); return { r: grayscale, g: grayscale, b: grayscale }; }
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const hPrime = h / 60;
    const x = chroma * (1 - Math.abs((hPrime % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;
    if (hPrime >= 0 && hPrime < 1) { r1 = chroma; g1 = x; }
    else if (hPrime >= 1 && hPrime < 2) { r1 = x; g1 = chroma; }
    else if (hPrime >= 2 && hPrime < 3) { g1 = chroma; b1 = x; }
    else if (hPrime >= 3 && hPrime < 4) { g1 = x; b1 = chroma; }
    else if (hPrime >= 4 && hPrime < 5) { r1 = x; b1 = chroma; }
    else { r1 = chroma; b1 = x; }
    const match = l - chroma / 2;
    return { r: Math.round((r1 + match) * 255), g: Math.round((g1 + match) * 255), b: Math.round((b1 + match) * 255) };
  }

  rectsOverlap(first: any, second: any) {
    return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
  }

  // --- Drag and hit-testing helpers ---
  findAnchorAtPoint(x: number, y: number) {
    for (let i = this.overlayAnchorBounds.length - 1; i >= 0; i--) {
      const anchor = this.overlayAnchorBounds[i];
      if (x >= anchor.left && x <= anchor.right && y >= anchor.top && y <= anchor.bottom) return anchor;
    }
    return null;
  }


  // Only one getCanvasPoint method should exist

  schedulePosterRender(): void {
    if (this.interactiveRenderQueued) return;
    this.interactiveRenderQueued = true;
    setTimeout(() => {
      this.interactiveRenderQueued = false;
      void this.renderPosterCanvas();
    }, 0);
  }

  async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  normalizeZone(zone: string | null | undefined): string {
    return (zone || '').trim().toLowerCase().replace(/\s+|_+/g, '-');
  }

  sanitizeOverlayText(text: string, role: string): string {
    const normalized = (text || '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
    if (!normalized) return '';
    const lowerRole = (role || '').toLowerCase();
    if (lowerRole.includes('price')) return normalized.replace(/\$\s+/g, '$');
    return normalized;
  }

  getOverlayKey(overlay: any): string {
    return `${overlay.slot}-${this.normalizeZone(overlay.zone)}-${(overlay.role || '').toLowerCase()}`;
  }
  // --- Overlay and Social logic for template compatibility ---

  socialHandles = [
    { key: 'facebook', label: 'Facebook', icon: 'facebook', limit: 63206, enabled: true },
    { key: 'instagram', label: 'Instagram', icon: 'instagram', limit: 2200, enabled: true },
    { key: 'x', label: 'X / Twitter', icon: 'x', limit: 280, enabled: true },
    { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', limit: 3000, enabled: true },
    { key: 'youtube', label: 'YouTube', icon: 'youtube', limit: 5000, enabled: true }
  ];

  enabledSocialHandles() { return this.socialHandles.filter(h => h.enabled); }
  socialPostCharacterCount() { return (this.socialPostMessage || '').trim().length; }
  socialGlobalHealth() {
    if (!this.enabledSocialHandles().length) return 'warning';
    if (this.enabledSocialHandles().some(h => this.socialPostCharacterCount() > h.limit)) return 'over';
    if (this.enabledSocialHandles().some(h => this.socialPostCharacterCount() / h.limit >= 0.85)) return 'warning';
    return 'healthy';
  }
  strictestEnabledSocialLimit() {
    if (!this.enabledSocialHandles().length) return 0;
    return Math.min(...this.enabledSocialHandles().map(h => h.limit));
  }
  needsSocialAutoTrimSuggestion() {
    return this.strictestEnabledSocialLimit() > 0 && this.socialPostCharacterCount() > this.strictestEnabledSocialLimit();
  }
  socialAutoTrimSuggestion() {
    if (!this.needsSocialAutoTrimSuggestion()) return '';
    return this.buildSocialTrimSuggestion(this.socialPostMessage, this.strictestEnabledSocialLimit());
  }
  buildSocialTrimSuggestion(message: string, maxLength: number): string {
    const normalized = (message || '').replace(/\s+/g, ' ').trim();
    if (!normalized || normalized.length <= maxLength) return normalized;
    const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
    let candidate = '';
    for (const sentence of sentences) {
      const next = candidate ? `${candidate} ${sentence}` : sentence;
      if (next.length > maxLength) break;
      candidate = next;
    }
    if (candidate.length >= Math.min(maxLength * 0.55, maxLength - 16)) return candidate;
    const hardLimit = Math.max(12, maxLength - 1);
    return `${normalized.slice(0, hardLimit).trimEnd()}...`;
  }
  applySocialAutoTrimSuggestion() {
    const suggestion = this.socialAutoTrimSuggestion();
    if (!suggestion) return;
    this.socialPostMessage = suggestion;
    this.socialPostStatus = `Applied AI-assisted trim for the strictest selected limit (${this.strictestEnabledSocialLimit()} chars).`;
  }
  toggleSocialHandle(handleKey: string) {
    this.socialHandles = this.socialHandles.map(handle =>
      handle.key === handleKey ? { ...handle, enabled: !handle.enabled } : handle
    );
    this.socialPostStatus = '';
  }
  getSocialHandleHealth(handle: any) {
    if (this.socialPostCharacterCount() > handle.limit) return 'over';
    if (this.socialPostCharacterCount() / handle.limit >= 0.85) return 'warning';
    return 'healthy';
  }
  getSocialHandleStatusText(handle: any) {
    const remaining = handle.limit - this.socialPostCharacterCount();
    if (remaining < 0) return `${Math.abs(remaining)} over`;
    return `${remaining} left`;
  }
  removeOverlay(overlay: OverlaySpec) {
    this.overlays = this.overlays.filter(o => o !== overlay);
    this.schedulePosterRender();
  }
  setOverlayText(overlay: OverlaySpec, text: string) {
    overlay.text = text;
    this.schedulePosterRender();
  }

  setOverlayFontStyle(overlay: OverlaySpec, fontStyle: string) {
    overlay.fontStyle = fontStyle;
    this.schedulePosterRender();
  }

  setOverlayFontColor(overlay: OverlaySpec, fontColor: string) {
    overlay.fontColor = fontColor;
    // Use unique key for overlays
    const key = this.getOverlayKey(overlay);
    let idx = this.overlays.findIndex(o => this.getOverlayKey(o) === key);
    if (idx !== -1) {
      this.overlays = [
        ...this.overlays.slice(0, idx),
        { ...overlay, fontColor },
        ...this.overlays.slice(idx + 1)
      ];
    } else {
      idx = this.customAddedOverlays.findIndex(o => this.getOverlayKey(o) === key);
      if (idx !== -1) {
        this.customAddedOverlays = [
          ...this.customAddedOverlays.slice(0, idx),
          { ...overlay, fontColor },
          ...this.customAddedOverlays.slice(idx + 1)
        ];
      }
    }
    this.schedulePosterRender();
  }
  getOverlayFontSizeScale(overlay: OverlaySpec): number {
    const key = this.getOverlayKey(overlay);
    return this.overlayFontSizeScale[key] ?? 1.0;
  }
  setOverlayFontSizeScale(overlay: OverlaySpec, value: number) {
    const key = this.getOverlayKey(overlay);
    this.overlayFontSizeScale[key] = Number(value);
    this.schedulePosterRender();
  }
  addCustomOverlay() {
    if (!this.newOverlayDraft.text.trim()) return;
    const newOverlay: OverlaySpec = {
      slot: 1000 + (this.customAddedOverlays.length || 0),
      zone: this.newOverlayDraft.zone,
      role: this.newOverlayDraft.role,
      text: this.newOverlayDraft.text,
      size: this.newOverlayDraft.size,
      fontStyle: this.newOverlayDraft.fontStyle || 'modern',
      fontColor: this.newOverlayDraft.fontColor || '#000000'
    };
    this.customAddedOverlays.push(newOverlay);
    // Auto-select the new overlay so its edit section appears immediately
    this.selectedAnchorKey = this.getOverlayKey(newOverlay);
    // Close the add form and reset draft so user can add more layers easily
    this.showAddOverlayForm = false;
    this.newOverlayDraft = { text: '', zone: 'upper-middle', role: 'custom', size: 'medium', fontStyle: 'modern', fontColor: '#000000' };
    this.schedulePosterRender();
  }
  downloadGeneratedImage() {
    if (!this.composedPosterUrl) {
      this.posterRenderError = 'Poster preview is still preparing. Please try download again in a moment.';
      return;
    }
    const link = document.createElement('a');
    link.href = this.composedPosterUrl;
    link.download = 'business-poster.png';
    link.click();
  }

  // --- Begin: Properties for template compatibility with my-entities ---
  get imagePrompt(): string { return this.prompt; }
  set imagePrompt(val: string) { this.prompt = val; }
  get selectedImageSize(): string { return this.outputSize; }
  set selectedImageSize(val: string) { this.outputSize = val; }
  readonly imageSizeOptions: string[] = ['1024x1024', '1024x1536', '1536x1024'];
  get isGeneratingImage(): boolean { return this.loading; }
  get imageGenerationStatus(): string { return this.statusMsg; }
  get imageGenerationError(): string { return this.errorMsg; }
  get generatedImage(): GenerateBusinessImageResponse | null { return null; }
  get generatedImageUrl(): string { return this.imageBase64 || ''; }
  get generatedOverlays(): OverlaySpec[] {
    // For UI only: merge overlays and customAddedOverlays, filter out removed overlays and empty text
    const backend = (this.overlays || []).filter(o => !!o.text && !this.removedOverlayKeys.has(this.getOverlayKey(o)));
    const custom = (this.customAddedOverlays || []).filter(o => !!o.text && !this.removedOverlayKeys.has(this.getOverlayKey(o)));
    return [...backend, ...custom];
  }
  get overlayConstraintNotice(): string { return (!this.generatedImageUrl || this.isPosterRendering || this.generatedOverlays.length) ? '' : 'This response only included a flat image. The browser can redraw clean text only when the backend also returns structured overlay layers.'; }
  get canGenerateImage(): boolean { return !!this.entity && !!this.prompt.trim() && !this.loading; }
  overlayFontStyleOptions = [
    { value: 'auto', label: 'Auto (Image Inspired)' },
    { value: 'classic', label: 'Classic Serif' },
    { value: 'modern', label: 'Modern Sans' },
    { value: 'poster', label: 'Poster Bold' },
    { value: 'elegant', label: 'Elegant Editorial' },
    { value: 'condensed', label: 'Condensed Ad' },
    { value: 'custom', label: 'Custom Font Family' }
  ];
  overlayColorStyleOptions = [
    { value: 'auto', label: 'Auto (Image Inspired)' },
    { value: 'warm', label: 'Warm Festival' },
    { value: 'cool', label: 'Cool Vibrant' },
    { value: 'mono', label: 'Neutral Monotone' },
    { value: 'custom', label: 'Custom Colors' }
  ];
  selectedOverlayFontStyle: string = 'auto';
  selectedOverlayColorStyle: string = 'auto';
  customOverlayFontFamily: string = `Montserrat, 'Avenir Next', 'Segoe UI', Arial, sans-serif`;
  customOverlayPrimaryColor: string = '#ffeeb9';
  customOverlayHighlightColor: string = '#fff8df';
  customOverlayStrokeColor: string = '#2a1422';
  get isCustomOverlayFontStyle(): boolean { return this.selectedOverlayFontStyle === 'custom'; }
  get isCustomOverlayPalette(): boolean { return this.selectedOverlayColorStyle === 'custom'; }
  // --- End: Properties for template compatibility ---

  // --- Begin: Methods for template compatibility ---
  generateBusinessImage(): void { this.generateImage(); }
  retryImageGeneration(): void { this.generateImage(); }
  resetOverlayTextPositions(): void { this.overlayManualOffsets = {}; this.schedulePosterRender(); }
  onOverlayStyleControlChange(): void { /* No-op for now, add logic if needed */ }
  // --- End: Methods for template compatibility ---
  @ViewChild('posterCanvas') posterCanvas?: ElementRef<HTMLCanvasElement>;
  prompt = '';
  outputSize = '1024x1024';
  loading = false;
  statusMsg = '';
  errorMsg = '';
  entity: CreateEntityResponse | null = null;
  imageBase64: string | null = null;
  overlays: OverlaySpec[] = [];
  overlayTextEdits: Record<string, string> = {};
  overlayManualOffsets: Record<string, { x: number; y: number }> = {};
  overlayFontSizeScale: Record<string, number> = {};
  customAddedOverlays: OverlaySpec[] = [];
  removedOverlayKeys: Set<string> = new Set();
  selectedAnchorKey: string | null = null;
  showAddOverlayForm = false;
  newOverlayDraft = { text: '', zone: 'upper-middle', role: 'custom', size: 'medium', fontStyle: 'modern', fontColor: '#000000' };
  isPosterRendering = false;
  posterRenderError = '';
  composedPosterUrl = '';
  overlayAnchorBounds: any[] = [];
  showSocialComposer = false;
  socialPostMessage = '';
  socialPostStatus = '';
  socials = [
    { key: 'facebook', label: 'Facebook', icon: 'facebook', limit: 63206, enabled: true },
    { key: 'instagram', label: 'Instagram', icon: 'instagram', limit: 2200, enabled: true },
    { key: 'x', label: 'X / Twitter', icon: 'x', limit: 280, enabled: true },
    { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', limit: 3000, enabled: true },
    { key: 'youtube', label: 'YouTube', icon: 'youtube', limit: 5000, enabled: true }
  ];
  posterCanvasCursor: 'default' | 'grab' | 'grabbing' = 'default';
  private dragState: { key: string; startX: number; startY: number; originX: number; originY: number; hasDragged: boolean } | null = null;
  private interactiveRenderQueued = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entityService: EntityService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.entityService.getMyEntities().subscribe(entities => {
        this.entity = entities.find(e => e.id == +id) || null;
        if (this.entity) {
          // Optionally set overlay defaults
        }
      });
    }
  }

  generateImage() {
    if (!this.entity) return;
    this.loading = true;
    this.statusMsg = 'Creating poster for ' + (this.entity.displayName || 'the entity') + '...';
    this.errorMsg = '';
    const payload: GenerateBusinessImageRequest = {
      entityId: this.entity.id,
      prompt: this.prompt,
      displayName: this.entity.displayName,
      size: this.outputSize,
      renderingMode: 'TEXT_OVERLAYS'
    };
    this.entityService.generateBusinessImage(payload).subscribe({
      next: (res: GenerateBusinessImageResponse) => {
        if (res.success && res.imageBase64) {
          this.imageBase64 = 'data:' + (res.mimeType || 'image/png') + ';base64,' + res.imageBase64;
          // Strip fontStyle and fontColor from overlays so auto style/color is used on first render
          this.overlays = (res.overlays || []).map(o => {
            const { fontStyle, fontColor, ...rest } = o;
            return { ...rest };
          });
          this.statusMsg = 'Poster generated successfully. Overlay text has been applied for a cleaner final result.';
          setTimeout(() => this.schedulePosterRender(), 0);
        } else {
          this.errorMsg = res.error || 'Failed to generate image.';
        }
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to generate image.';
        this.loading = false;
      }
    });
  }

  // Canvas and overlay logic (adapted from my-entities)
  async renderPosterCanvas(): Promise<void> {
    if (!this.imageBase64) {
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
      const backgroundImage = await this.loadImage(this.imageBase64);
      const canvas = this.posterCanvas.nativeElement;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Poster canvas is not available.');
      const width = backgroundImage.naturalWidth || 1024;
      const height = backgroundImage.naturalHeight || 1024;
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(backgroundImage, 0, 0, width, height);
      // --- Advanced overlay rendering logic from my-entities ---
      const overlays = this.getAllOverlays();
      const occupiedTextRects: any[] = [];
      this.overlayAnchorBounds = [];
      const zoneOffsets = new Map();
      for (const overlay of overlays) {
        const offsetIndex = zoneOffsets.get(overlay.zone) || 0;
        const anchorBounds = this.drawOverlay(context, overlay, width, height, offsetIndex, occupiedTextRects);
        this.overlayAnchorBounds.push(anchorBounds);
        zoneOffsets.set(overlay.zone, offsetIndex + 1);
      }
      // Draw all logo/barcode overlays
      for (const overlay of this.logoOverlays) {
        context.save();
        context.globalAlpha = 1.0;
        context.drawImage(
          overlay.img,
          overlay.x,
          overlay.y,
          overlay.width,
          overlay.height
        );
        // Draw selection border and resize handle only if selected
        if (this.activeLogoOverlayId === overlay.id) {
          // Draw dashed selection border
          context.save();
          context.setLineDash([5, 4]);
          context.strokeStyle = 'rgba(255,255,255,0.85)';
          context.lineWidth = 2;
          context.strokeRect(
            overlay.x - 6,
            overlay.y - 6,
            overlay.width + 12,
            overlay.height + 12
          );
          context.restore();
          // Draw resize handle (bottom-right corner)
          const handleSize = Math.max(18, overlay.width * 0.18);
          context.save();
          context.beginPath();
          context.rect(
            overlay.x + overlay.width - handleSize,
            overlay.y + overlay.height - handleSize,
            handleSize,
            handleSize
          );
          context.fillStyle = 'rgba(255,255,255,0.92)';
          context.strokeStyle = '#333';
          context.lineWidth = 2;
          context.fill();
          context.stroke();
          context.restore();
        }
        context.restore();
      }
      this.composedPosterUrl = canvas.toDataURL('image/png');
      this.isPosterRendering = false;
      this.posterRenderError = '';
    } catch {
      this.isPosterRendering = false;
      this.posterRenderError = 'Poster overlay rendering failed. The raw image is available, but combined poster export is not ready.';
    }
  }

  // --- Overlay management and rendering helpers (ported from my-entities) ---
  getAllOverlays(): OverlaySpec[] {
    // Merge overlays from backend and custom overlays, using unique keys
    const fromImage = [...(this.overlays || [])]
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
      .filter(overlay => !!overlay.text && !this.removedOverlayKeys?.has(this.getOverlayKey(overlay)))
      .sort((left, right) => (left.slot || 0) - (right.slot || 0));

    const fromCustom = (this.customAddedOverlays || []).map(overlay => {
      const key = this.getOverlayKey(overlay);
      const edited = this.overlayTextEdits[key];
      return edited !== undefined ? { ...overlay, text: edited } : { ...overlay };
    });


    return [...fromImage, ...fromCustom];
  }

  // Social composer logic (simplified)
  toggleSocialComposer(): void {
    this.showSocialComposer = !this.showSocialComposer;
    this.socialPostStatus = '';
    if (this.showSocialComposer && !this.socialPostMessage.trim()) {
      const display = this.entity?.displayName || 'our brand';
      this.socialPostMessage = `Fresh poster drop for ${display}. Built with True Pulse AI.`;
    }
  }

  simulateOneClickSocialPost(): void {
    const trimmed = this.socialPostMessage.trim();
    if (!trimmed) {
      this.socialPostStatus = 'Add a message before you publish this campaign draft.';
      return;
    }
    if (!this.socials.some(s => s.enabled)) {
      this.socialPostStatus = 'Enable at least one social handle to continue.';
      return;
    }
    if (this.socials.some(s => trimmed.length > s.limit)) {
      this.socialPostStatus = 'Message is over the limit for one or more selected handles. Trim it to continue.';
      return;
    }
    this.socialPostStatus = `Prototype mode: ready to post across ${this.socials.filter(s => s.enabled).length} handle(s). Social API integration can be plugged in later for true one-click posting.`;
  }

  // --- Canvas interactivity for overlay editing ---
  onPosterPointerDown(event: MouseEvent | TouchEvent): void {
    // Try logo overlay first
    if (this.onLogoPointerDown(event)) return;
    // Fallback to text overlay logic
    const overlays = this.getAllOverlays();
    if (!overlays.length || !this.overlayAnchorBounds.length) return;
    const point = this.getCanvasPoint(event);
    if (!point) return;
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
    this.selectedAnchorKey = hit.key;
    this.posterCanvasCursor = 'grabbing';
    event.preventDefault?.();
  }

  onPosterPointerMove(event: MouseEvent | TouchEvent): void {
    // Try logo overlay first
    if (this.onLogoPointerMove(event)) return;
    // Fallback to text overlay logic
    const point = this.getCanvasPoint(event);
    if (!point) return;
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
    this.schedulePosterRender();
    event.preventDefault?.();
  }

  onPosterPointerUp(): void {
    // Always end logo drag mode
    this.onLogoPointerUp();
    // Text overlay logic
    if (this.dragState && !this.dragState.hasDragged) {
      // It was a click, not a drag — toggle selection for arrow-key nudging
      const clicked = this.dragState.key;
      this.selectedAnchorKey = this.selectedAnchorKey === clicked ? null : clicked;
      this.schedulePosterRender();
    }
    this.dragState = null;
    const overlays = this.getAllOverlays();
    this.posterCanvasCursor = overlays.length ? 'grab' : 'default';
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
    this.schedulePosterRender();
  }

  getCanvasPoint(event: MouseEvent | TouchEvent): { x: number; y: number } | null {
    const canvas = this.posterCanvas?.nativeElement;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const pointer = 'touches' in event ? (event.touches[0] || event.changedTouches[0]) : event;
    if (!pointer || rect.width === 0 || rect.height === 0) return null;
    const x = ((pointer.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((pointer.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  }

  close() {
    this.router.navigate(['/entities/my']);
  }
}
