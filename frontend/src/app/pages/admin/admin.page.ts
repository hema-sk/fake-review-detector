import { Component, OnInit } from '@angular/core';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss']
})
export class AdminPageComponent implements OnInit {
  reviews: any[] = [];
  stats: any = null;
  isLoading = true;
  filter: 'ALL' | 'FAKE' | 'GENUINE' = 'ALL';
  page = 1;
  totalPages = 1;
  total = 0;
  deletingId: string | null = null;
  deleteAllLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private reviewService: ReviewService) {}

  ngOnInit() {
    this.loadStats();
    this.loadReviews();
  }

  loadStats() {
    this.reviewService.getStats().subscribe({
      next: (s) => this.stats = s,
      error: () => {}
    });
  }

  loadReviews() {
    this.isLoading = true;
    const filterParam = this.filter !== 'ALL' ? this.filter : undefined;
    this.reviewService.getAdminReviews(this.page, 15, filterParam).subscribe({
      next: (data) => {
        this.reviews = data.reviews;
        this.total = data.total;
        this.totalPages = data.totalPages;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onFilterChange() {
    this.page = 1;
    this.loadReviews();
  }

  nextPage() { if (this.page < this.totalPages) { this.page++; this.loadReviews(); } }
  prevPage() { if (this.page > 1) { this.page--; this.loadReviews(); } }

  deleteReview(id: string) {
    this.deletingId = id;
    this.reviewService.deleteReview(id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r._id !== id);
        this.total--;
        this.deletingId = null;
        this.showMessage('Review deleted successfully.', 'success');
        this.loadStats();
      },
      error: () => { this.deletingId = null; this.showMessage('Failed to delete review.', 'error'); }
    });
  }

  deleteAllFake() {
    if (!confirm('Delete ALL fake reviews? This cannot be undone.')) return;
    this.deleteAllLoading = true;
    this.reviewService.deleteAllFake().subscribe({
      next: (res) => {
        this.deleteAllLoading = false;
        this.showMessage(res.message, 'success');
        this.loadReviews();
        this.loadStats();
      },
      error: () => { this.deleteAllLoading = false; this.showMessage('Failed to delete fake reviews.', 'error'); }
    });
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 4000);
  }
}
