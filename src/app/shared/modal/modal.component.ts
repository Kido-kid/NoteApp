import {
  Component, Input, Output, EventEmitter,
  Inject, PLATFORM_ID, OnDestroy
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-modal',
  imports:[CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnDestroy {
  @Input() title = '';
  @Input() message = '';
  @Input() visible = false;

  /** Controls */
  @Input() primaryText = 'OK';
  @Input() secondaryText?: string;
  @Input() destructive = false;
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;

  /** Behavior */
  @Input() autoCloseAfter?: number;   // seconds until close
  @Input() countdownFrom?: number;    // countdown for redirects
  @Input() variant: 'info' | 'success' | 'error' | 'confirm' = 'info';

  /** Events */
  @Output() primary = new EventEmitter<void>();
  @Output() secondary = new EventEmitter<void>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() countdownComplete = new EventEmitter<void>();

  countdown = 0;
  private timer: any = null;
  private autoTimer: any = null;
  private isBrowser = false;

  constructor(@Inject(PLATFORM_ID) platformId: Object, @Inject(DOCUMENT) private doc: Document) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  open() {
    if (this.visible) return;
    this.visible = true;
    this.opened.emit();

    if (this.isBrowser) {
      this.doc.body.style.overflow = 'hidden';
    }

    // Start countdown for redirects
    if (this.countdownFrom && this.countdownFrom > 0) this.startCountdown(this.countdownFrom);

    // Auto close after X seconds
    if (this.autoCloseAfter && this.autoCloseAfter > 0) {
      this.autoTimer = setTimeout(() => this.close(), this.autoCloseAfter * 1000);
    }
  }

  close() {
    if (!this.visible) return;
    this.visible = false;
    this.stopCountdown();
    this.clearTimers();
    this.closed.emit();
    if (this.isBrowser) this.doc.body.style.overflow = '';
  }

  onPrimary() { this.primary.emit(); }
  onSecondary() { this.secondary.emit(); }

  onBackdropClick(e: MouseEvent) {
    if (this.closeOnBackdrop && (e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  private startCountdown(from: number) {
    this.stopCountdown();
    this.countdown = from;
    this.timer = setInterval(() => {
      this.countdown -= 1;
      if (this.countdown <= 0) {
        this.stopCountdown();
        this.countdownComplete.emit();
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  private clearTimers() {
    if (this.autoTimer) { clearTimeout(this.autoTimer); this.autoTimer = null; }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
    this.clearTimers();
    if (this.isBrowser) this.doc.body.style.overflow = '';
  }
}
