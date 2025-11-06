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

  //Initializing Credential Variables
  identifier = '';
  password = '';

  loginError = false;
  showPassword = false;


  constructor(private router: Router) {}

  //Getting User Details from Local storage
  private getStoredUsers(): any[] {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]') as any[];
    } catch {
      return [];
    }
  }

  //Utility For Navigation btwn Fields
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
    e.preventDefault(); 
    e.stopPropagation();
    this.showPassword = !this.showPassword;
  }

  keepFocus(e: MouseEvent) {
    e.preventDefault();
  }

  //Submitting Form
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

    // success-Setting details in Local Storage
    localStorage.setItem('currentUser', JSON.stringify({ username: user.username, email: user.email }));
    localStorage.setItem('justLoggedIn', 'true');

    //Resetting Form
    form.resetForm();

    // navigate to notes page 
    this.router.navigate(['/notes']);
  }
}
