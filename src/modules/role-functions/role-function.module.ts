import { Module } from '@nestjs/common';
import { RoleFunctionsPresentationModule } from './presentation';

@Module({
    imports: [
        RoleFunctionsPresentationModule,
    ],
})
export class RoleFunctionModule {} 