import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface ReviewResult {
  id?: number;
  _id?: string;
  review?: string;
  text?: string;
  classification: 'FAKE' | 'GENUINE';
  confidence: number;
  fake_probability: number;
  genuine_probability: number;
  features: {
    fake_pattern_hits: number;
    genuine_pattern_hits: number;
    caps_ratio: number;
    exclamation_count: number;
    avg_word_length: number;
    review_length: number;
    unique_word_ratio: number;
  };
  createdAt?: string;
}

export interface BatchResult {
  total: number;
  fake_count: number;
  genuine_count: number;
  fake_percentage: number;
  genuine_percentage: number;
  avg_confidence: number;
  results: ReviewResult[];
  batchId?: string;
}

export interface DashboardStats {
  total: number;
  fake: number;
  genuine: number;
  fakePercent: number;
  genuinePercent: number;
  avgConfidence: number;
  trend: { _id: string; fake: number; genuine: number }[];
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  analyzeSingle(review: string): Observable<ReviewResult> {
    return this.http.post<ReviewResult>(`${API}/reviews/analyze`, { review });
  }

  analyzeBatch(reviews: string[]): Observable<BatchResult> {
    return this.http.post<BatchResult>(`${API}/reviews/analyze-batch`, { reviews });
  }

  uploadCsv(file: File): Observable<BatchResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<BatchResult>(`${API}/upload/csv`, form);
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${API}/reviews/stats`);
  }

  getAdminReviews(page = 1, limit = 25, filter?: string): Observable<any> {
    let url = `${API}/admin/reviews?page=${page}&limit=${limit}`;
    if (filter) url += `&filter=${filter}`;
    return this.http.get(url);
  }

  deleteReview(id: string): Observable<any> {
    return this.http.delete(`${API}/admin/reviews/${id}`);
  }

  deleteAllFake(): Observable<any> {
    return this.http.delete(`${API}/admin/reviews/bulk/fake`);
  }
}
