import { Component,viewChild,ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-signup',
  imports: [FormsModule,CommonModule,RouterModule,ModalComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

@ViewChild('signupSuccess') signupSuccess!: ModalComponent;
  username = '';
  email = '';
  password = '';

  usernameExists = false;
  emailExists = false;

  constructor(private router: Router) {}

  // Called on typing username (live check)
  onUsernameInput() {
    const users = this.getStoredUsers();
    // case-insensitive check
    this.usernameExists = !!users.find(u => u.username.toLowerCase() === (this.username || '').trim().toLowerCase());
  }

  // Called on typing email (live check)
  onEmailInput() {
    const users = this.getStoredUsers();
    this.emailExists = !!users.find(u => u.email.toLowerCase() === (this.email || '').trim().toLowerCase());
  }

  // Utility: read users array from localStorage
  private getStoredUsers(): any[] {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]') as any[];
    } catch {
      return [];
    }
  }

  // helper used by Enter on first two fields to move focus without submitting
  goNext(nextField: HTMLInputElement, event: Event) {
    event.preventDefault(); // IMPORTANT: stop form submit on Enter
    // focus next after small delay to ensure focus works on mobile
    setTimeout(() => nextField.focus(), 0);
  }

  // When Enter in password field
  onEnterPassword(form: NgForm) {
    // prevent default browser behavior is handled in template by calling this method directly
    // Submit only when valid and no duplicates
    if (form.invalid || this.usernameExists || this.emailExists) {
      // let Angular mark fields as touched so error messages show
      Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
      return;
    }
    this.onSignup(form);
  }

  // Final signup handler (called from ngSubmit)
  onSignup(form: NgForm) {
    // Double-check validations server-side style (defensive)
    if (form.invalid || this.usernameExists || this.emailExists) {
      Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
      return;
    }

    // Basic "encryption" placeholder - replace with proper hashing later
    const encryptedPassword = btoa(this.password);

    const users = this.getStoredUsers();
    users.push({
      username: this.username.trim(),
      email: this.email.trim(),
      password: encryptedPassword
    });
    localStorage.setItem('users', JSON.stringify(users));

    //alert('Signup Successful!');
   
    // reset form and navigate to login (or adjust as needed)
    // console.log('Opening modal…', this.signupSuccess);
     this.signupSuccess.open(); 
    form.resetForm();
    // this.router.navigate(['/login']);
     
  }

   goToLogin() {
    this.router.navigate(['/login']);
  }


  reloadPage() {
  location.reload();
}
}
