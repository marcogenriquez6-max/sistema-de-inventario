import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { DocRecord, Paginated } from '../../core/models';

const FILE_CHIP: Record<string, string> = {
  PDF: 'chip-danger',
  IMAGE: 'chip-info',
  XLSX: 'chip-success',
  DOCX: 'chip-neutral',
  OTHER: 'chip-neutral',
};

@Component({
  selector: 'app-documents',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Gestión documental</h1>
          <p class="muted small">Registro y control de documentos</p>
        </div>
        <button class="btn btn-primary" (click)="open()">+ Registrar documento</button>
      </div>

      <div class="card">
        <div class="toolbar">
          <input
            class="input search"
            placeholder="Filtrar por categoría…"
            [(ngModel)]="category"
            (keyup.enter)="load(1)"
          />
          <button class="btn btn-primary" (click)="load(1)">Filtrar</button>
          <button class="btn btn-ghost" (click)="reset()">Limpiar</button>
        </div>

        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Referencia</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (d of items(); track d.id) {
                <tr>
                  <td>
                    <strong>{{ d.name }}</strong>
                  </td>
                  <td>
                    <span [class]="'chip ' + chip(d.fileType)">{{ d.fileType }}</span>
                  </td>
                  <td>{{ d.category || '—' }}</td>
                  <td>
                    @if (d.referenceType && d.referenceId) {
                      <span class="mono">{{ d.referenceType }}:{{ d.referenceId }}</span>
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                  <td class="small muted">{{ d.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm text-danger" (click)="remove(d)">
                      Eliminar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty">
                      <div class="icon">📄</div>
                      Sin documentos
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span>{{ meta().totalItems }} documentos</span>
          <div class="pages">
            <button (click)="load(meta().page - 1)" [disabled]="meta().page <= 1">‹</button>
            <span class="muted">Página {{ meta().page }} de {{ meta().totalPages || 1 }}</span>
            <button (click)="load(meta().page + 1)" [disabled]="meta().page >= meta().totalPages">
              ›
            </button>
          </div>
        </div>
      </div>

      @if (showModal()) {
        <div class="backdrop" (click)="close()">
          <div class="modal" (click)="$event.stopPropagation()" [class.submitted]="submitted()">
            <h3>Registrar documento</h3>
            <div class="field">
              <label>Nombre *</label>
              <input class="input" [(ngModel)]="form().name" name="name" required />
            </div>
            <div class="field">
              <label>Tipo de archivo</label>
              <select class="select" [(ngModel)]="form().fileType" name="fileType">
                <option value="PDF">PDF</option>
                <option value="IMAGE">Imagen</option>
                <option value="XLSX">Excel</option>
                <option value="DOCX">Word</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div class="field">
              <label>Categoría</label>
              <input
                class="input"
                [(ngModel)]="form().category"
                name="category"
                placeholder="p. ej. Factura, Contrato…"
              />
            </div>
            <div class="field">
              <label>Notas</label>
              <textarea
                class="input"
                [(ngModel)]="form().notes"
                name="notes"
                placeholder="Descripción adicional…"
              ></textarea>
            </div>
            <div class="actions">
              <button class="btn" (click)="close()">Cancelar</button>
              <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .search {
      max-width: 420px;
    }
    .btn-sm {
      padding: 4px 10px;
      font-size: 12.5px;
    }
    .text-danger {
      color: var(--danger);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 25, 0.45);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 20px;
      width: min(520px, calc(100vw - 32px));
      max-height: 90vh;
      overflow-y: auto;
    }
  `,
})
export class DocumentsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<DocRecord[]>([]);
  meta = signal({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  category = '';

  showModal = signal(false);
  form = signal({ name: '', fileType: 'PDF', category: '', notes: '' });
  saving = signal(false);
  submitted = signal(false);

  constructor() {
    this.load(1);
  }

  load(page: number): void {
    this.api
      .get<Paginated<DocRecord>>('/documents', {
        page,
        pageSize: 20,
        category: this.category || undefined,
      })
      .subscribe((res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
      });
  }

  reset(): void {
    this.category = '';
    this.load(1);
  }

  chip(t: string): string {
    return FILE_CHIP[t] ?? 'chip-neutral';
  }

  open(): void {
    this.form.set({ name: '', fileType: 'PDF', category: '', notes: '' });
    this.submitted.set(false);
    this.showModal.set(true);
  }

  close(): void {
    if (this.saving()) return;
    this.showModal.set(false);
  }

  async save(): Promise<void> {
    const f = this.form();
    if (!f.name.trim()) {
      this.submitted.set(true);
      this.toast.error('Complete los campos obligatorios (marcados en rojo)');
      return;
    }
    this.saving.set(true);
    try {
      await this.api
        .post('/documents', {
          name: f.name.trim(),
          fileType: f.fileType,
          category: f.category.trim() || undefined,
          notes: f.notes.trim() || undefined,
        })
        .toPromise();
      this.toast.success('Documento registrado');
      this.showModal.set(false);
      this.load(1);
    } catch {
      /* toast del interceptor */
    } finally {
      this.saving.set(false);
    }
  }

  async remove(d: DocRecord): Promise<void> {
    if (!confirm(`¿Eliminar el documento "${d.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await this.api.delete(`/documents/${d.id}`).toPromise();
      this.toast.success('Documento eliminado');
      this.load(this.meta().page);
    } catch {
      /* toast del interceptor */
    }
  }
}
