import { PartialType } from '@nestjs/mapped-types';
import { CreatePortafolioDto } from './create-portafolio.dto';

export class UpdatePortafolioDto extends PartialType(CreatePortafolioDto) {}
