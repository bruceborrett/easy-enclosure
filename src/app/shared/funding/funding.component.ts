import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-funding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './funding.component.html',
})
export class FundingComponent {}
