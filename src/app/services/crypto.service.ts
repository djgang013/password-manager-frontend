import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
 generateSalt():string{
   const array = new Uint8Array(16);
   window.crypto.getRandomValues(array);
   return btoa(String.fromCharCode(...array));
}

async hashPassword(password:string,salt: string): Promise<string>{
   const encoder =new TextEncoder();
   const data =encoder.encode(password +salt);
   const hashBuffer =await window.crypto.subtle.digest('SHA-256',data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

}
