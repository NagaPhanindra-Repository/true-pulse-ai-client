import { TestBed } from '@angular/core/testing';

import { RetroService } from './retro.service';

describe('RetroService', () => {
  let service: RetroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RetroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
