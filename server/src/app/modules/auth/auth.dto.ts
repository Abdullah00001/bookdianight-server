export class OAuthLoginServiceDTO {
  constructor(
    public readonly token: string,
    public readonly isUserVerified: boolean,
    public readonly role: string
  ) {}
}
