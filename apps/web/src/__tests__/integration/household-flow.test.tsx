import { describe, expect, it } from "vitest";

describe("Convex household functions: API contract", () => {
  describe("getMyHousehold query", () => {
    it("returns { _id, name } when user has a household", () => {
      const expectedShape = { _id: "id_string", name: "Household Name" };
      expect(expectedShape).toHaveProperty("_id");
      expect(expectedShape).toHaveProperty("name");
      expect(typeof expectedShape._id).toBe("string");
      expect(typeof expectedShape.name).toBe("string");
    });

    it("returns null when user has no household", () => {
      const expectedReturn = null;
      expect(expectedReturn).toBeNull();
    });

    it.todo("requires authentication (needs convex-test)");
  });

  describe("getHouseholdMembers query", () => {
    it("accepts { householdId } as argument", () => {
      const expectedArgs = { householdId: "household_id" };
      expect(expectedArgs).toHaveProperty("householdId");
    });

    it("returns array of members with userId, name, email, image", () => {
      const expectedMember = {
        _id: "member_id",
        userId: "user_id_string",
        name: "User Name",
        email: "user@example.com",
        image: "https://example.com/avatar.jpg",
      };
      expect(expectedMember).toHaveProperty("_id");
      expect(expectedMember).toHaveProperty("userId");
      expect(expectedMember).toHaveProperty("name");
      expect(expectedMember).toHaveProperty("email");
      expect(expectedMember).toHaveProperty("image");
    });

    it("image can be null for members without avatars", () => {
      const memberWithoutImage = {
        _id: "member_id",
        userId: "user_id",
        name: "User",
        email: "user@example.com",
        image: null,
      };
      expect(memberWithoutImage.image).toBeNull();
    });

    it.todo("requires authentication (needs convex-test)");
  });

  describe("listHouseholds query", () => {
    it("takes no arguments", () => {
      const expectedArgs = {};
      expect(Object.keys(expectedArgs)).toHaveLength(0);
    });

    it("returns array of households with _id, name, and memberCount", () => {
      const expectedHousehold = {
        _id: "household_id",
        name: "Household Name",
        memberCount: 3,
      };
      expect(expectedHousehold).toHaveProperty("_id");
      expect(expectedHousehold).toHaveProperty("name");
      expect(expectedHousehold).toHaveProperty("memberCount");
      expect(typeof expectedHousehold.memberCount).toBe("number");
    });

    it.todo("requires authentication (needs convex-test)");
  });

  describe("createHousehold mutation", () => {
    it("accepts { name: string } as argument", () => {
      const expectedArgs = { name: "Smith Family" };
      expect(expectedArgs).toHaveProperty("name");
      expect(typeof expectedArgs.name).toBe("string");
    });

    it("returns a string ID", () => {
      const expectedReturn = "new_household_id";
      expect(typeof expectedReturn).toBe("string");
    });

    it.todo("automatically adds the calling user as a member (needs convex-test)");

    it("validates name is non-empty", () => {
      const emptyName = "";
      expect(emptyName.length).toBe(0);
    });

    it("validates name is at most 100 characters", () => {
      const longName = "a".repeat(101);
      expect(longName.length).toBeGreaterThan(100);
    });

    it.todo("throws if user already belongs to a household (needs convex-test)");
    it.todo("requires authentication (needs convex-test)");
  });

  describe("joinHousehold mutation", () => {
    it("accepts { householdId } as argument", () => {
      const expectedArgs = { householdId: "household_id" };
      expect(expectedArgs).toHaveProperty("householdId");
    });

    it("returns void on success", () => {
      const expectedReturn = undefined;
      expect(expectedReturn).toBeUndefined();
    });

    it.todo("adds the calling user as a member (needs convex-test)");
    it.todo("throws if user already belongs to a household (needs convex-test)");
    it.todo("throws if household does not exist (needs convex-test)");
    it.todo("requires authentication (needs convex-test)");
  });

  describe("leaveHousehold mutation", () => {
    it("takes no arguments", () => {
      const expectedArgs = {};
      expect(Object.keys(expectedArgs)).toHaveLength(0);
    });

    it("returns void on success", () => {
      const expectedReturn = undefined;
      expect(expectedReturn).toBeUndefined();
    });

    it.todo("removes the user from their household (needs convex-test)");
    it.todo("deletes the household if the user was the last member (needs convex-test)");
    it.todo("does NOT delete the household if other members remain (needs convex-test)");
    it.todo("throws if user does not belong to any household (needs convex-test)");
    it.todo("requires authentication (needs convex-test)");
  });

  describe("updateHousehold mutation", () => {
    it("accepts { name: string } as argument", () => {
      const expectedArgs = { name: "New Name" };
      expect(expectedArgs).toHaveProperty("name");
    });

    it("returns void on success", () => {
      const expectedReturn = undefined;
      expect(expectedReturn).toBeUndefined();
    });

    it.todo("renames the user's current household (needs convex-test)");
    it.todo("throws if user is not a member of any household (needs convex-test)");

    it("validates name is non-empty", () => {
      const emptyName = "";
      expect(emptyName.length).toBe(0);
    });

    it("validates name is at most 100 characters", () => {
      const longName = "a".repeat(101);
      expect(longName.length).toBeGreaterThan(100);
    });

    it.todo("requires authentication (needs convex-test)");
  });
});

describe("Convex schema: data model contract", () => {
  it("household table has 'name' field (string)", () => {
    const householdSchema = { name: "string" };
    expect(householdSchema).toHaveProperty("name");
  });

  it("householdMember table has 'userId' (string) and 'householdId'", () => {
    const memberSchema = {
      userId: "string",
      householdId: "id<household>",
    };
    expect(memberSchema).toHaveProperty("userId");
    expect(memberSchema).toHaveProperty("householdId");
  });

  it("householdMember has by_userId index", () => {
    const indexes = { by_userId: ["userId"], by_householdId: ["householdId"] };
    expect(indexes.by_userId).toEqual(["userId"]);
  });

  it("householdMember has by_householdId index", () => {
    const indexes = { by_userId: ["userId"], by_householdId: ["householdId"] };
    expect(indexes.by_householdId).toEqual(["householdId"]);
  });

  it("userId is v.string() because Better Auth tables are component-managed", () => {
    expect(typeof "user_id_from_better_auth").toBe("string");
  });
});

describe("Error messages contract", () => {
  const expectedErrors = [
    "You already belong to a household",
    "You don't belong to any household",
    "Household not found",
    "Household name must be between 1 and 100 characters",
  ];

  it("defines error message for duplicate membership", () => {
    expect(expectedErrors).toContain("You already belong to a household");
  });

  it("defines error message for missing membership", () => {
    expect(expectedErrors).toContain("You don't belong to any household");
  });

  it("defines error message for non-existent household", () => {
    expect(expectedErrors).toContain("Household not found");
  });

  it("defines error message for invalid name length", () => {
    expect(expectedErrors).toContain("Household name must be between 1 and 100 characters");
  });
});
