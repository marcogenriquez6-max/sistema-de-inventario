import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StatusChipComponent } from './status-chip.component';

describe('StatusChipComponent', () => {
  let fixture: ComponentFixture<StatusChipComponent>;
  let component: StatusChipComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusChipComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusChipComponent);
    component = fixture.componentInstance;
  });

  it('should render the status label and correct chip class', () => {
    fixture.componentRef.setInput('value', 'LOW_STOCK');
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');

    expect(chip).toBeTruthy();
    expect(chip.textContent.trim()).toBe('Low Stock');
    expect(chip.classList).toContain('chip-warning');
  });
});
