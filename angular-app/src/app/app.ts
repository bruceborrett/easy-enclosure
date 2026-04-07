import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RendererComponent } from './features/renderer/renderer.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RendererComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
