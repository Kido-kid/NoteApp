import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports:[FormsModule,CommonModule,RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  identifier = '';
  password = '';
  loginError = false;
  showPassword = false;


  constructor(private router: Router) {}

  private getStoredUsers(): any[] {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]') as any[];
    } catch {
      return [];
    }
  }

  goNext(nextField: HTMLInputElement, event: Event) {
    event.preventDefault();
    setTimeout(() => nextField.focus(), 0);
  }

  onEnterPassword(form: NgForm) {
    if (form.invalid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.onLogin(form);
  }

   togglePasswordVisibility(e: Event) {
    e.preventDefault(); // prevent form submit
    e.stopPropagation();
    this.showPassword = !this.showPassword;
  }

  keepFocus(e: MouseEvent) {
    // prevents losing caret/focus on mousedown
    e.preventDefault();
  }

  onLogin(form: NgForm) {
    this.loginError = false;

    if (form.invalid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      return;
    }

    const users = this.getStoredUsers();
    const id = (this.identifier || '').trim().toLowerCase();

    const user = users.find(u =>
      (u.username && u.username.toLowerCase() === id) ||
      (u.email && u.email.toLowerCase() === id)
    );

    if (!user) {
      this.loginError = true;
      return;
    }

    const encrypted = btoa(this.password);
    if (encrypted !== user.password) {
      this.loginError = true;
      return;
    }

    // success
    localStorage.setItem('currentUser', JSON.stringify({ username: user.username, email: user.email }));
    console.log('Setting justLoggedIn...');
localStorage.setItem('justLoggedIn', 'true');
console.log('justLoggedIn:', localStorage.getItem('justLoggedIn'));



  
    alert('Login successful!');
   

    form.resetForm();

    // navigate to notes page (adjust route if your notes page differs)
    this.router.navigate(['/notes']);
  }
}
