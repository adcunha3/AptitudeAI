import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: "root" })
export class VideoRecordingService {

    constructor(private http: HttpClient, private router: Router) {}

    uploadFile(file: File) {
        const formData: FormData = new FormData();
        formData.append('file', file, file.name);

        this.http
            .post('http://localhost:3000/api/files/upload', formData)
            .subscribe({
                next: (res) => console.log('Upload successful:', res),
                error: (err) => console.error('Upload failed:', err),
            });
    }

    uploadBase64Image(frameData: string) {
        const payload = { frame: frameData };
        this.http
            .post<any>('http://localhost:3000/api/process-frame', payload, {
                headers: { 'Content-Type': 'application/json' }
            })
            .subscribe({
                next: (res) => console.log('Upload successful:', res),
                error: (err) => console.error('Upload failed:', err),
            });
    }

}
