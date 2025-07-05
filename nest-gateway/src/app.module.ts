import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SummModule } from './summ/summ.module';

@Module({
  imports: [SummModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
