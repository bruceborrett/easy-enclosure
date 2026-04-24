import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ActionButtonVariant = 'toolbar' | 'toolbar-primary' | 'dialog' | 'dialog-primary' | 'tile';

@Component({
  selector: 'app-action-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    class: 'contents',
  },
  templateUrl: './action-button.component.html',
})
export class ActionButtonComponent {
  readonly href = input<string | null>(null);
  readonly external = input(false);
  readonly title = input<string | null>(null);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly variant = input<ActionButtonVariant>('toolbar');

  readonly buttonClass = computed(() => {
    const shared =
      'cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30';

    switch (this.variant()) {
      case 'toolbar':
        return `${shared} inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-white/85 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:border-slate-500 hover:bg-slate-100`;
      case 'toolbar-primary':
        return `${shared} inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-slate-900 text-[10px] font-bold uppercase tracking-[0.12em] text-white hover:bg-slate-700`;
      case 'dialog':
        return `${shared} inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:border-slate-500 hover:bg-slate-100`;
      case 'dialog-primary':
        return `${shared} inline-flex h-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-700`;
      case 'tile':
        return `${shared} flex min-h-12 w-full items-center gap-3 border border-slate-200 bg-white px-3 py-2 text-left text-slate-900 hover:bg-slate-50`;
    }
  });

  readonly target = computed(() => (this.href() && this.external() ? '_blank' : null));
  readonly rel = computed(() => (this.href() && this.external() ? 'noreferrer noopener' : null));
}
