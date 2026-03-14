import { Routes } from '@angular/router';
import {RegisterComponent} from './components/register/register.component';
import {LoginComponent} from './components/login/login.component';
import {VaultComponent} from './components/vault/vault.component';

export const routes: Routes = [
  {path:'register',component:RegisterComponent},
  {path:'login',component:LoginComponent},
  { path: 'vault', component: VaultComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }

];
