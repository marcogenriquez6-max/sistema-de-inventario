import { BsPipe } from './bs.pipe';

describe('BsPipe', () => {
  const pipe = new BsPipe();

  it('formatea un número con separador de miles y decimales en coma', () => {
    expect(pipe.transform(1234.56)).toBe('Bs 1.234,56');
  });

  it('formatea montos enteros con dos decimales', () => {
    expect(pipe.transform(42)).toBe('Bs 42,00');
  });

  it('acepta números como string', () => {
    expect(pipe.transform('99.9')).toBe('Bs 99,90');
  });

  it('maneja valores negativos', () => {
    expect(pipe.transform(-5.5)).toBe('-Bs 5,50');
  });

  it('devuelve Bs 0,00 para null, undefined o valores no numéricos', () => {
    expect(pipe.transform(null)).toBe('Bs 0,00');
    expect(pipe.transform(undefined)).toBe('Bs 0,00');
    expect(pipe.transform('abc')).toBe('Bs 0,00');
  });
});
