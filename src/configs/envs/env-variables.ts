import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

class EnvironmentVariables {
  @IsNumber()
  @IsNotEmpty()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  @IsString()
  MONGODB_URL: string;

  @IsString()
  @IsNotEmpty()
  MONGODB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  MONGODB_PASSWORD: string;
}
export default EnvironmentVariables;
