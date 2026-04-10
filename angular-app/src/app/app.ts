import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParamsFormComponent } from './features/params/params-form.component';
import { RendererComponent } from './features/renderer/renderer.component';
import { ToolsComponent } from './features/tools/tools.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RendererComponent, ToolsComponent, ParamsFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
