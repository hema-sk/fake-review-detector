import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { ResultsStateService } from '../../services/results-state.service';

@Component({
  selector: 'app-upload-page',
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.scss']
})
export class UploadPageComponent {
  mode: 'paste' | 'csv' = 'paste';
  pastedText = '';
  selectedFile: File | null = null;
  isLoading = false;
  error = '';
  dragOver = false;

  constructor(
    private reviewService: ReviewService,
    private stateService: ResultsStateService,
    private router: Router
  ) {}

  get reviewLines(): string[] {
    return this.pastedText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 5);
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile = input.files[0];
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.csv')) this.selectedFile = file;
    else this.error = 'Please drop a valid CSV file.';
  }

  onDragOver(event: DragEvent) { event.preventDefault(); this.dragOver = true; }
  onDragLeave() { this.dragOver = false; }

  analyze() {
    this.error = '';
    if (this.mode === 'paste') {
      const reviews = this.reviewLines;
      if (!reviews.length) { this.error = 'Please enter at least one review (10+ characters).'; return; }
      this.isLoading = true;
      if (reviews.length === 1) {
        this.reviewService.analyzeSingle(reviews[0]).subscribe({
          next: (result) => {
            this.stateService.setResults({
              total: 1,
              fake_count: result.classification === 'FAKE' ? 1 : 0,
              genuine_count: result.classification === 'GENUINE' ? 1 : 0,
              fake_percentage: result.classification === 'FAKE' ? 100 : 0,
              genuine_percentage: result.classification === 'GENUINE' ? 100 : 0,
              avg_confidence: result.confidence,
              results: [result],
            });
            this.router.navigate(['/results']);
          },
          error: (err) => { this.error = err.error?.error || 'Analysis failed.'; this.isLoading = false; }
        });
      } else {
        this.reviewService.analyzeBatch(reviews).subscribe({
          next: (result) => { this.stateService.setResults(result); this.router.navigate(['/results']); },
          error: (err) => { this.error = err.error?.error || 'Analysis failed.'; this.isLoading = false; }
        });
      }
    } else {
      if (!this.selectedFile) { this.error = 'Please select a CSV file.'; return; }
      this.isLoading = true;
      this.reviewService.uploadCsv(this.selectedFile).subscribe({
        next: (result) => { this.stateService.setResults(result); this.router.navigate(['/results']); },
        error: (err) => { this.error = err.error?.error || 'Upload failed.'; this.isLoading = false; }
      });
    }
  }
}
