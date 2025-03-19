import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {

  constructor(private http: HttpClient) {}

  getUserVideos(userId: string): Observable<any> {
    const token = localStorage.getItem('userToken');

    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : {};
    return this.http.get(`http://localhost:3000/api/files/file/${userId}/videos`, { headers });
  }
}