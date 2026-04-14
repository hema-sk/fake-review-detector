import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ResultsStateService } from '../../services/results-state.service';
import { BatchResult, ReviewResult } from '../../services/review.service';

@Component({
  selector: 'app-results-page',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss']
})
export class ResultsPageComponent implements OnInit {
  results: BatchResult | null = null;
  filter: 'ALL' | 'FAKE' | 'GENUINE' = 'ALL';
  sortBy: 'confidence' | 'classification' = 'confidence';

  constructor(
    private stateService: ResultsStateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.results = this.stateService.getResults();
    if (!this.results) this.router.navigate(['/upload']);
  }

  get filteredResults(): ReviewResult[] {
    if (!this.results) return [];
    let list = [...this.results.results];
    if (this.filter !== 'ALL') list = list.filter(r => r.classification === this.filter);
    if (this.sortBy === 'confidence') list.sort((a, b) => b.confidence - a.confidence);
    return list;
  }

  get donutStyle(): string {
    const fake = this.results?.fake_percentage ?? 0;
    return `conic-gradient(#f87171 0% ${fake}%, #4ade80 ${fake}% 100%)`;
  }

  confidenceLabel(conf: number): string {
    if (conf >= 0.85) return 'Very High';
    if (conf >= 0.70) return 'High';
    if (conf >= 0.55) return 'Medium';
    return 'Low';
  }

  goBack() {
    this.stateService.clear();
    this.router.navigate(['/upload']);
  }
}
