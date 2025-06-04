import { Module } from '@nestjs/common';
import { PositionsPresentationModule } from './presentation';

@Module({
    imports: [
        PositionsPresentationModule,
    ],
})
export class PositionModule {}