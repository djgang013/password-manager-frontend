import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CryptoService } from '../../services/crypto.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  errorMessage = signal('');

  constructor(
    private http: HttpClient,
    private crypto: CryptoService,
    private router: Router
  ) {}

  async onLogin() {
    this.errorMessage.set(''); // Clear old errors

    try {
      // 1. Fetch the user's unique salt from Spring Boot
      const saltRes: any = await lastValueFrom(
        this.http.get(`http://localhost:8080/api/auth/salt/${this.username()}`)
      );

      const userSalt = saltRes.salt;

      // 2. Hash the password LOCALLY using that exact salt
      const hashedMaster = await this.crypto.hashPassword(this.password(), userSalt);

      // 3. Send the hash to the server to get the JWT
      const loginPayload = {
        username: this.username(),
        password: hashedMaster
      };

      const loginRes: any = await lastValueFrom(
        this.http.post('http://localhost:8080/api/auth/login', loginPayload)
      );

      // 4. Save the VIP token!
      const jwtToken = loginRes.token;
      localStorage.setItem('vault_token', jwtToken);

      alert('Login Successful! Check your browser console to see the JWT.');
      console.log('Your JWT:', jwtToken);

      // Later, we will navigate to the actual Vault Dashboard here
      // this.router.navigate(['/dashboard']);

    } catch (error: any) {
      console.error('Login failed', error);
      this.errorMessage.set('Invalid username or password.');
    }
  }
}
