import { ClientGrpc } from '@nestjs/microservices';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGRPC } from '../constants';
import { SUMM_SERVICE_NAME, SummServiceClient } from '../protos/summ/v1/summ';

@Injectable()
export class SummService implements OnModuleInit {
  public grpc: SummServiceClient;

  constructor(
    @Inject(ClientGRPC.SUMM_SERVICE) private readonly client: ClientGrpc,
  ) {}

  async onModuleInit() {
    this.grpc = this.client.getService<SummServiceClient>(SUMM_SERVICE_NAME);
  }
}
