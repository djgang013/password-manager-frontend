import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../../services/crypto.service';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './vault.component.html',
  styleUrl: './vault.component.css'
})
export class VaultComponent implements OnInit {
  vaultEntries = signal<any[]>([]);

  // Form fields
  websiteName = signal('');
  websiteUrl = signal('');
  loginUsername = signal('');
  plainPassword = signal('');

  constructor(
    private http: HttpClient,
    private crypto: CryptoService,
    private router: Router
  ) {}

  ngOnInit() {
    // Security check: If they refreshed the page, the RAM key is gone. Kick them to login!
    if (!this.crypto.getSessionKey()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadVault();
  }

  async loadVault() {
    try {
      const entries: any = await lastValueFrom(
        this.http.get('http://localhost:8080/api/vault/entries')
      );

      const key = this.crypto.getSessionKey()!;
      const decryptedEntries = [];

      // Decrypt every password coming from Spring Boot
      for (const entry of entries) {
        const decryptedPass = await this.crypto.decrypt(entry.encryptedPassword, entry.iv, key);
        decryptedEntries.push({ ...entry, decryptedPassword: decryptedPass });
      }

      this.vaultEntries.set(decryptedEntries);
    } catch (error) {
      console.error('Failed to load vault', error);
    }
  }
// ... existing code ...

  // NEW: Cryptographically Secure Password Generator
  generateStrongPassword(length: number = 16) {
    // The characters we are allowed to use
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]:;?><,./-=";
    let newPassword = "";

    // Create an array to hold completely random cryptographic numbers
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    // Pick a character from the charset for each random number
    for (let i = 0; i < length; i++) {
      newPassword += charset[randomValues[i] % charset.length];
    }

    // Update the Angular signal so it instantly appears in the input box
    this.plainPassword.set(newPassword);
  }


  async addPassword() {
    try {
      const key = this.crypto.getSessionKey()!;

      // 1. Encrypt the plain text password
      const { cipherText, iv } = await this.crypto.encrypt(this.plainPassword(), key);

      // 2. Prepare the payload (Notice we send cipherText, NOT the plain password)
      const payload = {
        websiteName: this.websiteName(),
        websiteUrl: this.websiteUrl(),
        loginUsername: this.loginUsername(),
        encryptedPassword: cipherText,
        iv: iv
      };


      // 3. Send to Spring Boot
      await lastValueFrom(this.http.post('http://localhost:8080/api/vault/entries', payload));

      // 4. Clear the form and reload the vault
      this.websiteName.set('');
      this.websiteUrl.set('');
      this.loginUsername.set('');
      this.plainPassword.set('');

      this.loadVault();

    } catch (error) {
      console.error('Failed to save password', error);
    }
  }
  // NEW: Copy to Clipboard function
  copyToClipboard(password: string, event: Event) {
    navigator.clipboard.writeText(password).then(() => {
      // Grab the button that was clicked
      const button = event.target as HTMLButtonElement;
      const originalText = button.innerText;

      // Temporarily change the text to show it worked
      button.innerText = '✅ Copied!';
      button.style.backgroundColor = '#4CAF50';
      button.style.color = 'white';

      // Change it back after 2 seconds
      setTimeout(() => {
        button.innerText = originalText;
        button.style.backgroundColor = '';
        button.style.color = 'black';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Clipboard access denied by browser.');
    });
  }
  // NEW: Delete Password
  async deletePassword(id: number) {
    const confirmed = confirm('Are you sure you want to delete this password? This cannot be undone.');
    if (!confirmed) return;

    try {
      await lastValueFrom(this.http.delete(`http://localhost:8080/api/vault/entries/${id}`));

      // Reload the vault to remove the deleted row from the screen
      this.loadVault();
    } catch (error) {
      console.error('Failed to delete password', error);
      alert('Failed to delete password. Check the console.');
    }
  }

  logout() {
    localStorage.removeItem('vault_token');
    this.crypto.setSessionKey(null as any); // Wipe the RAM key
    this.router.navigate(['/login']);
  }
}
