import { User } from "../db";

export class CreditsService {
  /**
   * Add credits to a user's account
   */
  static async addCredits(
    userId: string,
    credits: number,
    transactionId: string
  ) {
    if (credits <= 0) {
      throw new Error("Credits must be greater than 0");
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const newCredits = (user.credits || 0) + credits;
      await User.findByIdAndUpdate(
        userId,
        { credits: newCredits },
        { new: true }
      );

      console.log(
        `Added ${credits} credits to user ${userId}. Transaction: ${transactionId}`
      );
      return newCredits;
    } catch (error) {
      console.error("Error adding credits:", error);
      throw error;
    }
  }

  /**
   * Deduct credits from a user's account
   */
  static async deductCredits(userId: string, credits: number, reason: string) {
    if (credits <= 0) {
      throw new Error("Credits must be greater than 0");
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const currentCredits = user.credits || 0;
      if (currentCredits < credits) {
        throw new Error("Insufficient credits");
      }

      const newCredits = currentCredits - credits;
      await User.findByIdAndUpdate(
        userId,
        { credits: newCredits },
        { new: true }
      );

      console.log(
        `Deducted ${credits} credits from user ${userId}. Reason: ${reason}`
      );
      return newCredits;
    } catch (error) {
      console.error("Error deducting credits:", error);
      throw error;
    }
  }

  /**
   * Get user's current credits
   */
  static async getCredits(userId: string) {
    try {
      const user = await User.findById(userId);
      return user?.credits || 0;
    } catch (error) {
      console.error("Error getting credits:", error);
      throw error;
    }
  }
}
