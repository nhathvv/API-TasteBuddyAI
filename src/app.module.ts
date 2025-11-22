import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SeedModule } from './database/seeds/seed.module';
import { FoodsModule } from './foods/foods.module';
import { MenuModule } from '@/modules/menu/menu.module';
import { connectOptions, connectUrl } from 'src/configs/mongo.cnf';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(connectUrl, connectOptions),
    UsersModule,
    SeedModule,
    FoodsModule,
    MenuModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
