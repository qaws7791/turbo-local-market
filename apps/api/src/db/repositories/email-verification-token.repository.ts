import { emailVerificationTokens } from "@/db/schema";
import { type DbClient, EmailVerificationTokenSelect } from "@/db/types";
import { DatabaseError } from "@/errors/database-error";
import { and, eq, gte, lte } from "drizzle-orm";
import status from "http-status";
import { inject, injectable } from "inversify";

@injectable()
export class EmailVerificationTokenRepository {
  constructor(
    @inject("db")
    private db: DbClient,
  ) {}

  async findValidTokenByUserId(
    userId: number,
  ): Promise<EmailVerificationTokenSelect | undefined> {
    return this.db.query.emailVerificationTokens.findFirst({
      where: and(
        eq(emailVerificationTokens.userId, userId),
        gte(emailVerificationTokens.expiresAt, new Date()),
      ),
    });
  }

  async findValidTokenByToken(
    token: string,
  ): Promise<EmailVerificationTokenSelect | undefined> {
    return this.db.query.emailVerificationTokens.findFirst({
      where: and(
        eq(emailVerificationTokens.token, token),
        gte(emailVerificationTokens.expiresAt, new Date()),
      ),
    });
  }

  async createToken(
    tokenData: typeof emailVerificationTokens.$inferInsert,
  ): Promise<EmailVerificationTokenSelect> {
    const [newToken] = await this.db
      .insert(emailVerificationTokens)
      .values(tokenData)
      .returning();
    if (!newToken) {
      throw new DatabaseError(
        "Failed to create email verification token",
        status.INTERNAL_SERVER_ERROR,
      );
    }
    return newToken;
  }

  async deleteTokenByUserId(userId: number): Promise<void> {
    await this.db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.db
      .delete(emailVerificationTokens)
      .where(lte(emailVerificationTokens.expiresAt, new Date()));
  }
}
