import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { UploadPageComponent } from './pages/upload/upload.page';
import { ResultsPageComponent } from './pages/results/results.page';
import { AdminPageComponent } from './pages/admin/admin.page';

const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { path: 'upload', component: UploadPageComponent },
  { path: 'results', component: ResultsPageComponent },
  { path: 'admin', component: AdminPageComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    UploadPageComponent,
    ResultsPageComponent,
    AdminPageComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
