import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SeedModule } from './database/seeds/seed.module';
import { connectOptions, connectUrl } from 'src/configs/mongo.cnf';

@Module({
  imports: [
    MongooseModule.forRoot(connectUrl, connectOptions),
    UsersModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
