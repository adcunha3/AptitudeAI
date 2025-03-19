import { Component, OnInit } from '@angular/core';
import { HistoryService } from '../../services/history.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
  videos: any[] = [];
  feedbacks: any[] = [];

  constructor(private historyService: HistoryService, private http: HttpClient) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error("User ID not found in local storage");
      return;
    }

    this.historyService.getUserVideos(userId).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.videos = response.map((video: any) => ({
            ...video,
            streamUrl: `http://localhost:3000/api/files/file/${video.filename}/view`
          }));
        } else {
          this.videos = [];
        }
      },
      error: (err) => {
        console.error("Error fetching videos:", err);
      }
    });

    this.http.get<any[]>(`http://localhost:3000/api/feedback/feedback-history/${userId}`).subscribe({
      next: (res) => {
        this.feedbacks = res;
      },
      error: (err) => console.error("❌ Error fetching feedback history:", err)
    });
  }

  deleteVideo(videoId: string): void {
    this.historyService.deleteVideo(videoId).subscribe(
      () => {
        console.log('Video deleted successfully');
        window.location.reload(); // Reloads the full page
      },
      (error) => {
        console.error('Error deleting video:', error);
      }
    );
  }  

  
}
