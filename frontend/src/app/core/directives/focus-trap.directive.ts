import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accesibilidad (WCAG 2.2): mantiene el foco dentro de un modal mientras está
 * abierto, restaura el foco al elemento que lo abrió al cerrarse y permite
 * cerrar con Escape. El modal debe existir en el DOM solo cuando está abierto.
 */
@Directive({ selector: '[focusTrap]' })
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private previous: HTMLElement | null = null;
  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.host().dispatchEvent(new Event('focusTrapEscape'));
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = this.focusable();
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || active === this.host() || !this.host().contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.previous = document.activeElement as HTMLElement | null;
    this.host().addEventListener('keydown', this.onKeyDown);
    const first = this.focusable()[0];
    (first ?? this.host()).focus();
  }

  ngOnDestroy(): void {
    this.host().removeEventListener('keydown', this.onKeyDown);
    this.previous?.focus();
  }

  private host(): HTMLElement {
    return this.el.nativeElement;
  }

  private focusable(): HTMLElement[] {
    return Array.from(this.host().querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
  }
}
