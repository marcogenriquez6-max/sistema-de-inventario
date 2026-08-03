import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send GET request with query params and unwrap response', () => {
    const expected = { foo: 'bar' };

    service.get<{ foo: string }>('/test', { page: 2, q: 'search' }).subscribe((data) => {
      expect(data).toEqual(expected);
    });

    const req = httpMock.expectOne((req) => req.method === 'GET' && req.url === '/api/test');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('q')).toBe('search');

    req.flush({ success: true, data: expected, timestamp: new Date().toISOString() });
  });

  it('should send POST request with empty body when body is undefined', () => {
    const expected = { saved: true };

    service.post<{ saved: boolean }>('/save').subscribe((data) => {
      expect(data).toEqual(expected);
    });

    const req = httpMock.expectOne('/api/save');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush({ success: true, data: expected, timestamp: new Date().toISOString() });
  });
});
