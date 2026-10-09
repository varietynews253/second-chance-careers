import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'second-chance-careers-api',
      timestamp: new Date().toISOString(),
    };
  }
}
