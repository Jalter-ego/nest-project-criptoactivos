import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { FeedbackType } from "../enums/feedback.enum";

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  portafolioId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(FeedbackType) 
  @IsNotEmpty()
  type: FeedbackType;
}