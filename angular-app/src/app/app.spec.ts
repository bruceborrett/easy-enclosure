import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

@Component({ selector: 'app-renderer', template: '' })
class MockRendererComponent {}

@Component({ selector: 'app-params-form', template: '' })
class MockParamsFormComponent {}

@Component({ selector: 'app-tools', template: '' })
class MockToolsComponent {}

@Component({ selector: 'app-funding', template: '' })
class MockFundingComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .overrideComponent(App, {
        set: {
          imports: [
            MockRendererComponent,
            MockParamsFormComponent,
            MockToolsComponent,
            MockFundingComponent,
          ],
        },
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the shell feature components', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('app-renderer')).not.toBeNull();
    expect(host.querySelector('app-params-form')).not.toBeNull();
    expect(host.querySelector('app-tools')).not.toBeNull();
    expect(host.querySelector('app-funding')).not.toBeNull();
  });
});
