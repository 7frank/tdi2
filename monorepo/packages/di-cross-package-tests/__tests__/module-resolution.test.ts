import { describe, it, expect } from "vitest";
import * as path from "path";
import * as fs from "fs";

describe("Module Resolution Across scanDirs", () => {
  const packageADir = path.resolve(__dirname, "../fixtures/package-a");
  const packageBDir = path.resolve(__dirname, "../fixtures/package-b");

  it("should have UserService importing LoggerInterface from package-a", () => {
    const userServicePath = path.join(packageBDir, "UserService.ts");
    const content = fs.readFileSync(userServicePath, "utf-8");

    // Verify import exists
    expect(content).toContain("from '../package-a/LoggerService'");
    expect(content).toContain("LoggerInterface");
  });

  it("should have UserList importing from both packages", () => {
    const userListPath = path.join(packageBDir, "UserList.tsx");
    const content = fs.readFileSync(userListPath, "utf-8");

    // Verify imports from package-a
    expect(content).toContain("from '../package-a/LoggerService'");
    expect(content).toContain("LoggerInterface");

    // Verify imports from package-b
    expect(content).toContain("from './UserService'");
    expect(content).toContain("UserServiceInterface");
  });

  it("should have both fixture directories accessible", () => {
    expect(fs.existsSync(packageADir)).toBe(true);
    expect(fs.existsSync(packageBDir)).toBe(true);

    expect(fs.existsSync(path.join(packageADir, "LoggerService.ts"))).toBe(
      true
    );
    expect(fs.existsSync(path.join(packageBDir, "UserService.ts"))).toBe(true);
  });
});
