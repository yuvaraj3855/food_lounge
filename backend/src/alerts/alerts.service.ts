import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject, Observable } from 'rxjs';
import { AlertDto } from '../dto/alert.dto';
import { StorageService } from '../services/storage.service';

@Injectable()
export class AlertsService {
  private alertSubject = new Subject<AlertDto>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly storage: StorageService,
  ) {
    // Listen for alert.created events and push to SSE stream
    this.eventEmitter.on('alert.created', (alert: AlertDto) => {
      this.alertSubject.next(alert);
    });
  }

  getAlertStream(): Observable<AlertDto> {
    return this.alertSubject.asObservable();
  }

  async getAlertsByPatient(patientId: string): Promise<AlertDto[]> {
    return this.storage.getAlertsByPatient(patientId);
  }

  async getAllAlerts(): Promise<AlertDto[]> {
    return this.storage.getAllAlerts();
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.storage.updateAlert(alertId, { acknowledged: true });
    this.eventEmitter.emit('alert.acknowledged', { alertId });
  }
}

