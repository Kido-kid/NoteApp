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


//Accessing Modal 
@ViewChild('signupSuccess') signupSuccess!: ModalComponent;

//Initializing signup credential variables
  username = '';
  email = '';
  password = '';

  //Initializing variables for duplicate entry validation
  usernameExists = false;
  emailExists = false;

  constructor(private router: Router) {}

  // Called on typing username (live check)
  onUsernameInput() {
    const users = this.getStoredUsers();
    this.usernameExists = !!users.find(u => u.username.toLowerCase() === (this.username || '').trim().toLowerCase());
  }

  // Called on typing email (live check)
  onEmailInput() {
    const users = this.getStoredUsers();
    this.emailExists = !!users.find(u => u.email.toLowerCase() === (this.email || '').trim().toLowerCase());
  }

  // Read users array from localStorage for validation
  private getStoredUsers(): any[] {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]') as any[];
    } catch {
      return [];
    }
  }

  //Utility that helps in Navigation btwn fields by "Enter"
  goNext(nextField: HTMLInputElement, event: Event) {
    event.preventDefault(); 
    setTimeout(() => nextField.focus(), 0);
  }

  // When Enter in password field
  onEnterPassword(form: NgForm) {
    if (form.invalid || this.usernameExists || this.emailExists) {
      Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
      return;
    }
    this.onSignup(form);
  }

  // Signup Handler
  onSignup(form: NgForm) {
 
    if (form.invalid || this.usernameExists || this.emailExists) {
      Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
      return;
    }

    
    const encryptedPassword = btoa(this.password);

    const users = this.getStoredUsers();
    users.push({
      username: this.username.trim(),
      email: this.email.trim(),
      password: encryptedPassword
    });
    localStorage.setItem('users', JSON.stringify(users));

    //alert('Signup Successful!');
    // console.log(this.signupSuccess);
    
    this.signupSuccess.open(); 
    form.resetForm();
     
  }

   goToLogin() {
    this.router.navigate(['/login']);
  }


  reloadPage() {
  location.reload();
}
}
