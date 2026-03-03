import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    // Returning the text with both body background as black, and colored message in HTML
    return `
      <body style="background: black; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh;">
        <p style="color: #f97316; font-weight: bold; font-size: 2em;">
          Mini Time Tracker API is running successfully!
        </p>
        <p style="font-weight: bold; font-size: 1.2em;">
          🚀 🎉 🥳
        </p>
      </body>
    `;
  }
}
