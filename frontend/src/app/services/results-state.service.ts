import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BatchResult } from './review.service';

@Injectable({ providedIn: 'root' })
export class ResultsStateService {
  private _results = new BehaviorSubject<BatchResult | null>(null);
  results$ = this._results.asObservable();

  setResults(data: BatchResult) {
    this._results.next(data);
  }

  getResults(): BatchResult | null {
    return this._results.getValue();
  }

  clear() {
    this._results.next(null);
  }
}
