import { Module } from '@nestjs/common';
import { SummService } from './summ.service';
import { SummController } from './summ.controller';
import { ClientGRPC } from 'src/constants';
import { SUMM_V1_PACKAGE_NAME } from 'src/protos/summ/v1/summ';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ClientGRPC.SUMM_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: [SUMM_V1_PACKAGE_NAME],
          protoPath: '../protos/summ/v1/summ.proto',
          url: 'localhost:5335',
        },
      },
    ]),
  ],
  providers: [SummService],
  controllers: [SummController],
})
export class SummModule {}
