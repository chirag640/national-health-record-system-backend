import { Module, Global } from '@nestjs/common';
import { PasswordPolicyService } from './password-policy.service';
import { PIISanitizerService } from './pii-sanitizer.service';
import { RateLimitGuard } from './rate-limit.guard';

@Global()
@Module({
  providers: [PasswordPolicyService, PIISanitizerService, RateLimitGuard],
  exports: [PasswordPolicyService, PIISanitizerService, RateLimitGuard],
})
export class SecurityModule {}
