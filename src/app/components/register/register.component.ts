import {Component, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {CryptoService} from '../../services/crypto.service';

@Component({
  selector: 'app-register',
  standalone:true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
   username = signal('');
   password =signal('');

   constructor(
     private http:HttpClient,
     private crypto:CryptoService
   ){}
  async  onRegister(){
     const salt=this.crypto.generateSalt()

    const hashedMaster =await this.crypto.hashPassword(this.password(),salt);
     const payload ={
       username:this.username(),
       password: hashedMaster,
       salt:salt
     };

     this.http.post('http://localhost:8080/api/auth/register',payload)
       .subscribe({
         next: (res) =>alert('Registration Successful '),
         error: (err) =>console.error('Registration failed',err)
       });

  }

}
