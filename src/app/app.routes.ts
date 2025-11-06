import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { NotesComponent } from './pages/notes/notes.component';

export const routes: Routes = [

    { path:'',redirectTo: 'login', pathMatch: 'full'},
   
    { path:'login', component: LoginComponent},
    { path: 'signup', component: SignupComponent},
    { path: 'notes', component: NotesComponent},
    { path: '**', redirectTo: 'login' },
];
