import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent implements OnInit {
  leaderboard: { rank: number, username: string, averageScore: number }[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getLeaderboard();
  }

  getLeaderboard(): void {

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    this.http.get<any[]>(`http://localhost:3000/api/profiles`, { headers })
      .subscribe((users) => {
        this.leaderboard = users.map((user, index) => ({
          rank: index + 1,
          username: user.username,
          averageScore: user.averageScore
        }));
      }, (error) => {
        console.error('Error fetching leaderboard:', error);
      });
  }
}