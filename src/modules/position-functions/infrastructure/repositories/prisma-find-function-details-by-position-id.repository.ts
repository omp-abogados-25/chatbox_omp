import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../integrations/prisma/prisma.service';
import { 
  AbstractFindFunctionDetailsByPositionIdRepository, 
  FunctionDetailItem
} from '../../domain/repositories';
import { Prisma } from '@prisma/client';

type PositionFunctionWithFullRoleDetails = Prisma.PositionFunctionGetPayload<{
  include: {
    roleFunction: {
      select: {
        details: true;
        notes: true;
      };
    };
  };
}>;

@Injectable()
export class PrismaFindFunctionDetailsByPositionIdRepository implements AbstractFindFunctionDetailsByPositionIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(positionId: string): Promise<FunctionDetailItem[]> {
    const positionFunctions = await this.prisma.positionFunction.findMany({
      where: {
        positionId: positionId,
      },
      include: {
        roleFunction: {
          select: {
            details: true,
            notes: true,
          },
        },
      },
    });

    if (!positionFunctions || positionFunctions.length === 0) {
      return [];
    }

    return (positionFunctions as PositionFunctionWithFullRoleDetails[]).map(pf => ({
      details: pf.roleFunction.details || 'Función no especificada',
      notes: pf.roleFunction.notes || null,
    }));
  }
} 