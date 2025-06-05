import { Module } from '@nestjs/common';
import { UsersPresentationModule } from './presentation';

@Module({
    imports: [
        UsersPresentationModule,
    ],
})
export class UserModule {} 