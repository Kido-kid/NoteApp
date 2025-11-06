import { CommonModule } from '@angular/common';
import { Component, OnInit ,NgZone,ChangeDetectorRef , OnDestroy} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';

type Note = {
  id: string;
  text: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

 declare const webkitSpeechRecognition: any;


@Component({
  selector: 'app-notes',
  imports:[CommonModule,FormsModule],
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit, OnDestroy {


  currentUser: { username: string; email: string } | null = null;

  showLoginBanner = false;
  

  // storage + state
  notes: Note[] = [];
  filtered: Note[] = [];

  // compose/edit
  draftText = '';
  editingId: string | null = null;
  lastEditDisplay = '';

  //Speech

  speechAvailable = false;
  isRecording = false;
  interimTranscript = '';
  private recognition: any | null = null;

 
  // search / filters (filtering on updatedAt)
  searchTerm = '';
  fromDate: string | null = null;   // 'YYYY-MM-DDTHH:mm'
  toDate: string | null = null;

  constructor(private router: Router,
    private zone:NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // guard: require login
    const rawUser = localStorage.getItem('currentUser');
    if (!rawUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser = JSON.parse(rawUser);

    this.loadNotes();
    this.applyFilters();

    this.speechAvailable = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

    // Check if user just logged in (via navigation state or localStorage flag)
    const justLoggedIn = localStorage.getItem('justLoggedIn');
    console.log(justLoggedIn);

     if (justLoggedIn === 'true') {
      this.showLoginBanner = true;

      // Hide after 3 seconds
      setTimeout(() => {
        this.showLoginBanner = false;
      }, 3000);

      // Reset the flag so it doesn’t show again later
      localStorage.removeItem('justLoggedIn');
    }

  }

  private storageKey(): string {
    const uname = this.currentUser?.username || 'guest';
    return `notes:${uname}`;
  }

  private loadNotes(): void {
    try {
      const raw = localStorage.getItem(this.storageKey());
      this.notes = raw ? (JSON.parse(raw) as Note[]) : [];
      // newest first
      this.notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch {
      this.notes = [];
    }
  }

  private persist(): void {
    localStorage.setItem(this.storageKey(), JSON.stringify(this.notes));
  }

  


  // CRUD
  saveNote(): void {


    const text = this.draftText.trim();
    if (!text) return;

    const nowIso = new Date().toISOString();

    if (this.editingId) {
      // update existing
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
    } else {
      // add new
      const note: Note = {
        id: cryptoRandomId(),
        text,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      this.notes.unshift(note);
    }

    this.draftText = '';
    this.persist();
    this.applyFilters();


    
     if (this.isRecording) {
    this.stopVoice();
  }
  }

  beginEdit(n: Note): void {
    this.editingId = n.id;
    this.draftText = n.text;
    this.lastEditDisplay = new Date(n.updatedAt).toLocaleString();
    // scroll to composer on mobile if desired
  }

  cancelEdit(): void {
    this.editingId = null;
    this.draftText = '';
    this.lastEditDisplay = '';
  }

  deleteNote(id: string): void {
    if (!confirm('Delete this note?')) return;
    this.notes = this.notes.filter(n => n.id !== id);
    this.persist();
    this.applyFilters();
    if (this.editingId === id) this.cancelEdit();
  }

  //Speech
  toggleVoice(): void {
  if (this.isRecording) this.stopVoice();
  else this.startVoice();
}

private startVoice(): void {
  if (!this.speechAvailable) return;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  this.recognition = new SpeechRecognition();

  this.recognition.lang = 'en-IN';        // or 'en-US'
  this.recognition.continuous = true;
  this.recognition.interimResults = true;

  this.interimTranscript = '';
  this.isRecording = true;

  // IMPORTANT: Angular won't auto-detect changes from these callbacks.
  this.recognition.onresult = (event: any) => {
    let interim = '';
    let finalChunk = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const text = res[0].transcript;
      if (res.isFinal) finalChunk += text;
      else interim += text;
    }

    // >>> Run inside Angular zone so template updates live
    this.zone.run(() => {
      this.interimTranscript = interim;

      if (finalChunk && finalChunk.trim()) {
        const spacer = this.draftText.endsWith(' ') || this.draftText.length === 0 ? '' : ' ';
        this.draftText = (this.draftText + spacer + finalChunk).trimStart();
      }
      this.cdr.markForCheck(); // optional nudge
    });
  };

  this.recognition.onerror = (e: any) => {
    console.warn('Speech error:', e?.error || e);
    // Run inside zone so UI updates (e.g., stop indicator)
    this.zone.run(() => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        this.stopVoice();
      }
    });
  };

  this.recognition.onend = () => {
    // Chrome may end after a pause; reflect state accurately
    this.zone.run(() => {
      this.isRecording = false;
      this.interimTranscript = '';
      this.cdr.markForCheck();
    });
  };

  try { this.recognition.start(); }
  catch (err) {
    console.warn('Speech start error:', err);
    this.zone.run(() => { this.isRecording = false; });
  }
}


private stopVoice(): void {
  try { this.recognition?.stop(); } catch {}
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

    // newest first
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
    // Allow Shift+Enter for newline, Enter to save
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) {
      e.preventDefault();
      this.saveNote();
    }
  }

  trackById(_: number, n: Note) { return n.id; }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }


  ngOnDestroy(): void {
    if (this.isRecording) {
      this.stopVoice();
    }
  }




}

/** Generate a random id using Web Crypto if available; fallback to Math.random */
function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}


