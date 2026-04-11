import { ChangeDetectionStrategy, Component } from '@angular/core';
import { APP_VERSION } from './app-version';
import { ParamsFormComponent } from './features/params/params-form.component';
import { RendererComponent } from './features/renderer/renderer.component';
import { ToolsComponent } from './features/tools/tools.component';
import { FundingComponent } from './shared/funding/funding.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RendererComponent, ToolsComponent, ParamsFormComponent, FundingComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly appVersion = APP_VERSION.trim().length > 0 ? APP_VERSION : 'dev';
}
