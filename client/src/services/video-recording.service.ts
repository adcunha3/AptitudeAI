import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

interface FrameProcessingResponse {
    eye_contact: number;
    body_language: number;
    emotion_score: number;
    overall_score: number;
}

@Injectable({ providedIn: 'root' })
export class VideoRecordingService {

    constructor(private http: HttpClient, private router: Router) { }

    uploadFile(file: File): Observable<any> {
      const userId = localStorage.getItem('userId');
    
      if (!userId) {
        console.error('User ID not found in localStorage');
        return new Observable();
      }
    
      const formData: FormData = new FormData();
      formData.append('file', file, file.name);
      formData.append('userId', userId);
    
      console.log('Uploading file with form data:', formData);
    
      return this.http.post<any>('http://localhost:3000/api/files/upload', formData);
    }

    // Upload base64 image and process frame for analysis
    uploadBase64Image(frameData: string): Observable<FrameProcessingResponse> {
        const payload = { frame: frameData };

        return this.http.post<FrameProcessingResponse>('http://localhost:8080/process-frame', payload, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Analyze sentiment of a text (additional function)
    analyzeSentiment(text: string): Observable<{ sentiment_score: number }> {
        const payload = { text };
        return this.http.post<{ sentiment_score: number }>('http://localhost:8080/analyze-sentiment', payload, {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
