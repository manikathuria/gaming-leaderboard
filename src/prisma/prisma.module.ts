import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // makes it available everywhere (optional, see note below)
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
