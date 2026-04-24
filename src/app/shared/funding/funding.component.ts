import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActionButtonComponent } from '../action-button/action-button.component';

@Component({
  selector: 'app-funding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActionButtonComponent],
  templateUrl: './funding.component.html',
})
export class FundingComponent {}
