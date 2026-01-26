import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRetroComponent } from './create-retro.component';

describe('CreateRetroComponent', () => {
  let component: CreateRetroComponent;
  let fixture: ComponentFixture<CreateRetroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateRetroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateRetroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
