import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

@Component({ selector: 'app-renderer', template: '' })
class MockRendererComponent {}

@Component({ selector: 'app-sidebar', template: '' })
class MockSidebarComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .overrideComponent(App, {
        set: {
          imports: [MockRendererComponent, MockSidebarComponent],
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
    expect(host.querySelector('app-sidebar')).not.toBeNull();
  });
});
