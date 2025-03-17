import { Component, OnInit } from '@angular/core';
import { HistoryService } from '../../services/history.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
  videos: any[] = [];

  constructor(private historyService: HistoryService) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error("User ID not found in local storage");
      return;
    }

    this.historyService.getUserVideos(userId).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          // Add the streaming URL for each video
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
  }
}
