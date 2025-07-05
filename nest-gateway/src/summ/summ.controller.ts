import { Controller, Get, Query } from '@nestjs/common';
import { SummServiceController } from 'src/protos/summ/v1/summ';
import { SummService } from './summ.service';
import { SummDto } from './dto';

@Controller('summ')
export class SummController implements SummServiceController {
  constructor(private readonly summService: SummService) {}

  @Get('/')
  Sum(@Query() request: SummDto) {
    return this.summService.grpc.Sum(request);
  }
}
