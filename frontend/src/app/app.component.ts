import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PhotoViewerComponent } from './components/photo-viewer/photo-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, PhotoViewerComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'frontend';
}
