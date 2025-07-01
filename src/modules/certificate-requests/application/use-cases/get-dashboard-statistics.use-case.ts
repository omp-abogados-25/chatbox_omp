import { Injectable, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { AbstractFindAllUsersRepository } from '../../../users/domain/repositories/user-repository.actions';

export interface DashboardStatistics {
  users: {
    total: number;
    active: number;
    inactive: number;
    can_login: number;
  };
  certificate_requests: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
    waiting_info: number;
    documents_generated: number;
    documents_sent: number;
  };
  today_requests: number;
  certificate_types: {
    con_sueldo: number;
    sin_sueldo: number;
    con_funciones: number;
    sin_funciones: number;
  };
}

@Injectable()
export class GetDashboardStatisticsUseCase {
  constructor(
    @Inject(AbstractFindAllUsersRepository)
    private readonly findAllUsersRepository: AbstractFindAllUsersRepository,
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(): Promise<DashboardStatistics> {
    // Obtener estadísticas de usuarios
    const allUsers = await this.findAllUsersRepository.execute();
    const activeUsers = allUsers.filter(user => user.is_active);
    const inactiveUsers = allUsers.filter(user => !user.is_active);
    const usersCanLogin = allUsers.filter(user => user.password && user.is_active);

    // Obtener todas las solicitudes de certificados
    const allRequestsResult = await this.certificateRequestRepository.findAll();
    const allRequests = allRequestsResult.data;

    // Calcular estadísticas de solicitudes
    const requestStats = {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === 'PENDING').length,
      in_progress: allRequests.filter(r => r.status === 'IN_PROGRESS').length,
      completed: allRequests.filter(r => r.status === 'COMPLETED').length,
      failed: allRequests.filter(r => r.status === 'FAILED').length,
      cancelled: allRequests.filter(r => r.status === 'CANCELLED').length,
      waiting_info: allRequests.filter(r => r.status === 'WAITING_INFO').length,
      documents_generated: allRequests.filter(r => r.document_generated).length,
      documents_sent: allRequests.filter(r => r.document_sent).length,
    };

    // Solicitudes de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRequests = allRequests.filter(r => {
      const requestDate = new Date(r.created_at);
      return requestDate >= today && requestDate < tomorrow;
    });

    // Estadísticas por tipo de certificado
    const certificateTypes = {
      con_sueldo: allRequests.filter(r => 
        r.certificate_type.includes('con_sueldo') || 
        r.certificate_type === 'con_funciones'
      ).length,
      sin_sueldo: allRequests.filter(r => 
        r.certificate_type.includes('sin_sueldo') || 
        r.certificate_type === 'sin_funciones'
      ).length,
      con_funciones: allRequests.filter(r => 
        r.certificate_type.includes('con_funciones')
      ).length,
      sin_funciones: allRequests.filter(r => 
        r.certificate_type.includes('sin_funciones')
      ).length,
    };

    return {
      users: {
        total: allUsers.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
        can_login: usersCanLogin.length,
      },
      certificate_requests: requestStats,
      today_requests: todayRequests.length,
      certificate_types: certificateTypes,
    };
  }
} 