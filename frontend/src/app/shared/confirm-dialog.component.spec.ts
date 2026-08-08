import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('está oculto por defecto', () => {
    expect(component.visible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.backdrop')).toBeNull();
  });

  it('open() muestra el modal con el título y mensaje indicados', () => {
    const promise = component.open('¿Desea guardar?', 'Se guardarán los cambios', 'Guardar');
    fixture.detectChanges();

    expect(component.visible()).toBe(true);
    expect(promise).toBeInstanceOf(Promise);

    const title = fixture.nativeElement.querySelector('h3');
    const message = fixture.nativeElement.querySelector('.muted');
    const confirmBtn = fixture.nativeElement.querySelector('.btn-danger');

    expect(title.textContent.trim()).toBe('¿Desea guardar?');
    expect(message.textContent.trim()).toBe('Se guardarán los cambios');
    expect(confirmBtn.textContent.trim()).toBe('Guardar');
  });

  it('close(false) resuelve la promesa con false y oculta el modal', async () => {
    const promise = component.open('¿Guardar?', 'Mensaje');
    const result = component.close(false);
    fixture.detectChanges();

    expect(component.visible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.backdrop')).toBeNull();
    await expect(promise).resolves.toBe(false);
    expect(result).toBeUndefined();
  });

  it('el botón Confirmar resuelve con true y el botón Cancelar con false', async () => {
    const promise = component.open('¿Guardar?', 'Mensaje');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.btn-danger').click();
    fixture.detectChanges();
    await expect(promise).resolves.toBe(true);

    const promise2 = component.open('¿Guardar?', 'Mensaje');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.btn').click();
    fixture.detectChanges();
    await expect(promise2).resolves.toBe(false);
  });
});
