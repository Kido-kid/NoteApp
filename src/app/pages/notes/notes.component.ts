import { CommonModule } from '@angular/common';
import { Component,OnInit,NgZone,ChangeDetectorRef,OnDestroy,ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../../shared/modal/modal.component';

type Note = {
  id: string;
  text: string;
  createdAt: string; 
  updatedAt: string; 
};

declare const webkitSpeechRecognition: any;

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})

export class NotesComponent implements OnInit, OnDestroy {

  
  currentUser: { username: string; email: string } | null = null;

  showLoginBanner = false;

  
  notes: Note[] = [];
  filtered: Note[] = [];

  //compose/edit
  draftText = '';
  editingId: string | null = null;
  lastEditDisplay = '';

  //Toast
  showToast = false;
  toastMessage = '';

  //Speech
  speechAvailable = false;
  isRecording = false;
  interimTranscript = '';
  private recognition: any | null = null;

  // search / filters
  searchTerm = '';
  fromDate: string | null = null;
  toDate: string | null = null;

   private noteToDelete: string | null = null;

  // Modals
  @ViewChild('confirmDelete') confirmDelete!: ModalComponent;
  @ViewChild('confirmUpdate') confirmUpdate!: ModalComponent;


  constructor(
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    // Check if user just logged in using localStorage flag for showing Login Successful Banner
    const justLoggedIn = localStorage.getItem('justLoggedIn');

    if (justLoggedIn === 'true') {
      this.showLoginBanner = true;
      setTimeout(() => {
        this.showLoginBanner = false;
      }, 3000);
      localStorage.removeItem('justLoggedIn');
    }
    

    //if currentUser doesn't exist navigate to Login page
    const rawUser = localStorage.getItem('currentUser');
    if (!rawUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = JSON.parse(rawUser);

    this.loadNotes();
    this.applyFilters();

    this.speechAvailable =
      !!(window as any).SpeechRecognition ||
      !!(window as any).webkitSpeechRecognition;

    
  }

  private storageKey(): string {
    const uname = this.currentUser?.username || 'guest';
    return `notes:${uname}`;
  }

  private loadNotes(): void {
    try {
      const raw = localStorage.getItem(this.storageKey());
      this.notes = raw ? (JSON.parse(raw) as Note[]) : [];
      
      this.notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch {
      this.notes = [];
    }
  }

  //Setting Notes items
  private persist(): void {
    localStorage.setItem(this.storageKey(), JSON.stringify(this.notes));
  }

  // CRUD
  saveNote(): void {
    const text = this.draftText.trim();
    if (!text) return;

    const nowIso = new Date().toISOString();

    if (this.editingId) {
      
      this.confirmUpdate.open();
    } else {
      
      const note: Note = {
        id: cryptoRandomId(),
        text,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      this.notes.unshift(note);

      this.draftText = '';
      this.persist();
      this.applyFilters();

      if (this.isRecording) this.stopVoice();

      this.showToastMessage('Note added successfully!');
    }
  }

  confirmUpdateNow(): void {
    const text = this.draftText.trim();
    if (!text || !this.editingId) return;

    const nowIso = new Date().toISOString();
    const idx = this.notes.findIndex(n => n.id === this.editingId);
    if (idx >= 0) {
      this.notes[idx] = {
        ...this.notes[idx],
        text,
        updatedAt: nowIso
      };
    }

    this.editingId = null;
    this.lastEditDisplay = '';
    this.draftText = '';

    this.persist();
    this.applyFilters();

    this.confirmUpdate.close();
    this.showToastMessage('Note updated successfully!');
  }

  beginEdit(n: Note): void {
    this.editingId = n.id;
    this.draftText = n.text;
    this.lastEditDisplay = new Date(n.updatedAt).toLocaleString();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.draftText = '';
    this.lastEditDisplay = '';
  }

  deleteNote(id: string): void {
   
    this.noteToDelete = id;
    this.confirmDelete.open();
  }

  confirmDeleteNow(): void {
    if (!this.noteToDelete) return;

    this.notes = this.notes.filter(n => n.id !== this.noteToDelete);
    this.persist();
    this.applyFilters();

    if (this.editingId === this.noteToDelete) this.cancelEdit();
    this.noteToDelete = null;
    this.confirmDelete.close();

    this.showToastMessage('Note deleted successfully!');
  }

  // Toast helper
  showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 2500);
  }

  // Speech
  toggleVoice(): void {
    if (this.isRecording) this.stopVoice();
    else this.startVoice();
  }

  private startVoice(): void {
    if (!this.speechAvailable) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.lang = 'en-IN'; 
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.interimTranscript = '';
    this.isRecording = true;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript;
        if (res.isFinal) finalChunk += text;
        else interim += text;
      }

      this.zone.run(() => {
        this.interimTranscript = interim;
        if (finalChunk && finalChunk.trim()) {
          const spacer =
            this.draftText.endsWith(' ') || this.draftText.length === 0 ? '' : ' ';
          this.draftText = (this.draftText + spacer + finalChunk).trimStart();
        }
        this.cdr.markForCheck();
      });
    };

    this.recognition.onerror = (e: any) => {
      this.zone.run(() => {
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          this.stopVoice();
        }
      });
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        this.isRecording = false;
        this.interimTranscript = '';
        this.cdr.markForCheck();
      });
    };

    try {
      this.recognition.start();
    } catch (err) {
      this.zone.run(() => {
        this.isRecording = false;
      });
    }
  }

  private stopVoice(): void {
    try {
      this.recognition?.stop();
    } catch {}
    this.isRecording = false;
    this.interimTranscript = '';
  }

  // Filters
  applyFilters(): void {
    const term = (this.searchTerm || '').trim().toLowerCase();

    const fromMs = this.fromDate ? new Date(this.fromDate).getTime() : -Infinity;
    const toMs = this.toDate ? new Date(this.toDate).getTime() : Infinity;

    const inRange = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= fromMs && t <= toMs;
    };

    this.filtered = this.notes.filter(n => {
      const matchText = term ? n.text.toLowerCase().includes(term) : true;
      const matchDate = inRange(n.updatedAt);
      return matchText && matchDate;
    });

    this.filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearFilters(): void {
    this.fromDate = null;
    this.toDate = null;
    this.applyFilters();
  }

  onEnterCompose(e: Event): void {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) {
      e.preventDefault();
      this.saveNote();
    }
  }

  trackById(_: number, n: Note) {
    return n.id;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.isRecording) this.stopVoice();
  }
}

//Generate a random id 
function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
