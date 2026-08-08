import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ProductFormComponent } from './product-form.component';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

describe('ProductFormComponent', () => {
  let fixture: ComponentFixture<ProductFormComponent>;
  let component: ProductFormComponent;

  const apiMock = {
    get: vi.fn(() => of({ value: { value: 16 } })),
    post: vi.fn(() => ({ toPromise: () => Promise.resolve({}) })),
    patch: vi.fn(() => ({ toPromise: () => Promise.resolve({}) })),
    upload: vi.fn(() => of({ url: '/api/uploads/x.jpg' })),
  };
  const routerMock = { navigate: vi.fn() };
  const toastMock = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    show: vi.fn(),
    dismiss: vi.fn(),
  };
  const routeMock = { snapshot: { paramMap: { get: () => null } } };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent, ConfirmDialogComponent],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('pide confirmación ("¿Crear producto?") antes de enviar el alta', async () => {
    component.form.set({ ...component.form(), name: 'Filtro de prueba' });

    const savePromise = component.save();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('app-confirm-dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.querySelector('h3').textContent.trim()).toBe('¿Crear producto?');
    expect(apiMock.post).not.toHaveBeenCalled();

    dialog.querySelector('.btn-danger').click();
    fixture.detectChanges();

    await savePromise;
    expect(apiMock.post).toHaveBeenCalledTimes(1);
    expect(apiMock.post).toHaveBeenCalledWith(
      '/products',
      expect.objectContaining({ name: 'Filtro de prueba' }),
    );
    expect(routerMock.navigate).toHaveBeenCalledWith(['/catalog']);
  });

  it('no guarda si se cancela la confirmación', async () => {
    component.form.set({ ...component.form(), name: 'Filtro de prueba' });

    const savePromise = component.save();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('app-confirm-dialog');
    dialog.querySelector('.btn').click();
    fixture.detectChanges();

    await savePromise;
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
