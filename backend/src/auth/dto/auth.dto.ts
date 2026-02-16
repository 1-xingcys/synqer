import { IsNotEmpty, IsString } from 'class-validator';

export class LiffLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}

export class AuthUserResponseDto {
  id!: string;
  displayName!: string | null;
  primaryEmail!: string | null;
  avatarUrl!: string | null;
  providers!: string[];
}

export class LogoutResponseDto {
  message!: string;
}
