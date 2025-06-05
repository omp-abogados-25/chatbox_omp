import { Module } from '@nestjs/common';
import { PositionFunctionsPresentationModule } from './presentation';
import { PositionFunctionsApplicationModule } from './application';
import { PositionFunctionsInfrastructureModule } from './infrastructure';

@Module({
    imports: [
        PositionFunctionsPresentationModule,
        PositionFunctionsApplicationModule,
        PositionFunctionsInfrastructureModule,
    ],
    exports: [
        PositionFunctionsApplicationModule,
    ]
})
export class PositionFunctionModule {} 