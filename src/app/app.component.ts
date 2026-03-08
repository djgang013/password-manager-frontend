import {Component, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  status =signal('connecting ...');

  constructor(private http :HttpClient) {
    this.http.get('http://localhost:8080/api/ping',{responseType:'text'})
      .subscribe(res =>this.status.set(res));
  }
}
