import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-funding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './funding.component.html',
})
export class FundingComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly buyMeACoffeeSrcdoc: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }

      body {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <script
      type="text/javascript"
      src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
      data-name="bmc-button"
      data-slug="bruceborrett"
      data-color="#284f71"
      data-emoji=""
      data-font="Arial"
      data-text="Buy me a coffee"
      data-outline-color="#ffffff"
      data-font-color="#ffffff"
      data-coffee-color="#FFDD00"
    ><\/script>
    <style>
      .bmc-btn-container {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .bmc-btn {
        min-width: 0 !important;
        height: 34px !important;
        padding: 0 12px !important;
        border-radius: 8px !important;
        font-size: 15px !important;
        line-height: 1 !important;
      }

      .bmc-btn svg {
        height: 20px !important;
        transform: none !important;
      }

      .bmc-btn-text {
        margin-left: 6px !important;
        line-height: 1 !important;
        white-space: nowrap !important;
      }
    </style>
  </body>
</html>`);
}
