import { Injectable } from '@nestjs/common';
import { PrivacyRepository } from './privacy.repository';
import { ConsentType } from './privacy.entity';
import { ConsentItemDto, GetRecentConsentListDto } from '@repo/dto';

@Injectable()
export class PrivacyService {
  constructor(private readonly privacyRepository: PrivacyRepository) {}

  async recordSignupConsents(
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    const currentVersion = 'v1.0';

    await Promise.all([
      this.privacyRepository.createConsent(
        userId,
        ConsentType.TERMS_OF_SERVICE,
        true,
        ipAddress,
        currentVersion,
      ),
      this.privacyRepository.createConsent(
        userId,
        ConsentType.PRIVACY_POLICY,
        true,
        ipAddress,
        currentVersion,
      ),
    ]);
  }

  async updateConsents(
    userId: string,
    items: ConsentItemDto[],
    ipAddress?: string,
  ): Promise<void> {
    const currentVersion = 'v1.0';

    await Promise.all(
      items.map((item) =>
        this.privacyRepository.createConsent(
          userId,
          item.type,
          item.agreed,
          ipAddress,
          currentVersion,
        ),
      ),
    );
  }

  async getRecentConsents(userId: string): Promise<GetRecentConsentListDto> {
    const consents = await Promise.all([
      this.privacyRepository.findLatestConsent(
        userId,
        ConsentType.PRIVACY_POLICY,
      ),
      this.privacyRepository.findLatestConsent(
        userId,
        ConsentType.TERMS_OF_SERVICE,
      ),
    ]);

    const items = consents
      .filter((c) => c !== null)
      .map(({ type, agreed }) => ({ type, agreed }));

    return { items };
  }
}
